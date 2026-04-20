import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    GitBranch,
    Sparkles,
    MessageSquare,
    ShieldCheck,
    Github,
    Bot,
    Zap,
    Lock,
    Globe,
} from "lucide-react";

/* ─── Data ─── */
const ring1Nodes = [
    { label: "Repo scan", color: "#818cf8", border: "#2a2a4a", textColor: "#818cf8", angle: 90 },
    { label: "Skill extract", color: "#2dd4bf", border: "#1a2e2e", textColor: "#2dd4bf", angle: 0 },
    { label: "Smart match", color: "#f59e0b", border: "#2a2010", textColor: "#f59e0b", angle: 270 },
    { label: "DM unlocked", color: "#4ade80", border: "#122012", textColor: "#4ade80", angle: 180 },
];

const ring2Nodes = [
    { label: "Your repo does the talking", color: "#818cf8", border: "#2a2a4a", angle: 90 },
    { label: "No manual skill setup", color: "#2dd4bf", border: "#1a2e2e", angle: 30 },
    { label: "CV + cert extraction", color: "#e879f9", border: "#2a1a2a", angle: 330 },
    { label: "Match-only messaging", color: "#f59e0b", border: "#2a2010", angle: 270 },
    { label: "GitHub-verified skills", color: "#818cf8", border: "#2a2a4a", angle: 210 },
    { label: "Real code signal", color: "#4ade80", border: "#122012", angle: 150 },
];

const ring3Nodes = [
    { label: "devVerify™", color: "#6366f1", border: "#2a2a4a", angle: 90, bold: true },
    { label: "Matching engine", color: "#52525b", border: "#1a1a1a", angle: 30 },
    { label: "Repo analysis", color: "#2dd4bf", border: "#1a2e2e", angle: 330 },
    { label: "Encrypted DMs", color: "#52525b", border: "#1a1a1a", angle: 270 },
    { label: "Cert parser", color: "#f59e0b", border: "#1c1400", angle: 210 },
    { label: "Zero spam", color: "#52525b", border: "#1a1a1a", angle: 150 },
];

const features = [
    {
        tag: "Repo intelligence", tagCls: "bg-indigo-950 text-indigo-400", Icon: GitBranch,
        title: "Your repo does the talking",
        desc: "No manual skill input. We read your actual GitHub repos — commit history, languages, frameworks, and project complexity — and build your profile automatically.",
    },
    {
        tag: "Matching system", tagCls: "bg-teal-950 text-teal-400", Icon: Sparkles,
        title: "Matched on what you've built",
        desc: "Our engine matches you on skills, goals, and what you love building — not job titles or self-assessed stars. The more you ship, the better your matches.",
    },
    {
        tag: "Messaging", tagCls: "bg-amber-950 text-amber-400", Icon: MessageSquare,
        title: "DMs only unlock with a match",
        desc: "Both developers have to match before any message is sent. Encrypted, private, and completely spam-free by design — not by policy.",
    },
    {
        tag: "devVerify™", tagCls: "bg-fuchsia-950 text-fuchsia-400", Icon: ShieldCheck,
        title: "CV and cert extraction, automated",
        desc: "Upload your CV or certificates once. devVerify™ parses, extracts, and verifies your credentials — degrees, bootcamps, certs — and adds them to your profile automatically.",
        verify: true,
    },
];

const steps = [
    { num: "01", Icon: Github, title: "Connect GitHub", desc: "We scan your repos, commits, and code patterns. No self-reported skill lists. Your code does all the talking." },
    { num: "02", Icon: Bot, title: "We build your profile", desc: "AI extracts your stack and experience level automatically. Upload your CV and certs — devVerify™ handles the rest." },
    { num: "03", Icon: Zap, title: "Match and message", desc: "Get matched on what you've built. DMs only unlock when both developers match — zero cold spam, guaranteed." },
];

const aboutCards = [
    { Icon: Lock, iconBg: "bg-indigo-950", title: "No spam. No noise.", desc: "Messages only unlock after both developers match. Your time is protected by design, not by policy." },
    { Icon: GitBranch, iconBg: "bg-amber-950", title: "Real signal, not résumés.", desc: "Your GitHub commits and project history speak louder than any self-assessed skill list ever could." },
    { Icon: Globe, iconBg: "bg-green-950", title: "Local or remote, your rules.", desc: "Filter by city, timezone, or go fully async. DevMatch adapts to how you work." },
];

const heroStats = [
    { n: "4k", suffix: "+", label: "developers matched" },
    { n: "12k", suffix: "+", label: "repos analyzed" },
    { n: "98", suffix: "%", label: "match satisfaction" },
];

const barStats = [
    { n: "4k", suffix: "+", label: "developers matched" },
    { n: "12k", suffix: "+", label: "repos analyzed" },
    { n: "98", suffix: "%", label: "match satisfaction" },
    { n: "6", suffix: " min", label: "avg time to match" },
];

