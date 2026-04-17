import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Layers,
    MessageSquare,
    Compass,
    CircleUser,
    Settings,
    LogOut,
} from "lucide-react";
import { useUser } from "../context/UserContext";
import { useEffect, useState } from "react";

const navItems = [
    { label: "Home", icon: LayoutDashboard, href: "/dashboard", badge: null },
    { label: "Matches", icon: Layers, href: "/matches", badge: null },
    { label: "Messages", icon: MessageSquare, href: "/messages", badge: null },
    { label: "Explore", icon: Compass, href: "/explore", badge: null },
];

const accountItems = [
    { label: "Profile", icon: CircleUser, href: "/profile" },
    { label: "Settings", icon: Settings, href: "/settings" },
];

export default function AppShell() {
    const { user, setUser } = useUser();
    const { userid } = user;
    const navigate = useNavigate();
    const location = useLocation();

    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // Collapse the nav when we're on the messages route so the
    // conversation list sidebar has room to live next to it
    const isMessages = location.pathname.startsWith("/messages");

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    useEffect(() => {
        if (!userid) return;
        const fetchProfile = async () => {
            try {
                setLoadingProfile(true);
                const res = await fetch(`http://localhost:3000/profile/user-info/${userid}`);
                const data = await res.json();
                setProfile(data);
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchProfile();
    }, [userid]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        setUser({ userid: null, is_setup: false, step_skills: false, step_goals: false, step_prefs: false });
        navigate("/");
    };

    return (
        <div className="flex min-h-screen bg-[#0f0f11] font-mono text-zinc-200">

            {/* ── SIDEBAR ── */}
            <aside
                className={`
                    flex-shrink-0 border-r border-zinc-800 flex flex-col bg-[#09090b]
                    sticky top-0 h-screen transition-all duration-300 ease-in-out
                    ${isMessages ? "w-[56px]" : "w-[220px]"}
                `}
            >
                {/* Logo — full when expanded, just dot when collapsed */}
                <div className={`border-b border-zinc-800 flex items-center ${isMessages ? "px-0 py-5 justify-center" : "px-5 py-5"}`}>
                    {isMessages ? (
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    ) : (
                        <span className="text-lg font-black tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                            dev<span className="text-indigo-500">match</span>
                        </span>
                    )}
                </div>

                {/* Main nav */}
                <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
                    {!isMessages && (
                        <p className="text-[10px] text-zinc-700 uppercase tracking-[.12em] px-2 pb-2">main</p>
                    )}

                    {navItems.map(({ label, icon: Icon, href, badge }) => {
                        const active = location.pathname === href || (href === "/messages" && isMessages);
                        return (
                            <Link
                                key={href}
                                to={href}
                                title={isMessages ? label : undefined}
                                className={`
                                    flex items-center rounded-lg text-xs transition-all
                                    ${isMessages ? "justify-center w-10 h-10 mx-auto" : "gap-2.5 px-2.5 py-2"}
                                    ${active
                                        ? "bg-indigo-950 text-indigo-300"
                                        : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                                    }
                                `}
                            >
                                {/* Icon — show unread dot on collapsed messages icon */}
                                <div className="relative flex-shrink-0">
                                    <Icon className="w-4 h-4" />
                                    {isMessages && badge !== null && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-500 border border-[#09090b]" />
                                    )}
                                </div>

                                {/* Label + badge — only when expanded */}
                                {!isMessages && (
                                    <>
                                        <span>{label}</span>
                                        {badge !== null && (
                                            <span className="ml-auto bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                                                {badge}
                                            </span>
                                        )}
                                    </>
                                )}
                            </Link>
                        );
                    })}

                    {/* Account section */}
                    {!isMessages && (
                        <>
                            <p className="text-[10px] text-zinc-700 uppercase tracking-[.12em] px-2 pb-2 pt-5">account</p>
                            {accountItems.map(({ label, icon: Icon, href }) => {
                                const active = location.pathname === href;
                                return (
                                    <Link
                                        key={href}
                                        to={href}
                                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-all ${active ? "bg-indigo-950 text-indigo-300" : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4 flex-shrink-0" />
                                        <span>{label}</span>
                                    </Link>
                                );
                            })}
                        </>
                    )}

                    {/* Collapsed account icons */}
                    {isMessages && (
                        <div className="pt-4 flex flex-col gap-1">
                            {accountItems.map(({ label, icon: Icon, href }) => (
                                <Link
                                    key={href}
                                    to={href}
                                    title={label}
                                    className="flex justify-center items-center w-10 h-10 mx-auto rounded-lg text-zinc-600 hover:bg-zinc-900 hover:text-zinc-300 transition-all"
                                >
                                    <Icon className="w-4 h-4" />
                                </Link>
                            ))}
                        </div>
                    )}
                </nav>

                {/* User profile — hidden when collapsed */}
                {!isMessages && (
                    <div className="px-4 py-4 border-t border-zinc-800">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {profile?.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-zinc-200 font-medium truncate">{profile?.name || "Loading..."}</p>
                                <p className="text-[10px] text-zinc-600 truncate">@{profile?.username || "anonymous"}</p>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-emerald-400 ml-auto flex-shrink-0" />
                        </div>
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    title={isMessages ? "Logout" : undefined}
                    className={`
                        flex items-center gap-2 rounded-lg text-xs text-zinc-500
                        hover:text-red-400 hover:bg-zinc-900 transition-all mb-3
                        ${isMessages ? "justify-center w-10 h-10 mx-auto" : "w-full px-2.5 py-2"}
                    `}
                >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    {!isMessages && <span>Logout</span>}
                </button>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="flex-1 overflow-auto min-w-0">
                <Outlet />
            </main>
        </div>
    );
}