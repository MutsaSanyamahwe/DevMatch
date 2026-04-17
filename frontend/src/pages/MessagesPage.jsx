import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../context/UserContext";
import { supabase } from "../supabase/supabaseClient";

const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
};

export default function MessagesPage() {
    const { user } = useUser();
    const { userid } = user;
    const { match_id } = useParams();
    const navigate = useNavigate();

    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loadingConvos, setLoadingConvos] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);

    const bottomRef = useRef(null);
    const textareaRef = useRef(null);

    const activeConvo = conversations.find((c) => c.conversationId === match_id);

    // ── Fetch conversation list ───────────────────────────────────────────
    useEffect(() => {
        if (!userid) return;
        const fetchConvos = async () => {
            try {
                const res = await fetch(`https://devmatch-1npz.onrender.com/messages/conversations/${userid}`);
                const data = await res.json();
                if (res.ok) {
                    setConversations(data);
                    if (!match_id && data.length > 0) {
                        navigate(`/messages/${data[0].conversationId}`, { replace: true });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch conversations:", err);
            } finally {
                setLoadingConvos(false);
            }
        };
        fetchConvos();
    }, [userid, match_id, navigate]);

    // ── Fetch messages for active conversation ────────────────────────────
    useEffect(() => {
        if (!match_id) return;
        const fetchMessages = async () => {
            setLoadingMsgs(true);
            try {
                const res = await fetch(`https://devmatch-1npz.onrender.com/messages/get-messages/${match_id}`);
                const data = await res.json();
                if (res.ok) setMessages(data);
            } catch (err) {
                console.error("Failed to fetch messages:", err);
            } finally {
                setLoadingMsgs(false);
            }
        };
        fetchMessages();
    }, [match_id]);

    // ── Realtime ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!match_id) return;
        const channel = supabase
            .channel(`messages-${match_id}`)
            .on("postgres_changes", {
                event: "INSERT",
                schema: "public",
                table: "messages",
                filter: `match_id=eq.${match_id}`,
            }, (payload) => {
                setMessages((prev) => {
                    const exists = prev.some(
                        m => m.id === payload.new.message_id || m.id === payload.new.id
                    );

                    if (exists) return prev;

                    return [...prev, {
                        id: payload.new.message_id ?? payload.new.id,
                        match_id: payload.new.match_id,
                        sender_id: payload.new.sender_id,
                        content: payload.new.content,
                        createdAt: payload.new.created_at,
                    }];
                });
                if (payload.new.sender_id !== userid) {
                    markRead(match_id);
                }
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [match_id]);

    useEffect(() => {
        if (!userid) return;

        const channel = supabase
            .channel("global-messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                (payload) => {
                    const msg = payload.new;

                    // ignore your own messages
                    if (msg.sender_id === userid) return;

                    setConversations((prev) =>
                        prev.map((c) =>
                            c.conversationId === match_id
                                ? {
                                    ...c,
                                    lastMessage: payload.new.content,
                                    lastMessageAt: payload.new.created_at,
                                }
                                : c
                        )
                    );
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [userid]);

    // ── Scroll to bottom ──────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const markRead = async (conversationId) => {
        try {
            await fetch(`https://devmatch-1npz.onrender.com/messages/mark-read`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId, userId: userid }),
            });
            setConversations((prev) =>
                prev.map((c) => c.conversationId === conversationId ? { ...c, unread: 0 } : c)
            );
        } catch (_) { }
    };

    const handleSelectConvo = (id) => {
        navigate(`/messages/${id}`, { replace: true });
        markRead(id);
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || !match_id || sending) return;

        const optimistic = {
            id: `temp-${Date.now()}`,
            match_id,
            sender_id: userid,
            content: text,
            createdAt: new Date().toISOString(),
            pending: true,
        };
        setMessages((prev) => [...prev, optimistic]);
        setInput("");
        setSending(true);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "40px";
        }

        try {
            const res = await fetch(`https://devmatch-1npz.onrender.com/messages/send-message`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ match_id, sender_id: userid, content: text }),
            });
            const saved = await res.json();
            if (res.ok) {
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === optimistic.id
                            ? {
                                id: saved.id,
                                match_id: saved.match_id,
                                sender_id: saved.sender_id,
                                content: saved.content,
                                createdAt: saved.createdAt,
                            }
                            : m
                    )
                );
                setConversations((prev) =>
                    prev.map((c) =>
                        c.conversationId === match_id
                            ? { ...c, lastMessage: text, lastMessageAt: saved.createdAt }
                            : c
                    )
                );
            } else {
                setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
            }
        } catch (err) {
            console.error("Failed to send:", err);
            setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
        // Auto-grow textarea
        e.target.style.height = "40px";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    };

    return (
        <div
            className="flex h-screen bg-zinc-950 text-zinc-200 font-mono overflow-hidden"
            style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.012) 1px,transparent 1px)`,
                backgroundSize: "32px 32px",
            }}
        >

            {/* ═══════════════════════════════════════════════════════════════
                LEFT — Conversation list
            ════════════════════════════════════════════════════════════════ */}
            <aside className="w-[240px] flex-shrink-0 border-r border-zinc-800 flex flex-col bg-[#111113] h-screen">

                {/* Header */}
                <div className="px-4 py-4 border-b border-zinc-800 flex-shrink-0">
                    <p className="text-[10px] text-indigo-400 tracking-[.15em] uppercase mb-1">// messages</p>
                    <h2 className="text-sm font-black text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
                        Conversations
                    </h2>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {loadingConvos && <LoadingDots size="sm" />}

                    {!loadingConvos && conversations.length === 0 && (
                        <div className="px-4 py-8 text-center">
                            <p className="text-[11px] text-zinc-700 tracking-wider">no conversations yet</p>
                            <p className="text-[10px] text-zinc-800 mt-1">Match with a developer to start chatting</p>
                        </div>
                    )}

                    {[...conversations]
                        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
                        .map((convo) => {
                            const isActive = convo.conversationId === match_id;
                            return (
                                <button
                                    key={convo.conversationId}
                                    onClick={() => handleSelectConvo(convo.conversationId)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 border-b border-zinc-800/40 text-left transition-all ${isActive
                                        ? "bg-indigo-950/40 border-r-2 border-r-indigo-500"
                                        : "hover:bg-zinc-900/60"
                                        }`}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10">
                                            {convo.otherUser?.avatarUrl ? (
                                                <img src={convo.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-indigo-950 flex items-center justify-center text-[11px] font-bold text-indigo-300">
                                                    {convo.otherUser?.name?.[0]?.toUpperCase() || "?"}
                                                </div>
                                            )}
                                        </div>
                                        {convo.otherUser?.online && (
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#111113]" />
                                        )}
                                    </div>

                                    {/* Text info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[12px] font-semibold truncate ${isActive ? "text-indigo-200" : "text-zinc-200"}`}>
                                                {convo.otherUser?.name || "Unknown"}
                                            </span>
                                            <span className="text-[9px] text-zinc-700 flex-shrink-0 ml-1">
                                                {formatTime(convo.lastMessageAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5">
                                            <p className="text-[10px] text-zinc-600 truncate">
                                                {convo.lastMessage || "Say hello →"}
                                            </p>
                                            {convo.unread > 0 && (
                                                <span className="ml-1 flex-shrink-0 text-[8px] bg-indigo-600 text-white font-bold px-1.5 py-0.5 rounded-full">
                                                    {convo.unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                </div>
            </aside>

            {/* ═══════════════════════════════════════════════════════════════
                RIGHT — Chat pane
            ════════════════════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col min-w-0 h-screen">

                {/* ── No conversation selected ── */}
                {!activeConvo && !loadingConvos && (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-[11px] text-zinc-700 tracking-widest mb-1">// select a conversation</p>
                            <p className="text-[11px] text-zinc-800">Pick someone from the list to start chatting</p>
                        </div>
                    </div>
                )}

                {/* ── Active chat ── */}
                {(activeConvo || loadingConvos) && (
                    <>
                        {/* ── Chat header — who you're speaking to ── */}
                        <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800 bg-[#111113] flex-shrink-0">
                            {activeConvo ? (
                                <>
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10">
                                            {activeConvo.otherUser?.avatarUrl ? (
                                                <img src={activeConvo.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-indigo-950 flex items-center justify-center text-[11px] font-bold text-indigo-300">
                                                    {activeConvo.otherUser?.name?.[0]?.toUpperCase() || "?"}
                                                </div>
                                            )}
                                        </div>
                                        {activeConvo.otherUser?.online && (
                                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#111113]" />
                                        )}
                                    </div>

                                    {/* Name + status */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-black text-zinc-100 leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                                            {activeConvo.otherUser?.name || "Unknown"}
                                        </p>
                                        <p className="text-[10px] text-indigo-400 tracking-wide leading-tight mt-0.5">
                                            {activeConvo.otherUser?.devType || "Developer"}
                                            {activeConvo.otherUser?.city ? ` · ${activeConvo.otherUser.city}` : ""}
                                            {activeConvo.otherUser?.online
                                                ? <span className="text-emerald-500"> · online</span>
                                                : null
                                            }
                                        </p>
                                    </div>

                                    {/* Right actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => navigate(`/viewDeveloper/${activeConvo.otherUser?.userid}`)}
                                            className="text-[10px] font-semibold tracking-widest text-zinc-500 border border-zinc-800 hover:border-zinc-600 hover:text-zinc-300 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            ./view-profile
                                        </button>
                                        <span className="text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-2.5 py-1 rounded-md">
                                            // matched
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="h-9 w-48 rounded-lg bg-zinc-800/40 animate-pulse" />
                            )}
                        </div>

                        {/* ── Messages area ── */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-2.5">

                            {loadingMsgs && <LoadingDots />}

                            {!loadingMsgs && messages.length === 0 && (
                                <div className="flex-1 flex items-center justify-center py-16">
                                    <div className="text-center">
                                        <p className="text-[11px] text-zinc-700 tracking-widest mb-1">// no messages yet</p>
                                        <p className="text-[11px] text-zinc-800">Be the first to say something.</p>
                                    </div>
                                </div>
                            )}

                            <AnimatePresence initial={false}>
                                {messages.map((msg, i) => {
                                    const isMe = msg.sender_id === userid;
                                    const prev = messages[i - 1];
                                    const isSameAsPrev = prev && prev.sender_id === msg.sender_id;

                                    return (
                                        <motion.div
                                            key={msg.id}
                                            variants={fadeUp}
                                            initial="hidden"
                                            animate="show"
                                            className={`flex flex-col max-w-[65%] ${isMe ? "self-end items-end" : "self-start items-start"} ${isSameAsPrev ? "mt-0.5" : "mt-2"}`}
                                        >
                                            <div
                                                className={`px-4 py-2.5 text-[12px] leading-relaxed break-words ${isMe
                                                    ? "bg-indigo-600 text-white rounded-2xl rounded-br-sm"
                                                    : "bg-white/[0.05] border border-white/[0.07] text-zinc-200 rounded-2xl rounded-bl-sm"
                                                    } ${msg.pending ? "opacity-50" : ""}`}
                                            >
                                                {msg.content}
                                            </div>

                                            {/* Timestamp — show if last in group or last overall */}
                                            {(!messages[i + 1] || messages[i + 1]?.sender_id !== msg.sender_id) && (
                                                <span className="text-[9px] text-zinc-700 mt-1 px-1">
                                                    {msg.pending ? "sending..." : formatTime(msg.createdAt)}
                                                </span>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            <div ref={bottomRef} />
                        </div>

                        {/* ── Input bar ── */}
                        <div className="px-5 py-3 border-t border-zinc-800 bg-[#111113] flex items-end gap-3 flex-shrink-0">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                                rows={1}
                                className="flex-1 bg-white/[0.04] border border-white/[0.07] focus:border-indigo-600/50 outline-none rounded-xl px-4 py-2.5 text-[12px] text-zinc-200 placeholder-zinc-700 font-mono resize-none transition-colors leading-relaxed"
                                style={{ height: "40px", maxHeight: "120px" }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || sending}
                                className="flex-shrink-0 h-10 px-5 text-[11px] font-semibold tracking-widest rounded-xl border border-indigo-500 bg-indigo-600 text-white hover:bg-indigo-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_16px_rgba(99,102,241,.35)] self-end"
                            >
                                {sending ? "..." : "send →"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function LoadingDots({ size = "md" }) {
    const sz = size === "sm" ? "w-1 h-1" : "w-1.5 h-1.5";
    return (
        <div className="flex items-center justify-center gap-2 py-10">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className={`${sz} rounded-full bg-indigo-500`}
                    animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                />
            ))}
        </div>
    );
}

function formatTime(ts) {
    if (!ts) return "";

    let iso = ts;
    if (typeof iso === "string" && iso.includes(" ")) {
        iso = iso.replace(" ", "T");
    }

    const d = new Date(Date.parse(iso));
    if (isNaN(d.getTime())) return "";

    const now = new Date();

    const isToday =
        d.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        d.toDateString() === yesterday.toDateString();

    const time = d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    });

    if (isToday) return time;

    if (isYesterday) return `Yesterday ${time}`;

    return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
    }) + ` ${time}`;
}