const marqueeItems = [
    "Repo Analysis", "No manual setup", "Skill extraction",
    "Match-only DMs", "devVerify™", "CV parsing", "Zero spam", "GitHub verified",
];

function polarToXY(angleDeg, radius) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

function GlowButton({ onClick, children, small }) {
    return (
        <button
            onClick={onClick}
            className={`bg-indigo-600 hover:bg-indigo-500 text-white font-medium tracking-wide rounded-lg transition-all duration-200 whitespace-nowrap ${small ? "text-xs px-5 py-2.5" : "text-sm px-7 py-3"}`}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 24px rgba(99,102,241,0.45)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
        >
            {children}
        </button>
    );
}

function OutlineButton({ onClick, children }) {
    return (
        <button onClick={onClick}
            className="border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 text-sm px-7 py-3 rounded-lg transition-all bg-transparent whitespace-nowrap">
            {children}
        </button>
    );
}

function OrbitDiagram() {
    const [tick, setTick] = useState(0);
    const rafRef = useRef(null);
    const startRef = useRef(Date.now());

    useEffect(() => {
        const loop = () => { setTick(Date.now() - startRef.current); rafRef.current = requestAnimationFrame(loop); };
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    const t = tick / 1000;
    const SIZE = 440; const C = SIZE / 2;
    const R1 = 88, R2 = 150, R3 = 212;

    const renderNodes = (nodes, radius, rotDeg) =>
        nodes.map((n) => {
            const { x, y } = polarToXY(n.angle + rotDeg, radius);
            return (
                <div key={n.label} className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap z-10"
                    style={{ top: C + y, left: C + x }}>
                    <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px]"
                        style={{ background: "#0f0f11", border: `1px solid ${n.border}`, color: n.textColor ?? n.color, fontWeight: n.bold ? 600 : 500 }}>
                        {n.textColor && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: n.color }} />}
                        {n.label}
                    </div>
                </div>
            );
        });

    return (
        <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
            <svg width={SIZE} height={SIZE} className="absolute inset-0 pointer-events-none">
                <circle cx={C} cy={C} r={C - 4} fill="rgba(99,102,241,0.03)" />
                {[R1, R2, R3].map(r => <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="#1c1c1f" strokeWidth="1" />)}
            </svg>
            <div className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center rounded-full"
                style={{ top: C, left: C, width: 100, height: 100, background: "#0f0f11", border: "1px solid #27272a" }}>
                <span className="text-[13px] font-black tracking-tight text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    dev<span className="text-indigo-500">match</span>
                </span>
                <span className="text-[9px] text-zinc-600 tracking-widest uppercase mt-0.5">engine</span>
            </div>
            {renderNodes(ring1Nodes, R1, t * (360 / 14))}
            {renderNodes(ring2Nodes, R2, -t * (360 / 24))}
            {renderNodes(ring3Nodes, R3, t * (360 / 38))}
        </div>
    );
}

