import supabase from "../config/supabaseClient.js";

//Endpoint for the discover developers page.. this part we are removing  liked developers.. those that liked you, and the ones you are already matched with
// Endpoint for the discover developers page
// This removes: liked users, incoming likes, and already matched users
export const getDiscoverUsers = async (req, res) => {
  try {
    const { userid } = req.params;
    if (!userid) return res.status(400).json({ error: "Missing user ID" });

    // ─────────────────────────────────────────────
    // 1. Get outgoing swipes (you → others)
    // ─────────────────────────────────────────────
    const { data: outgoing, error: outError } = await supabase
      .from("swipes")
      .select("target_id")
      .eq("user_id", userid);

    if (outError) throw outError;

    // ─────────────────────────────────────────────
    // 2. Get incoming swipes (others → you)
    // ─────────────────────────────────────────────
    const { data: incoming, error: inError } = await supabase
      .from("swipes")
      .select("user_id")
      .eq("target_id", userid);

    if (inError) throw inError;

    // ─────────────────────────────────────────────
    // 3. Build exclusion list
    // ─────────────────────────────────────────────
    const outgoingIds = (outgoing || []).map((i) => i.target_id);
    const incomingIds = (incoming || []).map((i) => i.user_id);

    const excludedIds = [...new Set([...outgoingIds, ...incomingIds])];

    // ─────────────────────────────────────────────
    // 4. Base query (ONLY completed profiles)
    // ─────────────────────────────────────────────
    let query = supabase
      .from("users")
      .select("*")
      .neq("userid", userid)
      .eq("step_prefs", true);

    // Exclude interacted users
    if (excludedIds.length > 0) {
      query = query.not("userid", "in", `(${excludedIds.join(",")})`);
    }

    // ─────────────────────────────────────────────
    // 5. Fetch users
    // ─────────────────────────────────────────────
    const { data: users, error: usersError } = await query;

    if (usersError) throw usersError;

    // ─────────────────────────────────────────────
    // 6. Fetch enrichment data
    // ─────────────────────────────────────────────
    const { data: skillsData } = await supabase
      .from("user_skills")
      .select("userid, skill:skill_id(name)");

    const { data: goalsData } = await supabase
      .from("user_goals")
      .select("userid, goal:goal_id(name)");

    const { data: reposData } = await supabase
      .from("user_repos")
      .select("userid");

    const reposCount = (reposData || []).reduce((acc, p) => {
      acc[p.userid] = (acc[p.userid] || 0) + 1;
      return acc;
    }, {});

    // ─────────────────────────────────────────────
    // 7. Map data
    // ─────────────────────────────────────────────
    const usersWithDetails = (users || []).map((user) => {
      const userSkills = (skillsData || [])
        .filter((s) => s.userid === user.userid)
        .map((s) => s.skill?.name)
        .filter(Boolean)
        .slice(0, 5);

      const userGoals = (goalsData || [])
        .filter((g) => g.userid === user.userid)
        .map((g) => g.goal?.name)
        .filter(Boolean)
        .slice(0, 2);

      return {
        ...user,
        stack: userSkills,
        goals: userGoals,
        projects: reposCount[user.userid] || 0,
        avatarUrl: user.avatarUrl || null,
      };
    });

    // ─────────────────────────────────────────────
    // 8. Response
    // ─────────────────────────────────────────────
    return res.status(200).json(usersWithDetails);
  } catch (error) {
    console.error("Error fetching discover users:", error);
    return res.status(500).json({ error: error.message });
  }
};

