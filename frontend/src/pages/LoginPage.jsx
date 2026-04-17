import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";


export default function LoginPage() {
    const { setUser } = useUser();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // New state for in-app messages
    const [message, setMessage] = useState("");
    const [msgType, setMsgType] = useState("info"); // "info", "error", "success"

    const handleLogin = async (e) => {
        e.preventDefault();


        e.preventDefault();
        setLoading(true);
        setMessage(""); // reset any old messages

        try {
            const res = await fetch("http://localhost:3000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            let data;
            try {
                data = await res.json();
            } catch (err) {
                console.error("Failed to parse JSON:", err);
                const text = await res.text();
                console.log("Raw response text:", text);
                return;
            }

            if (!res.ok) {
                setMsgType("error");
                setMessage(data.error || "Login failed");
                console.error("Login failed:", data);
                return;
            }

            // Now safely store user ID
            if (!data.user || !data.user.userid) {
                console.error("No user ID returned from server!", data);
                setMsgType("error");
                setMessage("Login failed: no user ID returned");
                return;
            }


            setMsgType("success");
            setMessage("Login successful!");
            // after login success
            setUser({
                userid: data.user.userid,
                is_setup: data.user.is_setup,
                step_skills: data.user.step_skills,
                step_goals: data.user.step_goals,
                step_prefs: data.user.step_prefs,
            });

            localStorage.setItem("user", JSON.stringify({
                userid: data.user.userid,
                is_setup: data.user.is_setup,
                step_skills: data.user.step_skills,
                step_goals: data.user.step_goals,
                step_prefs: data.user.step_prefs,
            }));
            navigate("/onboarding");




        } catch (err) {
            console.error("Login error:", err);
            setMsgType("error");
            setMessage("An error occurred during login. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center p-6 relative overflow-hidden font-mono">
            {/* Grid background */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-[420px] z-10"
            >
                <div className="bg-[#1c1c1f] rounded-xl px-8 py-9 relative">
                    {/* In-app message */}
                    <AnimatePresence>
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md text-sm ${msgType === "error"
                                    ? "bg-red-700 text-white"
                                    : msgType === "success"
                                        ? "bg-emerald-600 text-white"
                                        : "bg-indigo-600 text-white"
                                    }`}
                            >
                                {message}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Logo */}
                    <h1 className="text-2xl font-black tracking-tight text-zinc-50 mb-6">
                        dev<span className="text-indigo-500">match</span>
                    </h1>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-[10px] text-zinc-500 uppercase tracking-[.12em] mb-2">
                                email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@github.com"
                                autoComplete="username"
                                required
                                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all caret-indigo-500"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[10px] text-zinc-500 uppercase tracking-[.12em]">
                                    password
                                </label>

                                <a
                                    onClick={() => navigate("/forgot-password")}
                                    className="text-[10px] text-indigo-500 hover:text-indigo-400 transition-colors"
                                >
                                    forgot password?
                                </a>
                            </div>

                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                autoComplete="current-password"
                                required
                                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all caret-indigo-500"
                            />
                        </div>


                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-lg py-3 text-sm font-semibold tracking-widest transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    authenticating...
                                </span>
                            ) : (
                                "./login.sh --execute"
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-zinc-600 mt-7">
                        no account?{" "}
                        <a href="/signup" className="text-indigo-500 hover:text-indigo-400 transition-colors font-medium">
                            git init --new-user →
                        </a>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}