function Marquee() {
    const items = [...marqueeItems, ...marqueeItems];
    return (
        <div className="overflow-hidden border-y border-zinc-900 py-4">
            <style>{`@keyframes mq{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
            <div style={{ display: "inline-flex", animation: "mq 28s linear infinite", whiteSpace: "nowrap" }}>
                {items.map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-2 mx-8 text-[14px] text-zinc-200 tracking-widest uppercase">
                        {item} <span className="text-zinc-800">✦</span>
                    </span>
                ))}
            </div>
        </div>
    );
}

function SectionLabel({ children }) {
    return <p className="text-[11px] text-indigo-400 tracking-[.15em] uppercase mb-3">{children}</p>;
}

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="bg-[#09090b] text-zinc-400 min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');
                @keyframes bpulse{0%,100%{opacity:1}50%{opacity:.3}}
                @keyframes fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
                .fadeup{animation:fadeup .55s ease both}
                .fadeup-d{animation:fadeup .65s .12s ease both}
            `}</style>

            {/* NAV */}
            <nav className="sticky top-0 z-50 flex items-center justify-between px-6 lg:px-16 py-4 border-b border-zinc-900 bg-[#09090b]/90 backdrop-blur-md">
                <span className="text-lg font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.04em" }}>
                    dev<span className="text-indigo-500">match</span>
                </span>
                <div className="hidden md:flex items-center gap-10">
                    {["Features", "About"].map(l => (
                        <a key={l} href={`#${l.toLowerCase()}`}
                            className="text-[14px] uppercase tracking-widest text-zinc-200 hover:text-zinc-300 transition-colors no-underline">
                            {l}
                        </a>
                    ))}
                </div>
                <GlowButton onClick={() => navigate("/signup")} small>./join --free</GlowButton>
            </nav>

            {/* HERO */}
            <section className="relative overflow-hidden border-b border-zinc-900">
                <div className="absolute inset-0 pointer-events-none opacity-40" style={{
                    backgroundImage: "linear-gradient(#18181b 1px,transparent 1px),linear-gradient(90deg,#18181b 1px,transparent 1px)",
                    backgroundSize: "48px 48px",
                }} />
                <div className="absolute right-0 top-0 w-1/2 h-full pointer-events-none" style={{
                    background: "radial-gradient(ellipse 70% 60% at 80% 40%, rgba(99,102,241,0.09) 0%, transparent 70%)",
                }} />

                <div className="relative max-w-7xl mx-auto px-6 lg:px-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-4 py-20 lg:py-0" style={{ minHeight: "calc(100vh - 61px)" }}>
                    {/* Left */}
                    <div className="fadeup flex-1 flex flex-col items-start justify-center lg:py-28">
                        <div className="flex items-center gap-2 border border-zinc-800 rounded-full px-3.5 py-1.5 mb-8">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: "bpulse 2s infinite" }} />
                            <span className="text-[10px] tracking-widest uppercase text-zinc-600">Now in beta — developer matching</span>
                        </div>

                        <p className="text-[11px] text-indigo-400 tracking-[.15em] uppercase mb-5">// find your next collaborator</p>

                        <h1 className="font-black text-white mb-6"
                            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(38px,4.5vw,62px)", letterSpacing: "-0.05em", lineHeight: 1.03 }}>
                            Match with<br />
                            <span className="text-indigo-500">developers</span><br />
                            <span style={{ color: "#3f3f46" }}>you'll actually</span><br />
                            ship with.
                        </h1>

                        <p className="text-lg text-zinc-500 leading-relaxed mb-10" style={{ maxWidth: 400 }}>
                            DevMatch reads your <span className="text-teal-400">public GitHub repos</span>, extracts real skills,
                            and connects you with developers who build the same things you do.
                        </p>

                        <div className="flex flex-wrap gap-3 mb-14">
                            <GlowButton onClick={() => navigate("/login")}>./get-started --free</GlowButton>
                            <OutlineButton onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                                learn more →
                            </OutlineButton>
                        </div>

                        <div className="flex items-stretch gap-0 pt-8 border-t border-zinc-900">
                            {heroStats.map(({ n, suffix, label }, i) => (
                                <div key={label} className={`${i < heroStats.length - 1 ? "pr-8 mr-8 border-r border-zinc-900" : ""}`}>
                                    <div className="text-xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.04em" }}>
                                        {n}<span className="text-indigo-500">{suffix}</span>
                                    </div>
                                    <div className="text-[10px] text-zinc-700 tracking-widest uppercase mt-0.5">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — orbit, hidden on small screens */}
                    <div className="fadeup-d hidden lg:flex flex-shrink-0 items-center justify-center lg:pl-8">
                        <OrbitDiagram />
                    </div>
                </div>
            </section>

            {/* MARQUEE */}
            <Marquee />

            {/* STATS BAR */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b border-zinc-900">
                {barStats.map(({ n, suffix, label }, i) => (
                    <div key={label} className={`text-center px-6 py-8 ${i < barStats.length - 1 ? "border-r border-zinc-900" : ""}`}>
                        <div className="text-2xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.04em" }}>
                            {n}<span className="text-indigo-500">{suffix}</span>
                        </div>
                        <div className="text-[10px] text-zinc-700 tracking-widest uppercase mt-1">{label}</div>
                    </div>
                ))}
            </div>

            {/* HOW IT WORKS */}
            <section className="max-w-7xl mx-auto px-6 lg:px-16 py-24">
                <SectionLabel>// how it works</SectionLabel>
                <h2 className="font-black text-white mb-14 leading-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(26px,3vw,42px)", letterSpacing: "-0.04em" }}>
                    Three steps to find<br /><span style={{ color: "#3f3f46" }}>your people.</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-900 border border-zinc-900 rounded-2xl overflow-hidden">
                    {steps.map((s, i) => (
                        <div key={s.num} className="relative bg-[#09090b] hover:bg-zinc-900/50 transition-colors p-8 cursor-default group">
                            <div className="text-[52px] font-black text-zinc-900 group-hover:text-zinc-800 transition-colors leading-none mb-6"
                                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.num}</div>
                            <div className="w-10 h-10 flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl mb-5 text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-900 transition-colors">
                                <s.Icon size={18} strokeWidth={1.5} />
                            </div>
                            <div className="text-md font-bold text-zinc-100 mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.title}</div>
                            <div className="text-md text-zinc-500 leading-relaxed">{s.desc}</div>
                            {i < 2 && <div className="hidden md:block absolute top-8 right-7 text-zinc-800">→</div>}
                        </div>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="max-w-7xl mx-auto px-6 lg:px-16 pb-24">
                <SectionLabel>// features</SectionLabel>
                <h2 className="font-black text-white mb-14 leading-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(26px,3vw,42px)", letterSpacing: "-0.04em" }}>
                    Everything you need<br /><span style={{ color: "#3f3f46" }}>to find your people.</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-900 border border-zinc-900 rounded-2xl overflow-hidden">
                    {features.map((f) => (
                        <div key={f.title} className="bg-[#09090b] hover:bg-zinc-900/50 transition-colors p-8 cursor-default">
                            <div className="flex items-center gap-3 mb-5">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${f.tagCls.split(" ")[0]}`}>
                                    <f.Icon size={15} strokeWidth={1.5} className={f.tagCls.split(" ")[1]} />
                                </div>
                                <span className={`text-[10px] tracking-widest uppercase px-2.5 py-1 rounded font-medium ${f.tagCls}`}>{f.tag}</span>
                            </div>
                            <div className="text-[18px] font-bold text-zinc-100 mb-3 leading-snug" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{f.title}</div>
                            <p className="text-[16px] text-zinc-500 leading-relaxed">{f.desc}</p>
                            {f.verify && (
                                <div className="inline-flex items-center gap-2.5 mt-5 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                                    <div>
                                        <div className="text-[11px] text-indigo-400 font-medium">Powered by devVerify™</div>
                                        <div className="text-[10px] text-zinc-600 mt-0.5">Document parsing · Credential verification</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ABOUT */}
            <section id="about" className="max-w-7xl mx-auto px-6 lg:px-16 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">
                <div>
                    <SectionLabel>// about devmatch</SectionLabel>
                    <h2 className="font-black text-white mb-5 leading-tight"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(24px,2.8vw,40px)", letterSpacing: "-0.04em" }}>
                        Stop connecting with<br />people who <span style={{ color: "#3f3f46" }}>won't ship.</span>
                    </h2>
                    <p className="text-md text-zinc-500 leading-relaxed mb-8" style={{ maxWidth: 380 }}>
                        DevMatch was built because traditional networks fail developers. You deserve matches based
                        on what you've actually built — not who you know or how polished your profile looks.
                    </p>
                    <div className="grid grid-cols-2 gap-px bg-zinc-900 border border-zinc-900 rounded-2xl overflow-hidden">
                        {[["4k", "+", "devs matched"], ["12k", "+", "repos analyzed"]].map(([n, s, l]) => (
                            <div key={l} className="bg-[#09090b] p-6">
                                <div className="text-2xl font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em" }}>
                                    {n}<span className="text-indigo-500">{s}</span>
                                </div>
                                <div className="text-[12px] text-zinc-700 tracking-widest uppercase mt-1">{l}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-3 lg:pt-10">
                    {aboutCards.map((c) => (
                        <div key={c.title}
                            className="flex items-start gap-4 p-5 bg-zinc-900/20 border border-zinc-900 rounded-2xl hover:border-indigo-500/25 transition-colors cursor-default">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>
                                <c.Icon size={16} strokeWidth={1.5} className="text-zinc-400" />
                            </div>
                            <div>
                                <div className="text-md font-bold text-zinc-200 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{c.title}</div>
                                <div className="text-[16px] text-zinc-500 leading-relaxed">{c.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-7xl mx-auto px-6 lg:px-16 pb-24">
                <div className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/20 px-8 md:px-16 py-20 text-center">
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: "radial-gradient(ellipse 60% 80% at 50% 110%, rgba(99,102,241,0.1) 0%, transparent 70%)"
                    }} />
                    <h2 className="relative font-black text-white mb-4 leading-tight"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(28px,4vw,52px)", letterSpacing: "-0.04em" }}>
                        Ready to find your<br /><span className="text-indigo-500">co-founder?</span>
                    </h2>
                    <p className="relative text-sm text-zinc-500 mb-10">Join thousands of developers already matching on DevMatch.</p>
                    <div className="relative">
                        <GlowButton onClick={() => navigate("/signup")}>./join-devmatch --free</GlowButton>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-zinc-900 px-6 lg:px-16 py-6 flex flex-wrap items-center justify-between gap-4">
                <span className="text-base font-black text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em" }}>
                    dev<span className="text-indigo-500">match</span>
                </span>
                <div className="flex gap-6">
                    {["Privacy", "Terms", "GitHub"].map(l => (
                        <a key={l} href="#" className="text-[11px] text-zinc-800 hover:text-zinc-500 tracking-widest uppercase transition-colors no-underline">{l}</a>
                    ))}
                </div>
                <p className="text-[11px] text-zinc-800">© {new Date().getFullYear()} DevMatch. Built for developers.</p>
            </footer>
        </div>
    );
}