//Endpoint for likes (matching logic)
export const handleUserAction = async (req, res) => {
  try {
    const { user_id, target_id, action } = req.body;

    if (!user_id || !target_id || !action) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (user_id === target_id) {
      return res.status(400).json({ error: "Invalid action" });
    }

    // normalize actions
    let finalAction = action;

    // ─────────────────────────────
    // WITHDRAW = PASS
    // ─────────────────────────────
    if (action === "withdraw") {
      finalAction = "pass";
    }

    if (!["like", "pass"].includes(finalAction)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    // ─────────────────────────────
    // CHECK EXISTING SWIPE
    // ─────────────────────────────
    const { data: existing, error: findError } = await supabase
      .from("swipes")
      .select("*")
      .eq("user_id", user_id)
      .eq("target_id", target_id)
      .maybeSingle();

    if (findError) throw findError;

    let result;

    // ─────────────────────────────
    // UPDATE IF EXISTS
    // ─────────────────────────────
    if (existing) {
      const { data, error } = await supabase
        .from("swipes")
        .update({ action: finalAction })
        .eq("user_id", user_id)
        .eq("target_id", target_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // ─────────────────────────────
    // INSERT IF NEW
    // ─────────────────────────────
    else {
      const { data, error } = await supabase
        .from("swipes")
        .insert([
          {
            user_id,
            target_id,
            action: finalAction,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return res.status(200).json({
      success: true,
      swipe: result,
    });
  } catch (err) {
    console.error("Interaction error:", err);
    return res.status(500).json({ error: err.message });
  }
};

//fetching pending matches
export const getPendingLikes = async (req, res) => {
  try {
    const { userid } = req.params;

    if (!userid) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    // 1. Get users who liked current user
    const { data: likes, error: likesError } = await supabase
      .from("swipes")
      .select("user_id")
      .eq("target_id", userid)
      .eq("action", "like");

    if (likesError) throw likesError;

    const likerIds = likes.map((l) => l.user_id);

    if (likerIds.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Get existing matches
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userid},user2_id.eq.${userid}`);

    if (matchError) throw matchError;

    const matchedIds = new Set();

    matches.forEach((m) => {
      if (m.user1_id === userid) matchedIds.add(m.user2_id);
      else matchedIds.add(m.user1_id);
    });

    // 3. Fetch users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .in("userid", likerIds);

    if (usersError) throw usersError;

    if (!users) return res.status(200).json([]);

    // 4. Fetch skills + goals + repos (same enrichment as matches endpoint)
    const { data: skillsData } = await supabase
      .from("user_skills")
      .select("userid, skill:skill_id(name)");

    const { data: goalsData } = await supabase
      .from("user_goals")
      .select("userid, goal:goal_id(name)");

    const { data: reposData } = await supabase
      .from("user_repos")
      .select("userid");

    const repoCount = reposData.reduce((acc, r) => {
      acc[r.userid] = (acc[r.userid] || 0) + 1;
      return acc;
    }, {});

    // 5. Filter + enrich
    const pending = users
      .filter((u) => !matchedIds.has(u.userid))
      .map((u) => {
        const stack = skillsData
          .filter((s) => s.userid === u.userid)
          .map((s) => s.skill?.name)
          .filter(Boolean);

        const goals = goalsData
          .filter((g) => g.userid === u.userid)
          .map((g) => g.goal?.name)
          .filter(Boolean);

        return {
          ...u,
          stack,
          goals,
          projects: repoCount[u.userid] || 0,
          matchedAgo: null,
          avatarUrl: u.avatarUrl || null,
        };
      });

    return res.status(200).json(pending);
  } catch (err) {
    console.error("Pending likes error:", err);
    return res.status(500).json({ error: err.message });
  }
};

//get matches
export const getMatches = async (req, res) => {
  try {
    const { userid } = req.params;

    if (!userid) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    // 1. Get all matches involving user
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .or(`user1_id.eq.${userid},user2_id.eq.${userid}`);

    if (matchError) throw matchError;

    if (!matches || matches.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Extract "other users"
    const otherUserIds = matches.map((m) =>
      m.user1_id === userid ? m.user2_id : m.user1_id,
    );

    // 3. Fetch users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .in("userid", otherUserIds);

    if (usersError) throw usersError;

    // 4. Fetch skills
    const { data: skillsData } = await supabase
      .from("user_skills")
      .select("userid, skill:skill_id(name)");

    // 5. Fetch goals
    const { data: goalsData } = await supabase
      .from("user_goals")
      .select("userid, goal:goal_id(name)");

    // 6. Fetch repos count
    const { data: reposData } = await supabase
      .from("user_repos")
      .select("userid");

    const repoCount = reposData.reduce((acc, r) => {
      acc[r.userid] = (acc[r.userid] || 0) + 1;
      return acc;
    }, {});

    // 7. Enrich users
    const enriched = users.map((u) => {
      const stack = skillsData
        .filter((s) => s.userid === u.userid)
        .map((s) => s.skill?.name)
        .filter(Boolean);

      const goals = goalsData
        .filter((g) => g.userid === u.userid)
        .map((g) => g.goal?.name)
        .filter(Boolean);

      return {
        ...u,
        match_id: matches.find(
          (m) =>
            (m.user1_id === userid && m.user2_id === u.userid) ||
            (m.user2_id === userid && m.user1_id === u.userid),
        )?.match_id,
        stack,
        goals,
        projects: repoCount[u.userid] || 0,
        matchedAgo: "recently",
      };
    });

    return res.status(200).json(enriched);
  } catch (err) {
    console.error("getMatches error:", err);
    return res.status(500).json({ error: err.message });
  }
};

//get pending requests(the one's the user liked first)
export const getSentPendingLikes = async (req, res) => {
  try {
    const { userid } = req.params;

    if (!userid) {
      return res.status(400).json({ error: "Missing user ID" });
    }

    //Get users You liked
    const { data: likes, error: likesError } = await supabase
      .from("swipes")
      .select("target_id")
      .eq("user_id", userid)
      .eq("action", "like");

    if (likesError) throw likesError;

    const likedIds = likes.map((l) => l.target_id);

    if (likedIds.length === 0) {
      return res.status(200).json([]);
    }

    //Get matches (to exclude them cause these are just pending)
    const { data: matches, error: matchError } = await supabase
      .from("matches")
      .select("user1_id, user2_id")
      .or(`user1_id.eq.${userid},user2_id.eq.${userid}`);

    if (matchError) throw matchError;

    const matchedIds = new Set();

    matches.forEach((m) => {
      if (m.user1_id === userid) matchedIds.add(m.user2_id);
      else matchedIds.add(m.user1_id);
    });

    //Fetch users you liked
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .in("userid", likedIds);

    if (usersError) throw usersError;

    if (!users) return res.status(200).json([]);

    //Fetch enrichment data for the cards
    const { data: skillsData } = await supabase
      .from("user_skills")
      .select("userid, skill:skill_id(name)");

    const { data: goalsData } = await supabase
      .from("user_goals")
      .select("userid, goal:goal_id(name)");

    const { data: reposData } = await supabase
      .from("user_repos")
      .select("userid");

    const repoCount = reposData.reduce((acc, r) => {
      acc[r.userid] = (acc[r.userid] || 0) + 1;
      return acc;
    }, {});

    // 5. Filter out matches + enrich
    const pendingSent = users
      .filter((u) => !matchedIds.has(u.userid))
      .map((u) => {
        const stack = skillsData
          .filter((s) => s.userid === u.userid)
          .map((s) => s.skill?.name)
          .filter(Boolean);

        const goals = goalsData
          .filter((g) => g.userid === u.userid)
          .map((g) => g.goal?.name)
          .filter(Boolean);

        return {
          ...u,
          stack,
          goals,
          projects: repoCount[u.userid] || 0,
          avatarUrl: u.avatarUrl || null,
          pendingType: "sent",
        };
      });

    return res.status(200).json(pendingSent);
  } catch (err) {
    console.error("Sent pending likes error: ", err);
    return res.status(500).json({ error: err.message });
  }
};
