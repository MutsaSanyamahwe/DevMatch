import supabase from "../config/supabaseClient.js";

export const getUserProfile = async (req, res) => {
  const { userid } = req.params;

  if (!userid) return res.status(400).json({ message: "User ID rewuired" });

  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        "name,surname,username,email,age,country,city,bio,avatarUrl,devType",
      )
      .eq("userid", userid)
      .single();

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching user profle", error);
  }
};

export const updateUserProfile = async (req, res) => {
  const { userid } = req.params;
  console.log("API hit!! its working");

  const { name, surname, username, email, age, country, city, bio, devType } =
    req.body;

  if (!userid) return res.status(400).json({ message: "User ID required" });

  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        name,
        surname,
        username,
        email,
        age,
        country,
        city,
        bio,
        devType,
      })
      .eq("userid", userid)
      .select();

    if (error) throw error;

    res.status(200).json({ message: "Profile updated", data });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getUserGoals = async (req, res) => {
  const { userid } = req.params;

  if (!userid) return res.status(400).json({ error: "Missing user ID" });

  try {
    //joining user_goals with goals_list to get goal names
    const { data, error } = await supabase
      .from("user_goals")
      .select(
        `
                goal_id,
                goals_list(name)
                `,
      )
      .eq("userid", userid)
      .order("goal_id", { ascending: true });

    if (error) throw error;

    //flattening array
    const goalNames = data.map((g) => g.goals_list.name);

    res.status(200).json({ goals: goalNames });
  } catch (error) {
    console.error("Error fetching user goals:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserPreferences = async (req, res) => {
  const { userid } = req.params;

  if (!userid) return res.status(400).json({ error: "Missing user ID" });

  try {
    //Joining user_preferences with preferences_list to get category + name
    const { data, error } = await supabase
      .from("user_preferences")
      .select(
        `
            preference_id,
            preferences_list(name, category)
            `,
      )
      .eq("userid", userid);

    if (error) throw error;

    const preferences = {};
    data.forEach((p) => {
      preferences[p.preferences_list.category] = p.preferences_list.name;
    });

    res.status(200).json({ preferences });
  } catch (error) {
    console.error("Error fetching user preferences: ", error);
    res.status(500).json({ error: error.message });
  }
};

//GET/profile/get-cv-data/:userid
export const getCvData = async (req, res) => {
  const { userid } = req.params;

  if (!userid) return res.status(400).json({ error: "Missing user ID" });

  try {
    const { data: education, error: eduError } = await supabase
      .from("education")
      .select("*")
      .eq("userid", userid);
    if (eduError) throw eduError;

    //Fetch skills
    const { data: userSkills, error: skillError } = await supabase
      .from("user_skills")
      .select("skill_id, skills(name)")
      .eq("userid", userid);
    if (skillError) throw skillError;

    const skills = userSkills.map((us) => us.skills.name);

    //Fetching repos
    const { data: repos, error: repoError } = await supabase
      .from("user_repos")
      .select("*")
      .eq("userid", userid);
    if (repoError) throw repoError;

    res.status(200).json({
      education,
      skills,
      repos,
    });
  } catch (err) {
    console.error("Failed to fetch CV data: ", err);
    res.status(500).json({ error: err.message || err });
  }
};
