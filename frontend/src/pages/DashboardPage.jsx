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
    const totalUnread = conversations.reduce((sum, c) => sum + (c.unread || 0), 0);

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
            setConversations((prev) =>
                prev.map((c) => c.conversationId === conversationId ? { ...c, unread: 0 } : c)
            );
        } catch (err) {
            console.error("mark-read failed:", err);
        }
    };

    /* ── TYPEWRITER ── */
    useEffect(() => {
        const current = quotes[quoteIndex];
        let timeout;
        if (!isDeleting) {
            if (displayedText.length < current.length) {
                timeout = setTimeout(() => setDisplayedText(current.slice(0, displayedText.length + 1)), 18);
            } else {
                timeout = setTimeout(() => setIsDeleting(true), 2000);
            }
        } else {
            if (displayedText.length > 0) {
                timeout = setTimeout(() => setDisplayedText(current.slice(0, displayedText.length - 1)), 10);
            } else {
                setIsDeleting(false);
                setQuoteIndex((prev) => (prev + 1) % quotes.length);
            }
        }
        return () => clearTimeout(timeout);
    }, [displayedText, isDeleting, quoteIndex]);

    /* ── FETCH ── */
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

    /* ── REALTIME ── */
    useEffect(() => {
        if (!userProfile?.userid) return;
        const channel = supabase
            .channel("dashboard-messages")
            .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
                const msg = payload.new;
                setConversations((prev) =>
                    prev.map((c) => {
                        if (c.conversationId !== msg.match_id) return c;
                        const isMine = msg.sender_id === userProfile.userid;
                        if (payload.eventType === "INSERT") {
                            return { ...c, unread: isMine ? c.unread : (c.unread || 0) + 1, lastMessage: msg.content, lastMessageAt: msg.created_at };
                        }
                        if (payload.eventType === "UPDATE") {
                            return { ...c, unread: msg.read ? Math.max((c.unread || 1) - 1, 0) : c.unread };
                        }
                        return c;
                    })
                );
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [userProfile]);

    return (
        <div
            className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');`}</style>

            {/* HERO */}
            <div className="px-8 py-6 border-b border-zinc-800/60">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-widest text-indigo-400 mb-3">
                            devmatch // dashboard
                        </p>
                        <h1
                            className="text-3xl font-semibold tracking-tight text-white"
                            style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em" }}
                        >
                            Welcome back,{" "}
                            <span className="text-indigo-400">
                                {userProfile?.name || "Developer"}
                            </span>
                        </h1>

                        {/* TERMINAL QUOTE — clean, no glow */}
                        <div className="mt-4 inline-flex items-center gap-2 font-mono text-sm bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
                            <span className="text-emerald-500 select-none">$</span>
                            <span className="text-zinc-300">{displayedText}</span>
                            <span className="inline-block w-[2px] h-4 bg-zinc-500 animate-pulse align-middle" />
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-8 py-6">
                <motion.div
                    {...fadeUp(1)}
                    onClick={() => navigate("/discover")}
                    className="group p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/40 hover:bg-zinc-900/70 transition cursor-pointer"
                >
                    <Compass className="w-5 h-5 text-indigo-400 mb-3 group-hover:scale-110 transition" strokeWidth={1.5} />
                    <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Discover Developers</p>
                    <p className="text-xs text-zinc-500 mt-1">Find collaborators aligned with your stack</p>
                </motion.div>

                <motion.div
                    {...fadeUp(2)}
                    className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800"
                >
                    <Layers className="w-5 h-5 text-violet-400 mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Connections</p>
                    <p className="text-xs text-zinc-500 mt-1">{likes.length} developers interested</p>
                </motion.div>

                <motion.div
                    {...fadeUp(3)}
                    className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800"
                >
                    <MessageCircle className="w-5 h-5 text-cyan-400 mb-3" strokeWidth={1.5} />
                    <p className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Messages</p>
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

            {/* MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-8 pb-8 flex-1 min-h-0">

                {/* INCOMING INTEREST */}
                <div className="flex flex-col min-h-0 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/20">
                    <div className="px-5 py-4 border-b border-zinc-800">
                        <p className="text-sm font-medium text-zinc-300" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            Incoming Interest
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5">
                        {loadingLikes ? (
                            <p className="text-zinc-600 text-sm">Loading...</p>
                        ) : likes.length === 0 ? (
                            <div className="text-center text-zinc-600 text-sm mt-8">
                                No signals yet — keep building.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {likes.map((u) => (
                                    <motion.div
                                        key={u.userid}
                                        whileHover={{ scale: 1.03 }}
                                        onClick={() => navigate(`/viewProfile/${u.userid}`)}
                                        className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-indigo-500/30 transition cursor-pointer"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-semibold text-sm mb-3"
                                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                            {u.name?.[0]}
                                        </div>
                                        <p className="text-sm font-medium text-zinc-200 truncate">{u.username}</p>
                                        <p className="text-[11px] text-zinc-500 mt-1 truncate">
                                            {u.stack?.slice(0, 3).join(" · ") || "Developer"}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* CONVERSATIONS */}
                <div className="flex flex-col min-h-0 border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/20">
                    <div className="px-5 py-4 border-b border-zinc-800">
                        <p className="text-sm font-medium text-zinc-300" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            Conversations
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loadingMessages ? (
                            <p className="p-5 text-zinc-600 text-sm">Loading...</p>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-5">
                                <p className="text-zinc-500 text-sm mb-3">No conversations yet.</p>
                                <button
                                    onClick={() => navigate("/discover")}
                                    className="px-4 py-2 text-xs border border-zinc-800 rounded-lg hover:border-indigo-500/40 hover:text-indigo-400 transition text-zinc-400 bg-transparent"
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
                                        className="group px-5 py-4 hover:bg-zinc-900/50 border-b border-zinc-800/50 cursor-pointer transition last:border-b-0"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-300 text-sm font-semibold flex-shrink-0"
                                                style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                                {c.otherUser?.name?.[0] || "U"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-zinc-200 truncate group-hover:text-indigo-300 transition font-medium">
                                                    {c.otherUser?.name}
                                                </p>
                                                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                                                    {c.lastMessage || "Start chatting..."}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                                <span className="text-[10px] text-zinc-600">
                                                    {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString() : ""}
                                                </span>
                                                {c.unread > 0 && (
                                                    <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
                                                        {c.unread}
                                                    </span>
                                                )}
                                            </div>
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