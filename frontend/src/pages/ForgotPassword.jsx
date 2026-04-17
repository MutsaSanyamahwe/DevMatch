import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("info");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("https://devmatch-1npz.onrender.com/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setType("error");
                setMessage(data.error || "Something went wrong");
                return;
            }

            setType("success");
            setMessage("Reset email sent! Check your inbox.");

        } catch (err) {
            setType("error");
            setMessage("Server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center font-mono">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[420px] bg-[#1c1c1f] p-8 rounded-xl relative"
            >
                <h1 className="text-2xl font-black text-zinc-50 mb-6">
                    reset <span className="text-indigo-500">password</span>
                </h1>

                <AnimatePresence>
                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-md text-sm ${type === "error"
                                ? "bg-red-600 text-white"
                                : "bg-emerald-600 text-white"
                                }`}
                        >
                            {message}
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <input
                        type="email"
                        placeholder="you@github.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-lg text-zinc-200"
                        required
                    />

                    <button
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg"
                    >
                        {loading ? "sending..." : "send reset email"}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}