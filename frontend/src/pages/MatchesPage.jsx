import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { supabase } from "../supabase/supabaseClient";

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
    }),
};

const tabFade = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.2 } },
};

const TABS = [
    { key: "liked-you", label: "Liked you", prefix: "// pending", prefixColor: "text-indigo-400" },
    { key: "matched", label: "Matched", prefix: "// unlocked", prefixColor: "text-emerald-400" },
    { key: "you-liked", label: "You liked", prefix: "// sent", prefixColor: "text-amber-400" },
];

export default function MatchesPage({ onLikeBack, onPass }) {
    const { user } = useUser();
    const { userid } = user;
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("liked-you");
    const [likedYou, setLikedYou] = useState([]);
    const [matched, setMatched] = useState([]);
    const [youLiked, setYouLiked] = useState([]);
    const [loading, setLoading] = useState(true);
    const [celebration, setCelebration] = useState({ show: false, dev: null });

    // ── Fetch all three lists ──────────────────────────────────────────────
    useEffect(() => {
        if (!userid) return;
        const fetchAll = async () => {
            setLoading(true);
            try {
                const [rLiked, rMatched, rYouLiked] = await Promise.all([
                    fetch(`https://devmatch-1npz.onrender.com/matches/pending-likes/${userid}`),
                    fetch(`https://devmatch-1npz.onrender.com/matches/matches/${userid}`),
                    fetch(`https://devmatch-1npz.onrender.com/matches/sent-pending-likes/${userid}`),
                ]);
                const [dLiked, dMatched, dYouLiked] = await Promise.all([
                    rLiked.json(),
                    rMatched.json(),
                    rYouLiked.json(),
                ]);
                if (rLiked.ok) setLikedYou(dLiked);
                if (rMatched.ok) setMatched(dMatched);
                if (rYouLiked.ok) setYouLiked(dYouLiked);
            } catch (err) {
                console.error("Failed to fetch matches data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [userid]);

    // ── Realtime: new match row inserted ──────────────────────────────────
    useEffect(() => {
        if (!userid) return;
        const channel = supabase
            .channel("matches-realtime")
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "matches" }, (payload) => {
                const m = payload.new;
                if (m.user1_id !== userid && m.user2_id !== userid) return;
                const otherId = m.user1_id === userid ? m.user2_id : m.user1_id;
                const dev = likedYou.find((u) => u.userid === otherId) || youLiked.find((u) => u.userid === otherId);
                if (!dev) return;
                setMatched((prev) => [{ ...dev, matchedAgo: "just now" }, ...prev]);
                setCelebration({ show: true, dev });
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [userid, likedYou, youLiked]);

    // ── Handlers ──────────────────────────────────────────────────────────

    // FIX: moved optimistic update BEFORE the await so state changes immediately
    const handleLikeBack = async (targetId) => {
        // Optimistic — remove from likedYou, add to matched instantly
        const dev = likedYou.find((d) => d.userid === targetId);
        if (dev) {
            setLikedYou((prev) => prev.filter((d) => d.userid !== targetId));
            setMatched((prev) => [{ ...dev, matchedAgo: "just now" }, ...prev]);
            setActiveTab("matched");
            setCelebration({ show: true, dev });
        }
        try {
            const res = await fetch(`https://devmatch-1npz.onrender.com/matches/like-pass`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userid, target_id: targetId, action: "like" }),
            });
            if (!res.ok) {
                // Rollback on failure
                setLikedYou((prev) => [...prev, dev]);
                setMatched((prev) => prev.filter((d) => d.userid !== targetId));
            } else {
                onLikeBack?.(targetId);
            }
        } catch (err) {
            console.error("Failed to like back:", err);
            // Rollback
            setLikedYou((prev) => [...prev, dev]);
            setMatched((prev) => prev.filter((d) => d.userid !== targetId));
        }
    };

    const handlePass = async (targetId) => {
        // Optimistic
        setLikedYou((prev) => prev.filter((d) => d.userid !== targetId));
        try {
            const res = await fetch(`https://devmatch-1npz.onrender.com/matches/like-pass`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userid, target_id: targetId, action: "pass" }),
            });
            if (!res.ok) throw new Error("Failed to pass");
            onPass?.(targetId);
        } catch (err) {
            console.error("Failed to pass:", err);
        }
    };

    const handleWithdraw = async (targetId) => {
        // Optimistic — remove instantly
        const dev = youLiked.find((d) => d.userid === targetId);
        setYouLiked((prev) => prev.filter((d) => d.userid !== targetId));
        try {
            const res = await fetch(`https://devmatch-1npz.onrender.com/matches/like-pass`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userid, target_id: targetId, action: "pass" }),
            });
            if (!res.ok) {
                // Rollback
                setYouLiked((prev) => [...prev, dev]);
            }
        } catch (err) {
            console.error("Failed to withdraw:", err);
            setYouLiked((prev) => [...prev, dev]);
        }
    };

    const counts = {
        "liked-you": likedYou.length,
        "matched": matched.length,
        "you-liked": youLiked.length,
    };

    const activeData = { "liked-you": likedYou, "matched": matched, "you-liked": youLiked }[activeTab];

    return (
        <div
            className="min-h-screen bg-zinc-950 text-zinc-200 font-mono overflow-y-auto"
            style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)`,
                backgroundSize: "32px 32px",
            }}
        >
            {/* ── Match celebration modal ── */}
            <AnimatePresence>
                {celebration.show && celebration.dev && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.88, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 12 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="relative w-full max-w-sm mx-4 bg-zinc-900 border border-emerald-900/60 rounded-2xl overflow-hidden"
                        >
                            {/* Emerald glow top */}
                            <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500/80 via-teal-400/60 to-transparent" />

                            {/* Radial bg glow */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 65%)" }}
                            />

                            <div className="relative p-8 flex flex-col items-center text-center gap-5">

                                {/* Icon */}
                                <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-800 flex items-center justify-center">
                                    <MatchIcon />
                                </div>

                                {/* Text */}
                                <div>
                                    <p className="text-[10px] text-emerald-500 tracking-[.2em] uppercase font-mono mb-2">
                                        // mutual match
                                    </p>
                                    <h2
                                        className="text-2xl font-black tracking-tight text-zinc-50 mb-2"
                                        style={{ fontFamily: "'Syne', sans-serif" }}
                                    >
                                        It's a match.
                                    </h2>
                                    <p className="text-sm text-zinc-400 leading-relaxed">
                                        You and{" "}
                                        <span className="text-zinc-200 font-semibold">
                                            {celebration.dev.photoHidden ? "an anonymous dev" : celebration.dev.name}
                                        </span>{" "}
                                        liked each other.
                                        <br />
                                        Messaging is now unlocked.
                                    </p>
                                </div>

                                {/* Avatars */}
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-indigo-950 border-2 border-indigo-700 flex items-center justify-center text-sm font-bold text-indigo-300">
                                        {user.name?.[0]?.toUpperCase() || "Y"}
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-8 h-[1px] bg-emerald-700" />
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <div className="w-8 h-[1px] bg-emerald-700" />
                                    </div>
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-700 flex items-center justify-center bg-zinc-800">
                                        {!celebration.dev.photoHidden && celebration.dev.avatarUrl ? (
                                            <img src={celebration.dev.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-sm font-bold text-zinc-400">
                                                {celebration.dev.photoHidden ? "?" : celebration.dev.name?.[0]?.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={() => {
                                            setCelebration({ show: false, dev: null });
                                            navigate(`/messages/${celebration.dev.match_id}`);
                                        }}
                                        className="flex-1 py-2.5 text-[11px] font-semibold tracking-widest rounded-lg border border-emerald-600 bg-emerald-900 text-white hover:bg-emerald-700 hover:border-emerald-500 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,.4)]"
                                    >
                                        ./open-chat
                                    </button>
                                    <button
                                        onClick={() => {
                                            setCelebration({ show: false, dev: null });
                                            setActiveTab("matched");
                                        }}
                                        className="flex-1 py-2.5 text-[11px] font-semibold tracking-widest rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all"
                                    >
                                        view matches
                                    </button>
                                </div>

                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Discover FAB ── */}
            <div className="absolute top-6 right-6 md:right-12 z-40 pt-16">
                <button
                    onClick={() => navigate("/discover")}
                    className="flex items-center gap-2 bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold tracking-widest px-5 py-2.5 rounded-lg transition-all hover:shadow-[0_0_25px_rgba(99,102,241,.4)] backdrop-blur"
                >
                    <PlusIcon />
                    ./discover-devs
                </button>
            </div>

            <div className="max-w-4xl mx-auto px-6 md:px-12 py-10 flex flex-col gap-8 mt-12">

                {/* ── Heading ── */}
                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
                    <p className="text-[11px] text-indigo-400 tracking-[.15em] uppercase mb-2">// your connections</p>
                    <h1 className="text-[clamp(28px,4vw,42px)] font-black tracking-tight leading-[1.05]" style={{ fontFamily: "'Syne', sans-serif" }}>
                        Matches &amp; <span className="text-zinc-600">incoming likes.</span>
                    </h1>
                </motion.div>




                {/* ── Tab bar ── */}
                <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
                    <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
                        {TABS.map(({ key, label, prefix, prefixColor }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`relative flex-1 flex flex-col items-center gap-0.5 py-2.5 px-3 rounded-lg text-[11px] font-semibold tracking-wider transition-all ${activeTab === key ? "bg-white/[0.07] text-zinc-100" : "text-zinc-600 hover:text-zinc-400"
                                    }`}
                            >
                                <span className={`text-[9px] tracking-widest uppercase font-mono ${activeTab === key ? prefixColor : "text-zinc-700"}`}>
                                    {prefix}
                                </span>
                                <span>{label}</span>

                                <span
                                    className={`absolute top-2 right-2 text-[14px] px-1.5 py-0.5 rounded-full font-mono 
    ${key === "liked-you"
                                            ? "bg-indigo-950 text-indigo-400 border border-indigo-900"
                                            : key === "matched"
                                                ? "bg-emerald-950 text-emerald-400 border border-emerald-900"
                                                : "bg-amber-950 text-amber-500 border border-amber-900"
                                        }`}
                                >
                                    {counts[key]}
                                </span>
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* ── Tab content ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        variants={tabFade}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="flex flex-col gap-3"
                    >
                        {loading && (
                            <div className="flex items-center gap-3 py-12 justify-center">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                                        animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                                    />
                                ))}
                            </div>
                        )}

                        {!loading && activeData.length === 0 && (
                            <EmptyState tab={activeTab} onDiscover={() => navigate("/discover")} />
                        )}

                        {!loading && activeData.map((dev, i) => {
                            if (activeTab === "liked-you") return (
                                <LikeCard
                                    key={dev.userid}
                                    dev={dev}
                                    index={i}
                                    onLikeBack={() => handleLikeBack(dev.userid)}
                                    onPass={() => handlePass(dev.userid)}
                                    onViewProfile={() => navigate(`/viewProfile/${dev.userid}`)}
                                />
                            );
                            if (activeTab === "matched") return (
                                <MatchedCard
                                    key={dev.userid}
                                    dev={dev}
                                    index={i}
                                    onViewProfile={() => navigate(`/viewDeveloper/${dev.userid}`)}
                                    onOpenChat={() => navigate(`/messages/${dev.match_id}`)}
                                />
                            );
                            if (activeTab === "you-liked") return (
                                <YouLikedCard
                                    key={dev.userid}
                                    dev={dev}
                                    index={i}
                                    onViewProfile={() => navigate(`/viewDeveloper/${dev.userid}`)}
                                    onWithdraw={() => handleWithdraw(dev.userid)}
                                />
                            );
                            return null;
                        })}
                    </motion.div>
                </AnimatePresence>

            </div>
        </div>
    );
}

// ── Like card ─────────────────────────────────────────────────────────────────

function LikeCard({ dev, index, onLikeBack, onPass, onViewProfile }) {
    return (
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={index}>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="h-[2px] w-full bg-gradient-to-r from-indigo-600/60 via-violet-600/40 to-transparent" />
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex gap-3 items-start">
                        <DevAvatar dev={dev} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[13px] font-black text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    {dev.photoHidden ? "Anonymous dev" : dev.name}
                                </span>
                                {dev.photoHidden && <AnonTag />}
                            </div>
                            <p className="text-[11px] text-indigo-400 font-semibold tracking-wide mt-0.5">{dev.devType || dev.role}</p>
                            <p className="text-[11px] text-zinc-600">{[dev.city, dev.country].filter(Boolean).join(", ") || dev.location}</p>
                        </div>
                    </div>
                    {dev.stack?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {dev.stack.slice(0, 5).map((s) => <StackTag key={s} label={s} />)}
                        </div>
                    )}
                    {dev.goals?.length > 0 && (
                        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2.5">
                            <p className="text-[9px] text-indigo-400 tracking-[.15em] uppercase mb-1.5 font-semibold">// looking for</p>
                            <div className="flex flex-wrap gap-1.5">
                                {dev.goals.slice(0, 3).map((g) => (
                                    <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">{g}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                        {dev.projects != null && <StatText value={dev.projects} label="projects" />}
                        {dev.experience != null && <StatText value={dev.experience} label="yrs exp" />}
                        {dev.linkedProfile && <StatText value={dev.linkedProfile} label="linked" />}
                    </div>
                    {dev.bio && <p className="text-[11px] text-zinc-500 leading-[1.8] line-clamp-2">{dev.bio}</p>}
                    <div className="flex gap-2 pt-1">
                        <button onClick={onViewProfile} className="px-3 py-2 text-[11px] font-semibold tracking-widest rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all">
                            ./view-profile
                        </button>
                        <button onClick={onLikeBack} className="flex-1 py-2 text-[11px] font-semibold tracking-widest rounded-lg border border-indigo-500 bg-indigo-600/90 text-white hover:bg-indigo-500 hover:border-indigo-400 transition-all hover:shadow-[0_0_25px_rgba(99,102,241,.4)]">
                            like back →
                        </button>
                        <button onClick={onPass} className="px-3 py-2 text-[11px] text-zinc-600 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:text-zinc-400 transition-all">
                            pass
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ── Matched card ──────────────────────────────────────────────────────────────

function MatchedCard({ dev, index, onViewProfile, onOpenChat }) {
    return (
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={index}>
            <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-2xl overflow-hidden">
                <div className="h-[2px] w-full bg-gradient-to-r from-emerald-600/60 via-teal-600/40 to-transparent" />
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex gap-3 items-start">
                        <DevAvatar dev={dev} />
                        <div className="flex-1 min-w-0">
                            <span className="text-[13px] font-black text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
                                {dev.photoHidden ? "Anonymous dev" : dev.name}
                            </span>
                            <p className="text-[11px] text-indigo-400 font-semibold tracking-wide mt-0.5">{dev.devType || dev.role}</p>
                            <p className="text-[11px] text-zinc-600">{[dev.city, dev.country].filter(Boolean).join(", ") || dev.location}</p>
                            {dev.matchedAgo && (
                                <p className="text-[10px] text-emerald-600 tracking-wider mt-0.5">// matched {dev.matchedAgo}</p>
                            )}
                        </div>
                    </div>
                    {dev.stack?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {dev.stack.slice(0, 5).map((s) => <StackTag key={s} label={s} />)}
                        </div>
                    )}
                    {dev.goals?.length > 0 && (
                        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2.5">
                            <p className="text-[9px] text-indigo-400 tracking-[.15em] uppercase mb-1.5 font-semibold">// looking for</p>
                            <div className="flex flex-wrap gap-1.5">
                                {dev.goals.slice(0, 3).map((g) => (
                                    <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">{g}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                        {dev.projects != null && <StatText value={dev.projects} label="projects" />}
                        {dev.experience != null && <StatText value={dev.experience} label="yrs exp" />}
                        {dev.linkedProfile && <StatText value={dev.linkedProfile} label="linked" />}
                    </div>
                    {dev.bio && <p className="text-[11px] text-zinc-500 leading-[1.8] line-clamp-2">{dev.bio}</p>}
                    <div className="flex gap-2 pt-1">
                        <button onClick={onViewProfile} className="px-3 py-2 text-[11px] font-semibold tracking-widest rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all">
                            ./view-profile
                        </button>
                        <button onClick={onOpenChat} className="flex-1 py-2 text-[11px] font-semibold tracking-widest rounded-lg border border-emerald-600 bg-emerald-900 text-white hover:bg-emerald-700 hover:border-emerald-500 transition-all hover:shadow-[0_0_25px_rgba(16,185,129,.45)]">
                            ./open-chat
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ── You liked card ────────────────────────────────────────────────────────────

function YouLikedCard({ dev, index, onViewProfile, onWithdraw }) {
    const [confirming, setConfirming] = useState(false);
    return (
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={index}>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                <div className="h-[2px] w-full bg-gradient-to-r from-amber-500/60 via-amber-400/30 to-transparent" />
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex gap-3 items-start">
                        <DevAvatar dev={dev} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[13px] font-black text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    {dev.photoHidden ? "Anonymous dev" : dev.name}
                                </span>
                                {dev.photoHidden && <AnonTag />}
                            </div>
                            <p className="text-[11px] text-indigo-400 font-semibold tracking-wide mt-0.5">{dev.devType || dev.role}</p>
                            <p className="text-[11px] text-zinc-600">{[dev.city, dev.country].filter(Boolean).join(", ") || dev.location}</p>
                        </div>
                        <span className="shrink-0 text-[10px] px-2 py-1 rounded-md bg-amber-950/60 text-amber-500 border border-amber-900/60 font-mono tracking-wider">
                            waiting
                        </span>
                    </div>
                    {dev.stack?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {dev.stack.slice(0, 5).map((s) => <StackTag key={s} label={s} />)}
                        </div>
                    )}
                    {dev.goals?.length > 0 && (
                        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2.5">
                            <p className="text-[9px] text-indigo-400 tracking-[.15em] uppercase mb-1.5 font-semibold">// looking for</p>
                            <div className="flex flex-wrap gap-1.5">
                                {dev.goals.slice(0, 3).map((g) => (
                                    <span key={g} className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">{g}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                        {dev.projects != null && <StatText value={dev.projects} label="projects" />}
                        {dev.experience != null && <StatText value={dev.experience} label="yrs exp" />}
                        {dev.likedAt && (
                            <span className="text-[11px] text-zinc-700 font-mono">
                                liked <span className="text-zinc-500">{new Date(dev.likedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                            </span>
                        )}
                    </div>
                    {dev.bio && <p className="text-[11px] text-zinc-500 leading-[1.8] line-clamp-2">{dev.bio}</p>}
                    <div className="flex gap-2 pt-1">
                        <button onClick={onViewProfile} className="flex-1 px-3 py-2 text-[11px] font-semibold tracking-widest rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all">
                            ./view-profile
                        </button>
                        {!confirming ? (
                            <button onClick={() => setConfirming(true)} className="px-3 py-2 text-[11px] font-semibold tracking-widest rounded-lg border border-zinc-800 text-zinc-600 hover:border-red-500 hover:text-red-400 hover:bg-red-950 transition-all hover:shadow-[0_0_18px_rgba(239,68,68,0.35)]">
                                withdraw
                            </button>
                        ) : (
                            <div className="flex gap-1.5">
                                <button onClick={onWithdraw} className="px-3 py-2 text-[11px] font-semibold tracking-widest rounded-lg border border-red-800 bg-red-950/60 text-red-400 hover:bg-red-950 transition-all">
                                    confirm
                                </button>
                                <button onClick={() => setConfirming(false)} className="px-3 py-2 text-[11px] text-zinc-600 rounded-lg border border-zinc-800 hover:border-zinc-700 hover:text-zinc-400 transition-all">
                                    cancel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ tab, onDiscover }) {
    const messages = {
        "liked-you": { text: "No one has liked you yet.", sub: "Keep your profile sharp and check back soon." },
        "matched": { text: "No matches yet.", sub: "Like someone back from the 'Liked you' tab to match." },
        "you-liked": { text: "You haven't liked anyone.", sub: "Head to discover to find developers to connect with." },
    };
    const { text, sub } = messages[tab];
    return (
        <div className="py-16 text-center border border-dashed border-white/[0.05] rounded-2xl flex flex-col items-center gap-3">
            <p className="text-[11px] text-zinc-700 tracking-widest">{text}</p>
            <p className="text-[11px] text-zinc-800">{sub}</p>
            {tab === "you-liked" && (
                <button onClick={onDiscover} className="mt-2 text-[11px] font-semibold tracking-widest text-indigo-400 border border-indigo-800 bg-indigo-950/40 hover:bg-indigo-950 px-5 py-2 rounded-lg transition-all">
                    ./discover-devs
                </button>
            )}
        </div>
    );
}

// ── Shared components ─────────────────────────────────────────────────────────

function DevAvatar({ dev }) {
    return (
        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
            {dev.avatarUrl ? (
                <img src={dev.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-400 bg-zinc-800">
                    {dev.photoHidden ? "?" : (dev.initials || dev.name?.[0]?.toUpperCase() || "?")}
                </div>
            )}
        </div>
    );
}

function StackTag({ label }) {
    return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">{label}</span>
    );
}

function AnonTag() {
    return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-500 border border-amber-900 italic font-mono">photo hidden</span>
    );
}

function StatText({ value, label }) {
    return (
        <span className="text-[11px] text-zinc-700 font-mono">
            <span className="text-zinc-400 font-medium">{value}</span> {label}
        </span>
    );
}

function PlusIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
            <line x1="8" y1="4.5" x2="8" y2="11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <line x1="4.5" y1="8" x2="11.5" y2="8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    );
}

function MatchIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 21C12 21 3 14.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 13 5.08C13.09 4.96 13.19 4.85 13.3 4.74" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 8.5C21 14.5 12 21 12 21" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.5 3C18.54 3 21 5.42 21 8.5" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 12L11 14L15 10" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}