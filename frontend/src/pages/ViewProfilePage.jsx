import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
    Github, ExternalLink, ArrowLeft,
    Rocket, Handshake, GraduationCap, BookOpen, Briefcase, FlaskConical,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { supabase } from "../supabase/supabaseClient";

// ── Design tokens (mirrors ProfilePage) ────────────────────────────────────
const fadeUp = (i = 0) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: i * 0.055, ease: [0.22, 1, 0.36, 1] },
});

const glass = "bg-white/[0.03] backdrop-blur-md border border-white/[0.07] rounded-2xl";
const glassInner = "bg-white/[0.04] border border-white/[0.06] rounded-xl";

const langColor = {
    TypeScript: "bg-indigo-950/80 text-indigo-400 border-indigo-900/50",
    "Node.js": "bg-emerald-950/80 text-emerald-400 border-emerald-900/50",
    React: "bg-violet-950/80 text-violet-400 border-violet-900/50",
    SQL: "bg-zinc-800/80 text-zinc-400 border-zinc-700/50",
    Shell: "bg-amber-950/80 text-amber-400 border-amber-900/50",
    Docker: "bg-sky-950/80 text-sky-400 border-sky-900/50",
    Python: "bg-teal-950/80 text-teal-400 border-teal-900/50",
};

const goalMeta = {
    "Co-founder": { icon: Rocket, desc: "Build a startup with one person from scratch." },
    "Collaborator": { icon: Handshake, desc: "Partner on a side project or open source work." },
    "Mentor": { icon: GraduationCap, desc: "Guide a junior dev one-on-one through growth." },
    "Mentee": { icon: BookOpen, desc: "Learn from a senior developer in focused pairing." },
    "Freelance Partner": { icon: Briefcase, desc: "Find one reliable dev for client work." },
    "Accountability Buddy": { icon: FlaskConical, desc: "Ship consistently with someone who keeps you honest." },
};

