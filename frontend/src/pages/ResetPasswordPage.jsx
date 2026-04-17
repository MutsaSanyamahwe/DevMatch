import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [type, setType] = useState("info");

    const handleReset = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setType("error");
            setMessage("Passwords do not match");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("https://devmatch-1npz.onrender.com/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setType("error");
                setMessage(data.error || "Reset failed");
                return;
            }

            setType("success");
            setMessage("Password updated! Redirecting...");

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (err) {
            setType("error");
            setMessage("Server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center font-mono p-6">

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] bg-[#1c1c1f] rounded-xl p-8 relative"
            >

                <h1 className="text-2xl font-black text-zinc-50 mb-6">
                    reset <span className="text-indigo-500">password</span>
                </h1>

                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md text-sm ${type === "error"
                                ? "bg-red-700 text-white"
                                : "bg-emerald-600 text-white"
                                }`}
                        >
                            {message}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleReset} className="space-y-5">

                    <input
                        type="password"
                        placeholder="new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-200"
                        required
                    />

                    <input
                        type="password"
                        placeholder="confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-200"
                        required
                    />

                    <button
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold"
                    >
                        {loading ? "updating..." : "reset password"}
                    </button>

                </form>
            </motion.div>
        </div>
    );
}