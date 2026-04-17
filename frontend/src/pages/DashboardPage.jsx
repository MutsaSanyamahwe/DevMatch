import { motion } from "framer-motion";
import { Compass, Layers, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import axios from "axios";

const quotes = [
    "Build with intention.",
    "Great products start with great people.",
    "Momentum beats perfection.",
    "Your next teammate changes everything.",
    "Small commits, big impact.",
    "Ideas grow faster together.",
    "Coding saves lives.",
    "Big ideas start small.",
    "Every project is a chance to play.",
    "One spark can start a movement.",
    "Your next teammate might be your missing piece.",
    "Good vibes build great products.",
    "Collaboration makes the work feel lighter.",
    "Every click could be a connection.",
    "You weren't meant to build in silence.",
    "Playful minds make serious impact.",
    "Your skills are waiting to surprise someone.",
    "The right match feels like magic.",
    "Coding is worth every keystroke.",
    "Collaboration turns effort into impact.",
    "Your code matters more with company.",
    "Building together beats building alone.",
    "Every teammate multiplies your momentum.",
    "Coding is fun, but sharing is better.",
    "Collaboration is the shortcut to progress.",
    "Your skills shine brighter in a team.",
    "Worthwhile projects are rarely solo.",
    "Coding is play with purpose.",
    "Together, ideas grow legs.",
    "Collaboration makes the hard parts easy.",
    "Your next project could change lives.",

];

const fadeUp = (i = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.07 },
});

