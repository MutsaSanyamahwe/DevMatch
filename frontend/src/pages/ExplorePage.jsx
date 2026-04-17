import { motion } from "framer-motion";
import { ShieldCheck, GitBranch, Sparkles, ArrowRight } from "lucide-react";

const systems = [
    {
        name: "devVerify",
        url: "https://devverify-system-1.onrender.com",
        description:
            "Verify developer identity through repo history, contribution signals, and AI-backed skill validation.",
        icon: ShieldCheck,
        color: "from-indigo-500 to-violet-600",
        accent: "text-indigo-300",
    },
    {
        name: "repoRecommender",
        url: "https://github-repository-recommender.onrender.com",
        description:
            "AI engine that recommends repositories based on your stack, behavior patterns, and collaboration signals.",
        icon: GitBranch,
        color: "from-cyan-500 to-sky-500",
        accent: "text-cyan-300",
    },
];

const fadeUp = (i = 0) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.06 },
});

export default function ExplorePage() {
    return (
        <div className="h-full flex flex-col bg-zinc-950 text-white">

            {/* ───────── HEADER ───────── */}
            <motion.div
                {...fadeUp(0)}
                className="px-8 py-7 border-b border-zinc-800/60 flex items-center justify-between"
            >
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[18px] font-extrabold uppercase tracking-widest text-indigo-400">
                            devMatch // explore
                        </span>
                        <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-[18px] text-zinc-600">
                            ecosystem systems
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight">
                        Explore Systems
                    </h1>

                    <p className="text-xs text-zinc-500 mt-2 max-w-md">
                        Core intelligence layers powering trust, discovery, and developer matching.
                    </p>
                </div>


            </motion.div>

            {/* ───────── BODY ───────── */}
            <div className="flex-1 px-8 py-10 space-y-6">

                {systems.map((s, i) => {
                    const Icon = s.icon;

                    return (
                        <motion.div
                            key={s.name}
                            {...fadeUp(i + 1)}
                            className="group flex items-center justify-between p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 transition"
                        >

                            {/* LEFT */}
                            <div className="flex items-center gap-5">

                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>

                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-semibold">{s.name}</h2>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border border-zinc-700 ${s.accent}`}>
                                            active
                                        </span>
                                    </div>

                                    <p className="text-xs text-zinc-500 mt-1 max-w-md">
                                        {s.description}
                                    </p>
                                </div>
                            </div>

                            {/* RIGHT */}
                            <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg border border-zinc-700 hover:border-indigo-500 hover:text-indigo-300 transition"
                            >
                                Open
                                <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </motion.div>
                    );
                })}
            </div>

            {/* ───────── FOOTER ───────── */}
            <div className="px-8 py-4 border-t border-zinc-800/60 text-[10px] text-zinc-600 flex justify-between">
                <span>devMatch ecosystem</span>
                <span>trust • intelligence • discovery</span>
            </div>

        </div>
    );
}