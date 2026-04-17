import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
    const [name, setName] = useState("");
    const [surname, setSurname] = useState("");
    const [email, setEmail] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");
    const [msgType, setMsgType] = useState("info");

    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMsgType("error");
            setMessage("Passwords do not match");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("https://devmatch-1npz.onrender.com/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    surname,
                    email,
                    password,
                })
            });

            const data = await res.json();
            if (!res.ok) {
                setMsgType("error");
                setMessage(data.error || "Signup failed");
            }
            setMsgType("success");
            setMessage("Signup successful! Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 1200);


        } catch (error) {
            console.error("Error signing up:", error);
            setMsgType("error");
            setMessage("An error occurred during signup. Please try again.");
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

            {/* Ambient glows */}
            <div
                className="absolute top-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(99,102,241,.09) 0%,transparent 65%)" }}
            />
            <div
                className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle,rgba(20,184,166,.06) 0%,transparent 65%)" }}
            />

            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-[420px] z-10"
            >
                {/* Gradient border */}
                <div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    style={{
                        padding: "1px",
                        background: "linear-gradient(135deg,rgba(99,102,241,.35),transparent 45%,rgba(20,184,166,.12))",
                        WebkitMask: "linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                    }}
                />

                <div className="bg-[#1c1c1f] rounded-xl px-8 py-9">
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
                    {/* Window dots */}
                    <div className="flex items-center gap-1.5 mb-8">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="ml-auto text-[10px] text-zinc-600 tracking-widest">auth/signup.jsx</span>
                    </div>

                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.4 }}
                        className="mb-7"
                    >
                        <h1
                            className="text-2xl font-black tracking-tight text-zinc-50 mb-1"
                            style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                            dev<span className="text-indigo-500">match</span>
                            <span className="inline-block w-[9px] h-5 bg-indigo-500 ml-1 align-middle animate-pulse rounded-[2px]" />
                        </h1>
                        <p className="text-[11px] text-zinc-600 tracking-widest">
              // welcome back, builder
                        </p>
                    </motion.div>

                    {/* Form */}
                    <form onSubmit={handleSignup} className="space-y-5">

                        {/*Name */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                        >
                            <label className="block text-[10px] text-zinc-500 uppercase tracking-[.12em] mb-2">
                                name
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 text-sm font-bold pointer-events-none select-none">
                                    $
                                </span>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="your name .."
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg pl-8 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all caret-indigo-500"
                                />
                            </div>
                        </motion.div>

                        {/* Surname */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                        >
                            <label className="block text-[10px] text-zinc-500 uppercase tracking-[.12em] mb-2">
                                surname
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 text-sm font-bold pointer-events-none select-none">
                                    $
                                </span>
                                <input
                                    type="text"
                                    value={surname}
                                    onChange={(e) => setSurname(e.target.value)}
                                    placeholder="your surname .."
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg pl-8 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all caret-indigo-500"
                                />
                            </div>
                        </motion.div>

                        {/* Email */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                        >
                            <label className="block text-[10px] text-zinc-500 uppercase tracking-[.12em] mb-2">
                                email
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 text-sm font-bold pointer-events-none select-none">
                                    $
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@github.com"
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg pl-8 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all caret-indigo-500"
                                />
                            </div>
                        </motion.div>

                        {/* Password */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25, duration: 0.4 }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[10px] text-zinc-500 uppercase tracking-[.12em]">
                                    password
                                </label>

                            </div>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 text-sm font-bold pointer-events-none select-none">
                                    $
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg pl-8 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all caret-indigo-500"
                                />
                            </div>
                        </motion.div>

                        {/*  Confirm Password */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25, duration: 0.4 }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[10px] text-zinc-500 uppercase tracking-[.12em]">
                                    confirm password
                                </label>

                            </div>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 text-sm font-bold pointer-events-none select-none">
                                    $
                                </span>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg pl-8 pr-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all caret-indigo-500"
                                />
                            </div>
                        </motion.div>


                        {/* Submit */}
                        <motion.button
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.4 }}
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-lg py-3 text-sm font-semibold tracking-widest transition-all hover:shadow-[0_0_24px_rgba(99,102,241,.35)] hover:-translate-y-px active:scale-[.99] disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    authenticating...
                                </span>
                            ) : (
                                "./signup.sh --execute"
                            )}
                        </motion.button>
                    </form>

                    {/* Sign up link */}
                    <motion.p
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: 0.45, duration: 0.4 }}
                        className="text-center text-xs text-zinc-600 mt-7"
                    >
                        no account?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="text-indigo-500 hover:text-indigo-400 transition-colors font-medium"
                        >
                            git init --already have an account →
                        </button>
                    </motion.p>

                </div>
            </motion.div>
        </div>
    );
}