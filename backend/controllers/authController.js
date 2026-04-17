import supabase from "../config/supabaseClient.js";
import crypto from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const signup = async (req, res) => {
  const { name, surname, email, password } = req.body;

  console.log("Signup request body:", req.body);

  try {
    const { data, error } = await supabase
      .from("users")
      .insert([{ name, surname, email, password }]);

    console.log("Supabase insert result:", { data, error });

    if (error) throw error;

    res.status(201).json({
      message: "User created successfully",
      //user: data[0],
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    //For Now plain text comaprison
    if (data.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        userid: data.userid,
        email: data.email,
        is_setup: data.is_setup === true,
        step_skills: data.step_skills === true,
        step_goals: data.step_goals === true,
        step_prefs: data.step_prefs === true,
        username: data.username || null,
        avatarUrl: data.avatarUrl || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // 1. find user
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 2. generate token
    const token = crypto.randomBytes(32).toString("hex");

    const expiry = new Date(Date.now() + 1000 * 60 * 15); // 15 min

    // 3. store token
    await supabase
      .from("users")
      .update({
        reset_token: token,
        reset_token_expiry: expiry,
      })
      .eq("email", email);

    // 4. create reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // 5. send email
    await resend.emails.send({
      from: "devmatch <onboarding@resend.dev>",
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: sans-serif;">
          <h2>Password Reset Request</h2>
          <p>Click below to reset your password:</p>
          <a href="${resetLink}" target="_blank"
             style="padding:10px 15px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;display:inline-block;">
            Reset Password
          </a>
          <p style="margin-top:10px;font-size:12px;color:#666;">
            This link expires in 15 minutes.
          </p>
        </div>
      `,
    });

    return res.json({ message: "Reset email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("reset_token", token)
      .single();

    if (error || !user) {
      return res.status(400).json({ error: "Invalid token" });
    }

    if (new Date(user.reset_token_expiry) < new Date()) {
      return res.status(400).json({ error: "Token expired" });
    }

    //  DIRECT PASSWORD UPDATE (no hashing)
    await supabase
      .from("users")
      .update({
        password: password,
        reset_token: null,
        reset_token_expiry: null,
      })
      .eq("userid", user.userid);

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
