import { motion } from "framer-motion";
import {
    Github,
    Lock,
    Zap,
    Globe,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";


const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    show: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.55,
            delay: i * 0.1,
            ease: [0.22, 1, 0.36, 1],
        },
    }),
};

const features = [
    {
        num: "01",
        icon: "⬡",
        title: "GitHub Analysis",
        desc: "We read your actual repos, not a self-reported skills list. Real code, real signal.",
    },
    {
        num: "02",
        icon: "⌘",
        title: "Skill Extraction",
        desc: "AI extracts your stack, frameworks, and patterns. No manual input required.",
    },
    {
        num: "03",
        icon: "◈",
        title: "Smart Matching",
        desc: "Matched on skills, goals, and what you love building — not just job titles.",
    },
    {
        num: "04",
        icon: "⊕",
        title: "Direct Messaging",
        desc: "Encrypted DMs open only after a mutual match. No cold spam, ever.",
    },
    {
        num: "05",
        icon: "◎",
        title: "Location Aware",
        desc: "Find developers in your city or go fully remote, your call.",
    },
    {
        num: "06",
        icon: "⟡",
        title: "Profile Depth",
        desc: "Degrees, certs, repos, languages. A full picture, not just a headshot.",
    },
];

const aboutItems = [
    {
        icon: Lock,
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        title: "No spam. No noise.",
        desc: "Messages only unlock after both developers swipe right. Your time is protected.",
    },
    {
        icon: Zap,
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        title: "Real signal, not résumés.",
        desc: "We rank skills by commit frequency and project complexity — not self-assessment.",
    },
    {
        icon: Globe,
        color: "text-green-400",
        bg: "bg-green-500/10",
        title: "Local or remote, your rules.",
        desc: "Filter by city, timezone, or go fully async. DevMatch adapts to how you work.",
    },
];

const terminalLines = [
    { parts: [{ text: "❯ ", color: "text-emerald-400" }, { text: "devmatch ", color: "text-indigo-400" }, { text: "analyze", color: "text-zinc-200" }] },
    { parts: [{ text: "  Scanning GitHub repos...", color: "text-zinc-500" }] },
    { parts: [{ text: "  Extracting skills ", color: "text-zinc-500" }, { text: "✓", color: "text-emerald-400" }] },
    { parts: [{ text: "  Building profile ", color: "text-zinc-500" }, { text: "✓", color: "text-emerald-400" }] },
    { parts: [{ text: "❯ ", color: "text-emerald-400" }, { text: "Skills found:", color: "text-indigo-400" }] },
    { parts: [{ text: "  TypeScript ", color: "text-amber-400" }, { text: "React ", color: "text-fuchsia-400" }, { text: "PostgreSQL", color: "text-indigo-400" }] },
    { parts: [{ text: "  Node.js ", color: "text-emerald-400" }, { text: "Docker", color: "text-zinc-200" }] },
    { parts: [{ text: "❯ ", color: "text-emerald-400" }, { text: "devmatch ", color: "text-indigo-400" }, { text: "find-matches", color: "text-zinc-200" }] },
    { parts: [{ text: "  Found ", color: "text-zinc-500" }, { text: "7 developers", color: "text-emerald-400" }, { text: " nearby", color: "text-zinc-500" }] },
    { parts: [{ text: "✓ ", color: "text-emerald-400" }, { text: "Opening matches...", color: "text-zinc-200" }] },
];

