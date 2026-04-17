import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, StackTag, AnonTag } from "../components/ui";
import { supabase } from "../supabase/supabaseClient";
import { useUser } from "../context/UserContext";

const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
    }),
};

const devTypeOptions = [
    "Frontend",
    "Backend",
    "Full-Stack Web",
    "Full-Stack Mobile",
    "ML / AI",
    "Data Analytics",
    "DevOps",
    "UI/UX Designer",
    "QA / Testing",
];

const FILTERS = ["All", ...devTypeOptions];

export default function DiscoverPage({ likedIds = new Set(), onLike }) {
    const { user } = useUser();
    const navigate = useNavigate();
    const [developers, setDevelopers] = useState([]);
    const [filter, setFilter] = useState("All");
    const [expandedId, setExpandedId] = useState(null);
    const [likedState, setLikedState] = useState(
        likedIds instanceof Set ? likedIds : new Set(likedIds)
    );
    const { userid } = user;
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDevelopers() {
            setLoading(true);
            try {
                const res = await fetch(`https://devmatch-1npz.onrender.com/matches/discover-matches/${userid}`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });
                const data = await res.json();
                if (!res.ok) {
                    console.error("Failed to fetch discover matches", data);
                    return;
                }
                setDevelopers(data);
            } catch (err) {
                console.error("Error fetching developers:", err);
            }
            finally {
                setLoading(false);
            }
        }
        fetchDevelopers();
    }, [userid]);

    const handleLike = async (targetId) => {
        // 1. instantly remove from UI (optimistic update)
        setDevelopers(prev => prev.filter(dev => dev.userid !== targetId));

        setLikedState(prev => {
            const updated = new Set(prev);
            updated.add(targetId);
            return updated;
        });

        try {
            const res = await fetch("https://devmatch-1npz.onrender.com/matches/like-pass", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_id: userid,
                    target_id: targetId,
                    action: "like",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error("Like failed", data);

                // rollback UI if failed
                setDevelopers(prev => [...prev, developers.find(d => d.userid === targetId)]);

                setLikedState(prev => {
                    const copy = new Set(prev);
                    copy.delete(targetId);
                    return copy;
                });

                return;
            }

            if (data.match) {
                alert("It's a match");
            }

        } catch (err) {
            console.error("Error liking user:", err);
        }
    };
    const filtered = developers.filter((d) => {
        if (filter === "All") return true;
        return d.devType === filter;
    });

    return (
        <div className="bg-[#0f0f11] text-zinc-200 min-h-screen font-mono">


            <div className="px-8 md:px-12 py-10 max-w-7xl mx-auto">

                {/* ── Heading ── */}
                <motion.div
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    custom={0}
                    className="mb-8  mt-12 flex items-start justify-between w-full"
                >
                    {/* ── Heading ── */}
                    <div className="max-w-lg">
                        <p className="text-[11px] text-indigo-400 tracking-[.15em] uppercase mb-2">
                        // be the first to connect
                        </p>
                        <h1
                            className="text-[clamp(28px,4vw,42px)] font-black tracking-tight leading-[1.05] mb-3"
                            style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                            Discover <span className="text-zinc-600">developers.</span>
                        </h1>
                        <p className="text-sm text-zinc-600 leading-[1.9]">
                            These developers haven't liked you yet —{" "}
                            <span className="text-teal-400">be the first to reach out.</span>
                        </p>
                    </div>

                    {/* ── Buttons ── */}

                    <div className="absolute top-6 right-6 md:right-12 z-50 pt-10 mt-10 mr-6">
                        <button
                            onClick={() => navigate("/matches")}
                            className="flex items-center gap-2 bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-semibold tracking-widest px-5 py-2.5 rounded-lg transition-all hover:shadow-[0_0_25px_rgba(99,102,241,.4)] backdrop-blur"
                        >
                            <BackIcon />
                            ./matches
                        </button>
                    </div>



                </motion.div>


                {/* ── Filters ── */}
                <motion.div
                    variants={fadeUp} initial="hidden" animate="show" custom={1}
                    className="flex flex-wrap gap-2 mb-8"
                >
                    {FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`text-[11px] font-semibold tracking-widest px-4 py-1.5 rounded-lg border transition-all ${filter === f
                                ? "bg-indigo-950 border-indigo-700 text-indigo-300"
                                : "bg-transparent border-zinc-800 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </motion.div>

                {/* ── Grid ── */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((dev, i) => (
                        <motion.div
                            key={dev.userid}
                            variants={fadeUp} initial="hidden" animate="show" custom={i + 2}
                            className="flex"
                        >
                            <DiscoverCard
                                dev={dev}
                                liked={likedState.has(dev.userid)}
                                expanded={expandedId === dev.userid}
                                onToggleExpand={() =>
                                    setExpandedId(expandedId === dev.userid ? null : dev.userid)
                                }
                                onLike={() => handleLike(dev.userid)}
                                onViewProfile={() => navigate(`/viewProfile/${dev.userid}`)}
                            />
                        </motion.div>
                    ))}

                    {loading ? (
                        <div className="col-span-3 py-16 text-center text-[11px] text-zinc-500 tracking-wider">
                            Loading developers...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="col-span-3 py-16 text-center text-[11px] text-zinc-700 tracking-wider border border-dashed border-zinc-800 rounded-xl">
                            No developers match this filter right now.
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

// ── Discover card ─────────────────────────────────────────────────────────────

function DiscoverCard({ dev, liked, expanded, onToggleExpand, onLike, onViewProfile }) {
    const hasGoals = dev.goals && dev.goals.length > 0;

    return (
        <div className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden flex flex-col transition-colors flex-1">

            {/* Top accent line */}
            <div className="h-[2px] w-full bg-gradient-to-r from-indigo-600/60 via-violet-600/40 to-transparent" />

            <div className="p-5 flex flex-col gap-3 flex-1">

                {/* ── Header ── */}
                <div className="flex gap-3 items-start">
                    <Avatar
                        initials={dev.initials}
                        color={dev.color}
                        size="lg"
                        src={dev.avatarUrl}
                    />
                    <div className="flex-1 min-w-0">
                        <p
                            className="text-[14px] font-black text-zinc-100 truncate"
                            style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                            {dev.username}
                        </p>
                        <p className="text-[11px] text-indigo-400 font-semibold tracking-wide mt-0.5">
                            {dev.devType}
                        </p>
                        <p className="text-[11px] text-zinc-600 mt-0.5">
                            {[dev.city, dev.country].filter(Boolean).join(", ")}
                        </p>
                    </div>
                    {dev.photoHidden && <AnonTag />}
                </div>

                {/* ── Stat pills ── */}
                <div className="flex flex-wrap gap-1.5">
                    {dev.projects != null && (
                        <StatPill icon="⬡" value={dev.projects} label="projects" />
                    )}
                    {dev.experience != null && (
                        <StatPill icon="◎" value={`${dev.experience}y`} label="exp" />
                    )}
                </div>

                {/* ── Stack ── */}
                {dev.stack && dev.stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {dev.stack.slice(0, 5).map((s) => (
                            <StackTag key={s} label={s} />
                        ))}
                        {dev.stack.length > 5 && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                                +{dev.stack.length - 5}
                            </span>
                        )}
                    </div>
                )}

                {/* ── Goals: "looking for" ── */}
                {hasGoals && (
                    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2.5">
                        <p className="text-[9px] text-indigo-400 tracking-[.15em] uppercase mb-1.5 font-semibold">
                            // looking for
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {dev.goals.slice(0, 3).map((g) => (
                                <span
                                    key={g}
                                    className="text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold"
                                >
                                    {g}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Bio ── */}
                {dev.bio && (
                    <div>
                        <p className={`text-[11px] text-zinc-500 leading-[1.8] transition-all ${expanded ? "" : "line-clamp-2"}`}>
                            {dev.bio}
                        </p>
                        {dev.bio.length > 100 && (
                            <button
                                onClick={onToggleExpand}
                                className="text-[10px] text-zinc-600 hover:text-zinc-400 mt-1 tracking-wider transition-colors"
                            >
                                {expanded ? "show less ↑" : "read more ↓"}
                            </button>
                        )}
                    </div>
                )}

            </div>

            {/* ── Footer actions ── */}
            <div className="px-5 pb-5 pt-1 flex gap-2">
                <button
                    onClick={onViewProfile}
                    className="flex-1 py-2 text-[11px] font-semibold tracking-widest rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all"
                >
                    ./view-profile
                </button>
                <button
                    onClick={onLike}
                    disabled={liked}
                    className={`flex-1 py-2 text-[11px] font-semibold tracking-widest rounded-lg border transition-all ${liked
                        ? "bg-emerald-950 border-emerald-800 text-emerald-400 cursor-default"
                        : "bg-transparent border-indigo-800 text-indigo-400 hover:bg-indigo-950 hover:border-indigo-600 hover:shadow-[0_0_12px_rgba(99,102,241,.2)]"
                        }`}
                >
                    {liked ? "✓ liked" : "./like"}
                </button>
            </div>
        </div>
    );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({ icon, value, label }) {
    return (
        <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1">
            <span className="text-[10px] text-zinc-500">{icon}</span>
            <span className="text-[11px] text-zinc-300 font-medium">{value}</span>
            <span className="text-[10px] text-zinc-600">{label}</span>
        </div>
    );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function BackIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <polyline
                points="10,3 4,8 10,13"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
            <polyline
                points="8,4.5 8,8 10.5,10"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}