// ── Main component ──────────────────────────────────────────────────────────
export default function ViewProfilePage() {
    const { userid: targetId } = useParams();   // /profile/:userid
    const { user } = useUser();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [cvData, setCvData] = useState({ education: [], skills: [], repos: [] });
    const [liked, setLiked] = useState(false);
    const [loading, setLoading] = useState(true);
    const [celebration, setCelebration] = useState({ show: false, dev: null });

    // ── Fetch public profile ──
    useEffect(() => {
        if (!targetId) return;

        const fetchAll = async () => {
            try {
                const [resProfile, resGoals, resPrefs] = await Promise.all([
                    axios.get(`http://localhost:3000/profile/user-info/${targetId}`),
                    axios.get(`http://localhost:3000/profile/get-user-goals/${targetId}`),
                    axios.get(`http://localhost:3000/profile/get-user-preferences/${targetId}`),
                ]);

                const base = resProfile.data;

                setProfile({
                    name: base.name || "",
                    surname: base.surname || "",
                    username: base.username || "",
                    city: base.city || "",
                    country: base.country || "",
                    bio: base.bio || "",
                    devType: base.devType || "",
                    avatarUrl: base.avatarUrl || null,
                    photoHidden: base.photoHidden || false,
                    goals: resGoals.data?.goals || [],
                    preferences: resPrefs.data?.preferences || {},
                });
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            }
        };



        const fetchCv = async () => {
            try {
                const res = await axios.get(`http://localhost:3000/profile/get-cv-data/${targetId}`);
                setCvData(res.data);
            } catch (err) {
                console.error("Failed to fetch CV data:", err);
            }
        };

        Promise.all([fetchAll(), fetchCv()]).finally(() => setLoading(false));
    }, [targetId]);

    useEffect(() => {
        if (!user?.userid) return;

        const channel = supabase
            .channel("profile-match-celebration")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "matches" },
                async (payload) => {
                    const m = payload.new;

                    // only react if current user is involved
                    if (m.user1_id !== user.userid && m.user2_id !== user.userid) return;

                    const otherId =
                        m.user1_id === user.userid ? m.user2_id : m.user1_id;

                    try {
                        const res = await axios.get(
                            `http://localhost:3000/profile/user-info/${otherId}`
                        );

                        const dev = {
                            ...res.data,
                            match_id: m.match_id,
                            matchedAgo: "just now",
                        };

                        setCelebration({
                            show: true,
                            dev,
                        });
                    } catch (err) {
                        console.error("Failed to fetch matched user:", err);
                    }
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user?.userid]);

    const handleLike = async () => {
        if (liked) return;

        try {
            const res = await axios.post(
                "http://localhost:3000/matches/like-pass",
                {
                    user_id: user.userid,
                    target_id: targetId,
                    action: "like",
                }
            );

            if (res.data?.success) {
                setLiked(true);
            }
        } catch (err) {
            console.error("Failed to like:", err.response?.data || err.message);
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="h-screen bg-zinc-950 font-mono flex items-center justify-center"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)`,
                    backgroundSize: "32px 32px",
                }}
            >


                <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                                animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                            />
                        ))}
                    </div>
                    <p className="text-[12px] text-zinc-600 uppercase tracking-widest">loading profile</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="h-screen bg-zinc-950 font-mono flex items-center justify-center">
                <p className="text-zinc-600 text-sm">Developer not found.</p>
            </div>
        );
    }

    const displayName = profile.photoHidden ? null : `${profile.name} ${profile.surname}`.trim();
    const initials = profile.name ? profile.name[0].toUpperCase() : "?";

    const prefRows = [
        { label: "Work style", value: profile.preferences?.workStyle },
        { label: "Availability", value: profile.preferences?.availability },
        { label: "Commitment", value: profile.preferences?.commitment },
        { label: "Timezone overlap", value: profile.preferences?.timezone },
    ].filter((r) => r.value);

    return (
        <div
            className="min-h-screen bg-zinc-950 font-mono overflow-y-auto"
            style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)`,
                backgroundSize: "32px 32px",
            }}
        >

            {celebration.show && celebration.dev && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
                    <div className="bg-zinc-900 border border-emerald-800 rounded-2xl p-6 w-full max-w-sm text-center">

                        <div className="text-emerald-400 text-xs uppercase tracking-widest mb-3">
                            mutual match
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">
                            It's a match.
                        </h2>

                        <p className="text-sm text-zinc-400 mb-4">
                            You and{" "}
                            <span className="text-white font-semibold">
                                {celebration.dev.photoHidden
                                    ? "an anonymous dev"
                                    : celebration.dev.name}
                            </span>{" "}
                            liked each other.
                        </p>

                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={() => {
                                    setCelebration({ show: false, dev: null });
                                    navigate(`/messages/${celebration.dev.match_id}`);
                                }}
                                className="px-4 py-2 text-xs bg-emerald-600 text-white rounded-lg"
                            >
                                open chat
                            </button>

                            <button
                                onClick={() =>
                                    setCelebration({ show: false, dev: null })
                                }
                                className="px-4 py-2 text-xs border border-zinc-700 text-zinc-300 rounded-lg"
                            >
                                close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-5">

                {/* ── Back + actions bar ── */}
                <motion.div {...fadeUp(0)} className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-[11px] text-zinc-500 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-all"
                    >
                        <ArrowLeft className="w-3 h-3" />
                        back
                    </button>

                    <button
                        onClick={handleLike}
                        disabled={liked}
                        className={`flex items-center gap-2 text-[11px] font-semibold tracking-widest px-5 py-2 rounded-lg border transition-all ${liked
                            ? "bg-emerald-950 border-emerald-800 text-emerald-400 cursor-default"
                            : "bg-transparent border-indigo-700 text-indigo-400 hover:bg-indigo-950 hover:border-indigo-500 hover:shadow-[0_0_16px_rgba(99,102,241,.25)]"
                            }`}
                    >
                        {liked ? "✓ liked" : "./like-developer"}
                    </button>
                </motion.div>

                {/* ── Hero card ── */}
                <motion.div {...fadeUp(1)} className={`${glass} p-6`}>
                    <div className="flex items-start gap-5">

                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center bg-indigo-950">
                                {!profile.photoHidden && profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-indigo-300">
                                        {profile.photoHidden ? "?" : initials}
                                    </span>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-zinc-950" />
                        </div>

                        {/* Identity */}
                        <div className="flex-1 min-w-0">
                            {profile.photoHidden ? (
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="text-xl font-bold text-zinc-50 tracking-tight leading-none">
                                        Anonymous dev
                                    </h1>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-500 border border-amber-900 italic">
                                        photo hidden
                                    </span>
                                </div>
                            ) : (
                                <h1 className="text-xl font-bold text-zinc-50 tracking-tight leading-none mb-1">
                                    {displayName}
                                </h1>
                            )}

                            <p className="text-xs text-indigo-400 font-semibold tracking-wide mb-0.5">
                                {profile.devType}
                            </p>
                            <p className="text-xs text-zinc-600 font-mono">
                                {[profile.city, profile.country].filter(Boolean).join(", ")}
                            </p>

                            {profile.bio && (
                                <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                                    {profile.bio}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* ── Goals ── */}
                {profile.goals.length > 0 && (
                    <motion.div {...fadeUp(2)} className={`${glass} p-5`}>
                        <SectionLabel label="// looking for" />
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            {profile.goals.map((title) => {
                                const meta = goalMeta[title];
                                if (!meta) return null;
                                const Icon = meta.icon;
                                return (
                                    <div
                                        key={title}
                                        className="text-left p-4 rounded-xl border border-indigo-800/60 bg-indigo-950/40"
                                    >
                                        <div className="mb-2">
                                            <Icon className="w-4 h-4 text-indigo-400" />
                                        </div>
                                        <div className="text-xs font-semibold text-zinc-100 mb-1 font-mono">{title}</div>
                                        <div className="text-[10px] text-zinc-500 leading-relaxed">{meta.desc}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ── Collaboration preferences ── */}
                {prefRows.length > 0 && (
                    <motion.div {...fadeUp(3)} className={`${glass} p-5`}>
                        <SectionLabel label="// collaboration preferences" />
                        <div className="space-y-3 mt-4">
                            {prefRows.map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-b-0">
                                    <p className="text-[11px] text-zinc-600 uppercase tracking-widest">{label}</p>
                                    <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/50 px-2.5 py-1 rounded-lg">
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Education ── */}
                {cvData.education.length > 0 && (
                    <motion.div {...fadeUp(4)} className={`${glass} p-5`}>
                        <SectionLabel label="// education & certifications" />
                        <div className="grid grid-cols-1 gap-3 mt-4">
                            {cvData.education.map((edu, i) => (
                                <div key={i} className={`${glassInner} p-3`}>
                                    <p className="text-[10px] text-zinc-500 uppercase font-mono">{edu.type}</p>
                                    <p className="text-xs text-zinc-300 font-mono">{edu.title}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Skills ── */}
                {cvData.skills.length > 0 && (
                    <motion.div {...fadeUp(5)} className={`${glass} p-5`}>
                        <SectionLabel label="// skills" />
                        <div className="flex flex-wrap gap-2 mt-4">
                            {cvData.skills.map((skill, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1.5 text-xs rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-400/20 font-mono"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── GitHub projects ── */}
                {cvData.repos.length > 0 && (
                    <motion.div {...fadeUp(6)} className={`${glass} p-5`}>
                        <SectionLabel label="// github.projects" />
                        <div className="flex flex-col gap-3 mt-4">
                            {cvData.repos.map((repo, i) => (
                                <a
                                    key={i}
                                    href={repo.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${glassInner} p-4 group transition-all hover:border-indigo-700/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.08)]`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center">
                                                <Github className="w-3.5 h-3.5 text-indigo-400" />
                                            </div>
                                            <p className="text-sm font-semibold text-zinc-200 group-hover:text-indigo-300 transition-colors font-mono">
                                                {repo.name}
                                            </p>
                                        </div>
                                        <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
                                    </div>

                                    {repo.description && (
                                        <p className="text-[11px] text-zinc-500 leading-relaxed mb-3 group-hover:text-zinc-400 transition-colors">
                                            {repo.description}
                                        </p>
                                    )}

                                    {repo.languages?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {repo.languages.map((lang, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`text-[9px] px-2 py-0.5 rounded-md border font-mono ${langColor[lang] || "bg-zinc-800/80 text-zinc-300 border-zinc-700/50"
                                                        }`}
                                                >
                                                    {lang}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {repo.topics?.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {repo.topics.map((topic, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-[9px] px-2 py-0.5 rounded-md bg-indigo-500/5 border border-indigo-500/10 text-indigo-300 font-mono hover:bg-indigo-500/10 transition"
                                                >
                                                    #{topic}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </a>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ── Bottom like CTA ── */}
                <motion.div {...fadeUp(7)} className={`${glass} p-5 flex items-center justify-between gap-4`}>
                    <div>
                        <p className="text-xs font-semibold text-zinc-300" style={{ fontFamily: "'Syne', sans-serif" }}>
                            Interested in {profile.photoHidden ? "this developer" : profile.name}?
                        </p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                            Like their profile — if they like you back, messaging unlocks.
                        </p>
                    </div>
                    <button
                        onClick={handleLike}
                        disabled={liked}
                        className={`shrink-0 px-6 py-2.5 text-[11px] font-semibold tracking-widest rounded-lg border transition-all ${liked
                            ? "bg-emerald-950 border-emerald-800 text-emerald-400 cursor-default"
                            : "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,.4)]"
                            }`}
                    >
                        {liked ? "✓ liked" : "./like"}
                    </button>
                </motion.div>

                <div className="h-4" />
            </div>
        </div>
    );
}

// ── Small helpers ───────────────────────────────────────────────────────────
function SectionLabel({ label }) {
    return (
        <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-mono">{label}</span>
    );
}