import supabase from "../config/supabaseClient.js";

export const getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*");
    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createProfile = async (req, res) => {
  try {
    const { userid, username, age, sex, country, city, avatarUrl, devType } =
      req.body;

    if (!userid) {
      return res.status(400).json({ message: "User ID required" });
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        username,
        age,
        sex,
        country,
        city,
        avatarUrl: avatarUrl || null,
        is_setup: true,
        devType,
      })
      .eq("userid", userid)
      .select();

    if (error) throw error;

    res.status(200).json({ message: "Profile updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const { userid } = req.body;

    const file = req.file;

    if (!userid) {
      return res.status(400).json({ message: "User ID required" });
    }

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    //creating a unique file name
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${userid}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    //Uploading file to supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("avatarUrl")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("avatarUrl")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    //saving to db
    const { error: dbError } = await supabase
      .from("users")
      .update({
        avatarUrl: publicUrl,
      })
      .eq("userid", userid);

    if (dbError) throw dbError;

    res.status(200).json({
      message: "Avatar uploaded",
      avatarUrl: publicUrl,
    });
  } catch (error) {
    console.error("Upload error", error);
    res.status(500).json({ message: error.message });
  }
};

export const removeAvatar = async (req, res) => {
  try {
    const { userid } = req.body;

    if (!userid) {
      return res.status(400).json({ message: "User ID required" });
    }

    // 1. Get current avatar from DB (so we can delete file if needed)
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("avatarUrl")
      .eq("userid", userid)
      .single();

    if (fetchError) throw fetchError;

    const avatarUrl = user?.avatarUrl;

    // 2. Delete from Supabase Storage (optional but recommended)
    if (avatarUrl) {
      // extract file path from URL
      const parts = avatarUrl.split("/avatars/");
      const filePath = parts[1] ? `avatars/${parts[1]}` : null;

      if (filePath) {
        const { error: deleteError } = await supabase.storage
          .from("avatarUrl")
          .remove([filePath]);

        if (deleteError) {
          console.warn("Storage delete warning:", deleteError.message);
        }
      }
    }

    // 3. Update DB → remove avatarUrl
    const { error: dbError } = await supabase
      .from("users")
      .update({ avatarUrl: null })
      .eq("userid", userid);

    if (dbError) throw dbError;

    return res.status(200).json({
      message: "Avatar removed successfully",
    });
  } catch (error) {
    console.error("Remove avatar error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const saveCvData = async (req, res) => {
  const { userid, cv_info, github_skills, github_data } = req.body;

  if (!userid) {
    return res.status(400).json({ error: "Missing user ID" });
  }

  try {
    //  Prepare education entries
    const educationEntries = [];
    (cv_info.certifications || []).forEach((title) => {
      educationEntries.push({ userid, type: "certification", title });
    });
    (cv_info.degrees || []).forEach((title) => {
      educationEntries.push({ userid, type: "degree", title });
    });

    //  Prepare skill operations
    const skillUpserts = (github_skills || []).map(async (skillName) => {
      // Check if skill exists
      let { data: existingSkill, error: selectError } = await supabase
        .from("skills")
        .select("*")
        .eq("name", skillName)
        .single();

      if (selectError && selectError.code !== "PGRST116") throw selectError;

      let skillId;
      if (!existingSkill) {
        const { data: insertedSkill, error: insertError } = await supabase
          .from("skills")
          .insert({ name: skillName })
          .select()
          .single();
        if (insertError) throw insertError;
        skillId = insertedSkill.skill_id;
      } else {
        skillId = existingSkill.skill_id;
      }

      // Upsert into user_skills to avoid duplicates
      const { error: userSkillError } = await supabase
        .from("user_skills")
        .upsert(
          { userid, skill_id: skillId },
          { onConflict: ["userid", "skill_id"] },
        );
      if (userSkillError) throw userSkillError;
    });

    //  Prepare repo operations
    const repoUpserts = (github_data || []).map(async (repo) => {
      const { error: repoError } = await supabase.from("user_repos").upsert(
        {
          userid,
          name: repo.name || "",
          url: repo.html_url || repo.url || "",
          description: repo.description || "",
          languages: repo.language ? [repo.language] : [],
          topics: repo.topics || [],
          readme: repo.readme || null,
        },
        { onConflict: ["userid", "url"] },
      );
      if (repoError) throw repoError;
    });

    //  Perform all DB operations concurrently
    const operations = [];

    if (educationEntries.length > 0) {
      operations.push(
        supabase
          .from("education")
          .upsert(educationEntries, { onConflict: ["userid", "title"] }),
      );
    }

    operations.push(...skillUpserts);
    operations.push(...repoUpserts);

    // Await all at once
    await Promise.all(operations);

    //  Update step_skills to true now that everything is done
    await supabase
      .from("users")
      .update({ step_skills: true })
      .eq("userid", userid);

    console.log("All CV data saved successfully");
    res.status(200).json({
      message: "CV data saved successfully",
    });
  } catch (err) {
    console.error("Unexpected error in saveCvData:", err);
    res.status(500).json({ step: "unknown", error: err.message || err });
  }
};

export const saveUserGoals = async (req, res) => {
  const { userid, goals } = req.body;

  if (!userid || !Array.isArray(goals)) {
    return res.status(400).json({ error: "Missing user ID or goals array" });
  }

  try {
    // Step 1: Ensure all goals exist
    const existingGoals = await supabase.from("goals_list").select("*");
    if (existingGoals.error) throw existingGoals.error;

    const goalRecordsToInsert = goals
      .filter((g) => !existingGoals.data.some((eg) => eg.name === g))
      .map((g) => ({ name: g }));

    if (goalRecordsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("goals_list")
        .insert(goalRecordsToInsert);
      if (insertError) throw insertError;
    }

    // Step 2: Fetch goal IDs
    const { data: allGoals, error: fetchError } = await supabase
      .from("goals_list")
      .select("*")
      .in("name", goals);
    if (fetchError) throw fetchError;

    const goalIdMap = Object.fromEntries(
      allGoals.map((g) => [g.name, g.goal_id]),
    );

    // Step 3: Delete old goals
    const { error: deleteError } = await supabase
      .from("user_goals")
      .delete()
      .eq("userid", userid);
    if (deleteError) throw deleteError;

    // Step 4: Insert new goals
    const userGoalsRecords = goals
      .map((g) => ({
        userid: goalIdMap[g] ? userid : null,
        goal_id: goalIdMap[g],
      }))
      .filter((r) => r.goal_id !== undefined);

    const { error: userGoalsError } = await supabase
      .from("user_goals")
      .insert(userGoalsRecords);

    if (userGoalsError) {
      console.error("Error inserting user_goals:", userGoalsError);
      throw userGoalsError;
    }

    //update user setup step
    const { error: updateError } = await supabase
      .from("users")
      .update({ step_goals: true })
      .eq("userid", userid);

    res.status(200).json({ message: "User goals updated successfully" });
  } catch (error) {
    console.error("Error in saveUserGoals:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

export const saveUserPreferences = async (req, res) => {
  const { userid, preferences } = req.body;

  if (!userid || !preferences || typeof preferences !== "object") {
    return res.status(400).json({ error: "Missing user ID or preferences" });
  }

  try {
    const prefEntries = Object.entries(preferences);
    // e.g. [ ["workStyle", "Remote only"], ["availability", "Part-time"] ]

    // 1 Ensure all preferences exist in preferences_list
    const { data: existingPrefs, error: fetchError } = await supabase
      .from("preferences_list")
      .select("*");

    if (fetchError) throw fetchError;

    const prefsToInsert = prefEntries
      .filter(
        ([category, name]) =>
          !existingPrefs.some(
            (ep) => ep.name === name && ep.category === category,
          ),
      )
      .map(([category, name]) => ({
        name,
        category,
      }));

    if (prefsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("preferences_list")
        .insert(prefsToInsert);

      if (insertError) throw insertError;
    }

    // 2 Fetch preference IDs
    const names = prefEntries.map(([, name]) => name);

    const { data: allPrefs, error: fetchIdsError } = await supabase
      .from("preferences_list")
      .select("*")
      .in("name", names);

    if (fetchIdsError) throw fetchIdsError;

    const prefIdMap = Object.fromEntries(
      allPrefs.map((p) => [`${p.category}-${p.name}`, p.preference_id]),
    );

    // 3 Delete old preferences
    const { error: deleteError } = await supabase
      .from("user_preferences")
      .delete()
      .eq("userid", userid);

    if (deleteError) throw deleteError;

    // 4 Insert new preferences
    const userPrefRecords = prefEntries
      .map(([category, name]) => ({
        userid,
        preference_id: prefIdMap[`${category}-${name}`],
      }))
      .filter((r) => r.preference_id !== undefined);

    const { data: inserted, error: insertUserPrefError } = await supabase
      .from("user_preferences")
      .insert(userPrefRecords);

    if (insertUserPrefError) throw insertUserPrefError;

    //update step_prefs in users
    const { error: updateError } = await supabase
      .from("users")
      .update({ step_prefs: true })
      .eq("userid", userid);

    res.status(200).json({ message: "Preferences saved successfully" });
  } catch (error) {
    console.error("Error in saveUserPreferences:", error);
    res.status(500).json({ error: error.message });
  }
};