export default function LandingPage() {

    const navigate = useNavigate()

    const handleClick = () => {
        navigate("/login");
    };

    return (
        <div className="bg-[#0f0f11] text-zinc-200 min-h-screen font-mono">

            {/* ─── NAV ─── */}
            <nav className="flex items-center justify-between px-8 md:px-12 py-5 border-b border-zinc-800 sticky top-0 z-50 bg-[#0f0f11]/80 backdrop-blur-md">
                <span className="text-xl font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                    dev<span className="text-indigo-500">match</span>
                </span>
                <ul className="hidden md:flex gap-16 list-none ml-36">
                    {["Features", "About",].map((l) => (
                        <li key={l}>
                            <a href={`#${l.toLowerCase()}`} className="text-[11px] uppercase tracking-widest text-zinc-500 hover:text-zinc-200 transition-colors">
                                {l}
                            </a>
                        </li>
                    ))}
                </ul>
                <button
                    onClick={() => navigate("/signup")}
                    className="bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,.4)] text-white text-xs font-semibold tracking-widest px-5 py-2.5 rounded-lg transition-all">
                    ./join-devmatch --free
                </button>
            </nav>

            {/* ─── HERO ─── */}
            <section className="relative min-h-[92vh] flex flex-col justify-center px-8 md:px-12 py-24 border-b border-zinc-800 overflow-hidden">
                {/* Grid bg */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(99,102,241,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.04) 1px,transparent 1px)",
                        backgroundSize: "60px 60px",
                    }}
                />
                {/* Glow */}
                <div
                    className="absolute top-[-200px] right-[-200px] w-[700px] h-[700px] rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle,rgba(99,102,241,.1) 0%,transparent 65%)" }}
                />

                {/* Badge */}
                <motion.div
                    variants={fadeUp} initial="hidden" animate="show" custom={0}
                    className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-[11px] text-zinc-400 tracking-widest uppercase mb-8 w-fit"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Now in beta — developer matching platform
                </motion.div>

                <motion.p variants={fadeUp} initial="hidden" animate="show" custom={1}
                    className="text-[11px] text-indigo-400 tracking-[.15em] uppercase mb-5">
          // find your next collaborator
                </motion.p>

                <motion.h1
                    variants={fadeUp} initial="hidden" animate="show" custom={2}
                    className="text-[clamp(40px,6vw,70px)] font-black leading-[1.0] tracking-[-0.04em] mb-7 max-w-2xl"
                    style={{ fontFamily: "'Syne', sans-serif" }}
                >
                    Match with<br />
                    <span className="text-indigo-500">developers</span><br />
                    <span className="text-zinc-600">you'll actually</span><br />
                    ship with.
                </motion.h1>

                <motion.p variants={fadeUp} initial="hidden" animate="show" custom={3}
                    className="text-sm text-zinc-500 max-w-md leading-[1.9] mb-12">
                    DevMatch reads your <span className="text-teal-400">GitHub repos</span>, extracts real skills, and connects you with developers who build the same things you do.
                </motion.p>

                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
                    className="flex items-center gap-4 flex-wrap mb-24">
                    <button
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold tracking-wider px-7 py-3.5 rounded-lg transition-all hover:shadow-[0_0_24px_rgba(99,102,241,.4)] hover:-translate-y-px"
                        onClick={handleClick}
                    >
                        ./get-started --free
                    </button>
                    <button
                        onClick={() => {
                            document.getElementById("features")?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                            });
                        }}
                        className="bg-transparent border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-zinc-200 text-sm px-7 py-3.5 rounded-lg transition-all tracking-wide"
                    >
                        learn more →
                    </button>
                </motion.div>

                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={5}
                    className="flex gap-12 flex-wrap"
                >
                    {[
                        ["4k+", "developers matched"],
                        ["12k+", "repos analyzed"],
                        ["98%", "match satisfaction"],
                    ].map(([n, l]) => (
                        <div key={l}>
                            <div
                                className="text-3xl font-black tracking-tight text-zinc-50"
                                style={{ fontFamily: "'Syne', sans-serif" }}
                            >
                                {Array.from(n).map((char, i) =>
                                    /[k+%]/.test(char) ? (
                                        <span key={i} className="text-indigo-500">
                                            {char}
                                        </span>
                                    ) : (
                                        <span key={i}>{char}</span>
                                    )
                                )}
                            </div>
                            <div className="text-[11px] text-zinc-600 tracking-widest uppercase mt-1">
                                {l}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Floating terminal */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="hidden xl:block absolute right-16 -translate-y-1/2 w-[340px] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl"
                >
                    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-zinc-800 bg-[#1c1c1f]">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="ml-auto text-[10px] text-zinc-600 tracking-wider">devmatch-cli v1.0</span>
                    </div>
                    <div className="p-5 text-xs leading-[2.1]">
                        {terminalLines.map((line, i) => (
                            <div key={i}>
                                {line.parts.map((p, j) => (
                                    <span key={j} className={p.color}>{p.text}</span>
                                ))}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ─── FEATURES ─── */}
            <section id="features" className="px-8 md:px-12 py-24 border-b border-zinc-800">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.5 }}
                >
                    <p className="text-[11px] text-indigo-400 tracking-[.15em] uppercase mb-4">// what we do</p>
                    <h2 className="text-[clamp(28px,4vw,44px)] font-black tracking-tight mb-16 max-w-lg leading-[1.1]"
                        style={{ fontFamily: "'Syne', sans-serif" }}>
                        Everything you need<br /><span className="text-zinc-600">to find your people.</span>
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-zinc-800 border border-zinc-800 rounded-xl overflow-hidden">
                    {features.map((f, i) => (
                        <motion.div
                            key={f.num}
                            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.06 }}
                            className="group bg-[#0f0f11] hover:bg-zinc-900 transition-colors p-8 cursor-default"
                        >
                            <div className="text-[11px] text-zinc-700 tracking-widest mb-5">{f.num}</div>
                            <div className="w-9 h-9 flex items-center justify-center bg-zinc-900 group-hover:bg-indigo-950 border border-zinc-800 group-hover:border-indigo-800 rounded-lg mb-5 text-base transition-all">
                                {f.icon}
                            </div>
                            <h3 className="text-base font-bold text-zinc-100 mb-2.5 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                                {f.title}
                            </h3>
                            <p className="text-xs text-zinc-500 leading-[1.9]">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ─── ABOUT ─── */}
            <section id="about" className="px-8 md:px-12 py-24 border-b border-zinc-800 grid md:grid-cols-2 gap-16 md:gap-24 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.55 }}
                >
                    <span className="inline-block bg-indigo-950 text-indigo-400 text-[11px] px-3 py-1 rounded tracking-widest uppercase mb-5">
            // built for builders
                    </span>
                    <h2 className="text-[clamp(26px,3.5vw,40px)] font-black tracking-tight leading-[1.15] mb-5"
                        style={{ fontFamily: "'Syne', sans-serif" }}>
                        Stop connecting with people who won't ship.
                    </h2>
                    <p className="text-sm text-zinc-500 leading-[1.9]">
                        DevMatch was built because traditional networks fail developers. You deserve matches based on what you've actually built — not who you know or how polished your profile looks.
                    </p>
                </motion.div>

                <div className="flex flex-col gap-4">
                    {aboutItems.map((item, i) => {
                        const Icon = item.icon;

                        return (
                            <motion.div
                                key={i}
                                className="flex items-start gap-4 p-6 bg-[#0f0f11] border border-zinc-800 rounded-xl"
                            >
                                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${item.bg}`}>
                                    <Icon className={`w-5 h-5 ${item.color}`} />
                                </div>

                                <div>
                                    <h3
                                        className="text-base font-bold text-zinc-100 tracking-tight"
                                        style={{ fontFamily: "'Syne', sans-serif" }}
                                    >
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-zinc-500 leading-[1.9]">
                                        {item.desc}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="relative px-8 md:px-12 py-28 text-center overflow-hidden border-b border-zinc-800">
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle,rgba(99,102,241,.08) 0%,transparent 70%)" }}
                />
                <motion.div
                    initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ duration: 0.55 }}
                    className="relative"
                >
                    <h2 className="text-[clamp(32px,5vw,60px)] font-black tracking-tight mb-4 leading-[1.05]"
                        style={{ fontFamily: "'Syne', sans-serif" }}>
                        Ready to find your<br /><span className="text-indigo-500">co-founder?</span>
                    </h2>
                    <p className="text-sm text-zinc-500 mb-10">Join thousands of developers already matching on DevMatch.</p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <button
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold tracking-wider px-7 py-3.5 rounded-lg transition-all hover:shadow-[0_0_24px_rgba(99,102,241,.4)] hover:-translate-y-px"
                            onClick={handleClick}
                        >
                            ./join-devmatch --free
                        </button>

                    </div>
                </motion.div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer className="px-8 md:px-12 py-8 flex items-center justify-between flex-wrap gap-4">
                <span className="text-base font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                    dev<span className="text-indigo-500">match</span>
                </span>
                <div className="flex gap-6">
                    {["Privacy", "Terms", "GitHub"].map((l) => (
                        <a key={l} href="#" className="text-[11px] text-zinc-600 hover:text-zinc-400 tracking-widest transition-colors">
                            {l}
                        </a>
                    ))}
                </div>
                <p className="text-[11px] text-zinc-700 tracking-wider">
                    © {new Date().getFullYear()} DevMatch. Built for developers.
                </p>
            </footer>

        </div>
    );
}