export default function DashboardPage() {
    const [quoteIndex, setQuoteIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const [conversations, setConversations] = useState([]);
    const [likes, setLikes] = useState([]);

    const [loadingMessages, setLoadingMessages] = useState(true);
    const [loadingLikes, setLoadingLikes] = useState(true);

    const [userProfile, setUserProfile] = useState(null);

    const navigate = useNavigate();
    const totalUnread = conversations.reduce(
        (sum, c) => sum + (c.unread || 0),
        0
    );

    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userId = storedUser?.userid;

    const markRead = async (conversationId) => {
        try {
            const storedUser = JSON.parse(localStorage.getItem("user"));
            const userId = storedUser?.userid;

            if (!conversationId || !userId) return;

            await axios.post("https://devmatch-1npz.onrender.com/messages/mark-read", {
                conversationId,
                userId,
            });

            // instantly update UI
            setConversations((prev) =>
                prev.map((c) =>
                    c.conversationId === conversationId
                        ? { ...c, unread: 0 }
                        : c
                )
            );
        } catch (err) {
            console.error("mark-read failed:", err);
        }
    };
    /* ───────── TYPEWRITER ───────── */
    useEffect(() => {
        const current = quotes[quoteIndex];

        let timeout;

        if (!isDeleting) {
            if (displayedText.length < current.length) {
                timeout = setTimeout(() => {
                    setDisplayedText(current.slice(0, displayedText.length + 1));
                }, 18);
            } else {
                timeout = setTimeout(() => setIsDeleting(true), 2000);
            }
        } else {
            if (displayedText.length > 0) {
                timeout = setTimeout(() => {
                    setDisplayedText(current.slice(0, displayedText.length - 1));
                }, 10);
            } else {
                setIsDeleting(false);
                setQuoteIndex((prev) => (prev + 1) % quotes.length);
            }
        }

        return () => clearTimeout(timeout);
    }, [displayedText, isDeleting, quoteIndex]);

    /* ───────── FETCH ───────── */
    useEffect(() => {
        const fetchData = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem("user"));
                const userId = storedUser?.userid;
                if (!userId) return;

                const [convRes, likeRes, profileRes] = await Promise.all([
                    fetch(`https://devmatch-1npz.onrender.com/messages/conversations/${userId}`),
                    fetch(`https://devmatch-1npz.onrender.com/matches/pending-likes/${userId}`),
                    fetch(`https://devmatch-1npz.onrender.com/profile/user-info/${userId}`),
                ]);

                setConversations(await convRes.json());
                setLikes(await likeRes.json());
                setUserProfile(await profileRes.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingMessages(false);
                setLoadingLikes(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!userProfile?.userid) return;

        const channel = supabase
            .channel("dashboard-messages")
            .on(
                "postgres_changes",
                {
                    event: "*", // INSERT + UPDATE
                    schema: "public",
                    table: "messages",
                },
                (payload) => {
                    const msg = payload.new;

                    setConversations((prev) =>
                        prev.map((c) => {
                            if (c.conversationId !== msg.match_id) return c;

                            const isMine = msg.sender_id === userProfile.userid;

                            // ── NEW MESSAGE ──
                            if (payload.eventType === "INSERT") {
                                return {
                                    ...c,
                                    unread: isMine ? c.unread : (c.unread || 0) + 1,
                                    lastMessage: msg.content,
                                    lastMessageAt: msg.created_at,
                                };
                            }

                            // ── MESSAGE UPDATED (read status changed) ──
                            if (payload.eventType === "UPDATE") {
                                // safest approach: don’t guess decrement
                                // just trust backend state or recompute if needed
                                return {
                                    ...c,
                                    unread: msg.read
                                        ? Math.max((c.unread || 1) - 1, 0)
                                        : c.unread,
                                };
                            }

                            return c;
                        })
                    );
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [userProfile]);

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">

            {/* ───────── HERO ───────── */}
            <div className="px-8 py-6 border-b border-zinc-800 bg-gradient-to-b from-zinc-950 to-zinc-900/40">

                <div className="flex items-center justify-between">

                    <div>
                        <p className="text-xs uppercase tracking-widest text-indigo-400 mb-2">
                            devMatch // dashboard
                        </p>

                        <h1 className="text-4xl font-semibold tracking-tight">
                            Welcome back,{" "}
                            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                                {userProfile?.name || "Developer"}
                            </span>
                        </h1>

                        {/* TERMINAL QUOTE */}
                        <div className="mt-5 relative inline-block">

                            {/* OUTER AMBIENT GLOW */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-cyan-500/20 blur-3xl opacity-80 animate-pulse" />

                            {/* INNER SOFT GLOW */}
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400/10 via-violet-400/10 to-cyan-400/10 blur-2xl opacity-90" />

                            {/* CORE CARD */}
                            <div className="relative font-mono text-sm bg-black/60 border border-zinc-800/80 px-4 py-2 rounded-lg shadow-[0_0_25px_rgba(99,102,241,0.15)]">

                                <span className="text-green-400 mr-2 drop-shadow-[0_0_6px_rgba(34,197,94,0.9)]">
                                    $
                                </span>

                                <span
                                    className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent"
                                    style={{
                                        filter: `
                    drop-shadow(0 0 8px rgba(99,102,241,0.6))
                    drop-shadow(0 0 18px rgba(139,92,246,0.5))
                    drop-shadow(0 0 28px rgba(56,189,248,0.5))
                `
                                    }}
                                >
                                    {displayedText}
                                </span>

                                {/* CURSOR */}
                                <span className="ml-1 inline-block w-[2px] h-5 bg-green-400 animate-pulse align-middle shadow-[0_0_10px_rgba(34,197,94,0.9)]" />
                            </div>
                        </div>
                    </div>

                    <div className="hidden md:block w-44 h-44 bg-gradient-to-tr from-indigo-500/20 via-violet-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse" />
                </div>
            </div>

            {/* ───────── QUICK ACTIONS ───────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-8 py-6">

                <motion.div
                    {...fadeUp(1)}
                    onClick={() => navigate("/discover")}
                    className="group p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/40 hover:bg-zinc-900/70 transition cursor-pointer"
                >
                    <Compass className="w-5 h-5 text-indigo-400 mb-3 group-hover:scale-110 transition" />
                    <p className="text-sm font-semibold">Discover Developers</p>
                    <p className="text-xs text-zinc-500 mt-1">
                        Find collaborators aligned with your stack
                    </p>
                </motion.div>

                <motion.div
                    {...fadeUp(2)}
                    className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800"
                >
                    <Layers className="w-5 h-5 text-violet-400 mb-3" />
                    <p className="text-sm font-semibold">Connections</p>
                    <p className="text-xs text-zinc-500 mt-1">
                        {likes.length} developers interested
                    </p>
                </motion.div>

                <motion.div
                    {...fadeUp(3)}
                    className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800"
                >
                    <MessageCircle className="w-5 h-5 text-cyan-400 mb-3" />
                    <p className="text-sm font-semibold">Messages</p>
                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                        {conversations.length} active chats

                        {totalUnread > 0 && (
                            <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {totalUnread}
                            </span>
                        )}
                    </p>
                </motion.div>
            </div>

            {/* ───────── MAIN GRID ───────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-8 pb-8 flex-1 min-h-0">

                {/* ───────── LIKES (NOW CLEAN CARDS) ───────── */}
                <div className="flex flex-col min-h-0 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/20 backdrop-blur">

                    <div className="px-5 py-4 border-b border-zinc-800">
                        <p className="text-sm text-zinc-300">Incoming Interest</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 max-h-full">
                        {loadingLikes ? (
                            <p className="text-zinc-500 text-sm">Loading...</p>
                        ) : likes.length === 0 ? (
                            <div className="text-center text-zinc-500 text-sm">
                                No signals yet — keep building.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {likes.map((u) => (
                                    <motion.div
                                        key={u.userid}
                                        whileHover={{ scale: 1.04 }}
                                        onClick={() => navigate(`/viewProfile/${u.userid}`)}
                                        className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/30 transition cursor-pointer"
                                    >
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center font-semibold mb-3">
                                            {u.name?.[0]}
                                        </div>

                                        <p className="text-sm font-medium">{u.username}</p>

                                        <p className="text-xs text-zinc-500 mt-1">
                                            {u.stack?.slice(0, 3).join(" · ") || "Developer"}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ───────── CONVERSATIONS ───────── */}
                <div className="flex flex-col min-h-0 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/20 backdrop-blur">

                    <div className="px-5 py-4 border-b border-zinc-800">
                        <p className="text-sm text-zinc-300">Conversations</p>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-full">
                        {loadingMessages ? (
                            <p className="p-5 text-zinc-500 text-sm">Loading...</p>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-5">
                                <p className="text-zinc-400 text-sm mb-3">
                                    No conversations yet.
                                </p>

                                <button
                                    onClick={() => navigate("/discover")}
                                    className="px-4 py-2 text-xs border border-zinc-700 rounded-lg hover:border-indigo-400 transition"
                                >
                                    Explore Developers
                                </button>
                            </div>
                        ) : (
                            [...conversations]
                                .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
                                .map((c) => (
                                    <div
                                        key={c.conversationId}
                                        onClick={async () => {
                                            await markRead(c.conversationId);
                                            navigate(`/messages/${c.conversationId}`);
                                        }}
                                        className="group px-6 py-4 hover:bg-zinc-900/50 border-b border-zinc-800 cursor-pointer transition"
                                    >
                                        <div className="flex items-center gap-3">

                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-sm font-semibold">
                                                {c.otherUser?.name?.[0] || "U"}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate group-hover:text-indigo-300 transition">
                                                    {c.otherUser?.name}
                                                </p>

                                                <p className="text-xs text-zinc-500 truncate">
                                                    {c.lastMessage || "Start chatting..."}
                                                </p>
                                            </div>

                                            <div className="text-[10px] text-zinc-600">
                                                {c.lastMessageAt
                                                    ? new Date(c.lastMessageAt).toLocaleDateString()
                                                    : ""}


                                            </div>
                                            {c.unread > 0 && (
                                                <span className="ml-2 text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                                                    {c.unread}
                                                </span>
                                            )}

                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}