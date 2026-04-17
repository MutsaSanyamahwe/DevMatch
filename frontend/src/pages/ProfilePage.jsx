import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
    Edit2, Check, X, Github, ExternalLink,
    Plus, Trash2, Lock, ArrowUpRight,
    Eye, EyeOff, Camera,
    Rocket, Handshake, GraduationCap, BookOpen, Briefcase, FlaskConical,
} from "lucide-react";
import { useUser } from "../context/UserContext";





const goalOptions = [
    { icon: Rocket, title: "Co-founder", desc: "Build a startup with one person from scratch." },
    { icon: Handshake, title: "Collaborator", desc: "Partner on a side project or open source work." },
    { icon: GraduationCap, title: "Mentor", desc: "Guide a junior dev one-on-one through growth." },
    { icon: BookOpen, title: "Mentee", desc: "Learn from a senior developer in focused pairing." },
    { icon: Briefcase, title: "Freelance Partner", desc: "Find one reliable dev for client work." },
    { icon: FlaskConical, title: "Accountability Buddy", desc: "Ship consistently with someone who keeps you honest." },
];


// ── Design tokens ──────────────────────────────────────────────────────────
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

const devTypeOptions = [
    "Frontend",
    "Backend",
    "Full-Stack Web",
    "Full-Stack Mobile",
    "ML / AI",
    "Data Analytics",
    "DevOps",
    "UI/UX Designer",
    "QA / Testing"
];

// ── Sub-components ─────────────────────────────────────────────────────────
function SectionHeader({ label, editing, onEdit, onSave, onCancel }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-mono">{label}</span>
            {!editing ? (
                <button
                    onClick={onEdit}
                    className="flex items-center gap-1 text-[9px] text-zinc-600 hover:text-indigo-400 border border-white/[0.06] hover:border-indigo-800 px-2.5 py-1 rounded-md transition-all font-mono"
                >
                    <Edit2 className="w-2.5 h-2.5" /> edit
                </button>
            ) : (
                <div className="flex gap-1.5">
                    <button onClick={onSave} className="flex items-center gap-1 text-[9px] text-emerald-400 border border-emerald-900 bg-emerald-950/60 px-2.5 py-1 rounded-md transition-all font-mono">
                        <Check className="w-2.5 h-2.5" /> save
                    </button>
                    <button onClick={onCancel} className="flex items-center gap-1 text-[9px] text-zinc-500 border border-white/[0.06] px-2.5 py-1 rounded-md hover:border-zinc-600 transition-all font-mono">
                        <X className="w-2.5 h-2.5" /> cancel
                    </button>
                </div>
            )}
        </div>
    );
}

function ReadOnlyHeader({ label }) {
    const navigate = useNavigate();
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-mono">{label}</span>
                <span className="flex items-center gap-1 text-[12px] text-zinc-700 font-mono">
                    <Lock className="w-2.5 h-2.5" /> read-only
                </span>
            </div>
            <button
                onClick={() => navigate("/settings")}
                className="flex items-center gap-1 text-[9px] text-zinc-600 hover:text-indigo-400 border border-white/[0.06] hover:border-indigo-800 px-2.5 py-1 rounded-md transition-all font-mono"
            >
                <ArrowUpRight className="w-2.5 h-2.5" /> update in settings
            </button>
        </div>
    );
}


function Field({ label, value, editing, onChange, type = "text" }) {
    return (
        <div>
            <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1 font-mono">{label}</p>
            {editing ? (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.08] focus:border-indigo-600/60 outline-none text-xs text-zinc-100 px-3 py-2 rounded-lg transition-colors font-mono"
                />
            ) : (
                <p className="text-xs text-zinc-300 font-mono">{value}</p>
            )}
        </div>
    );
}



// ── Main Component ─────────────────────────────────────────────────────────
export default function ProfilePage({ navigate }) {

    const { user } = useUser();



    if (user == null) return <div>Loading...</div>;

    const { userid, is_setup, step_skills, step_goals, step_prefs } = user;
    const [profile, setProfile] = useState({
        name: "",
        surname: "",
        username: "",
        city: "",
        country: "",
        bio: "",
        goals: [],
        devType: "",
        preferences: { roles: [], workStyle: [], projectSize: [] },
        avatarUrl: null,
    });
    const [draft, setDraft] = useState(profile);
    const [editingSection, setEditing] = useState(null);

    // Photo state
    const [photoUrl, setPhotoUrl] = useState(null);
    const [showPhotoOnMatch, setShowPhoto] = useState(true);
    const [photoEditing, setPhotoEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const photoInputRef = useRef(null);

    //cv and github info
    const [cvData, setCvData] = useState({ education: [], skills: [], repos: [] })

    const startEdit = (s) => { setDraft({ ...profile }); setEditing(s); };
    const saveEdit = async (s) => {
        setEditing(null);
        setProfile({ ...draft });

        try {
            if (s === "goals") {
                await axios.post(`http://localhost:3000/users/save-goals`, {
                    userid,
                    goals: draft.goals
                });
            }
            if (s === "prefs") {
                await axios.post(`http://localhost:3000/users/save-preferences`, {
                    userid,
                    preferences: draft.preferences
                });
            }
            if (s === "personal") {
                await axios.put(`http://localhost:3000/profile/update-user-info/${userid}`, {
                    name: draft.firstName,
                    surname: draft.lastName,
                    username: draft.username,
                    email: draft.email,
                    age: draft.age,
                    country: draft.country,
                    city: draft.city,
                    bio: draft.bio,
                    devType: draft.devType,
                }

                );
            }
        } catch (err) {
            console.error("Failed to save:", err);
        }
    };
    const cancelEdit = () => { setDraft({ ...profile }); setEditing(null); };
    const isEditing = (s) => editingSection === s;





    useEffect(() => {
        if (!user?.userid) return;
        const fetchProfile = async () => {
            try {
                //fetching basic profile
                const resProfile = await axios.get(`http://localhost:3000/profile/user-info/${userid}`);
                const baseProfile = resProfile.data;


                const resGoals = await axios.get(`http://localhost:3000/profile/get-user-goals/${userid}`);
                const goals = resGoals.data?.goals || [];


                const resPrefs = await axios.get(`http://localhost:3000/profile/get-user-preferences/${userid}`);
                const preferences = resPrefs.data?.preferences || {
                    roles: [],
                    workStyle: [],
                    projectSize: [],
                    availability: [],
                    commitment: [],
                    timezone: [],
                };

                const mappedProfile = {
                    firstName: baseProfile.name || "",
                    lastName: baseProfile.surname || "",
                    username: baseProfile.username || "",
                    email: baseProfile.email || "",
                    age: baseProfile.age || "",
                    country: baseProfile.country || "",
                    city: baseProfile.city || "",
                    bio: baseProfile.bio || "",
                    avatarUrl: baseProfile.avatarUrl || null,
                    goals,
                    devType: baseProfile.devType || "",
                    preferences,
                };



                setProfile(mappedProfile);
                setDraft(mappedProfile);
                setPhotoUrl(mappedProfile.avatarUrl);

            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        };

        if (userid) fetchProfile();

    }, [userid]);


    //const [cvData, setCvData] = useState({ education: [], skills: [], repos: [] });

    useEffect(() => {
        if (!user?.userid) return;

        const fetchCvData = async () => {
            try {
                const res = await axios.get(`http://localhost:3000/profile/get-cv-data/${user.userid}`);
                setCvData(res.data);
            } catch (err) {
                console.error("Failed to fetch CV data:", err);
            }
        };

        fetchCvData();
    }, [user?.userid]);

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !user?.userid) return;

        // instant preview (optimistic UI)
        const previewUrl = URL.createObjectURL(file);
        setPhotoUrl(previewUrl);

        const formData = new FormData();
        formData.append("userid", user.userid);
        formData.append("avatar", file); // IMPORTANT: must match multer field name

        try {

            const res = await axios.post(
                "http://localhost:3000/users/upload-avatar",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            // replace preview with real Supabase URL
            setPhotoUrl(res.data.avatarUrl);

            setProfile((p) => ({
                ...p,
                avatarUrl: res.data.avatarUrl,
            }));

            setDraft((d) => ({
                ...d,
                avatarUrl: res.data.avatarUrl,
            }));

            setPhotoEditing(false);
        } catch (err) {
            console.error("Avatar upload failed:", err);
        }
    };

    if (loading) {
        return (
            <div className="h-full overflow-y-auto bg-zinc-950 font-mono flex items-center justify-center"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
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

    return (

        <div className="h-full overflow-y-auto bg-zinc-950 font-mono">
            <div
                className="min-h-full px-6 py-8"
                style={{
                    backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
                        `,
                    backgroundSize: "32px 32px",
                }}
            >
                <div className="max-w-3xl mx-auto flex flex-col gap-5">

                    {/* ── HERO ── */}
                    <motion.div {...fadeUp(0)} className={`${glass} p-6`}>

                        {/* Top row: avatar + identity */}
                        <div className="flex items-start gap-5 mb-5">

                            {/* Avatar */}
                            <div className="relative group flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center bg-indigo-950">
                                    {photoUrl ? (
                                        <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-indigo-300">
                                            {profile.firstName ? profile.firstName[0] : "?"}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-zinc-950" />
                                <button
                                    onClick={() => setPhotoEditing((v) => !v)}
                                    className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                >
                                    <Camera className="w-4 h-4 text-white" />
                                </button>
                            </div>

                            {/* Identity */}
                            <div className="flex-1 min-w-0">
                                <h1 className="text-xl font-bold text-zinc-50 tracking-tight leading-none">
                                    {profile.firstName} {profile.lastName}
                                </h1>
                                <p className="text-xs text-zinc-500 mt-1 font-mono">
                                    {profile.username} · {profile.city}, {profile.country}
                                </p>
                                <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                                    {profile.bio}
                                </p>
                            </div>
                        </div>

                        {/* Photo edit panel (inline, below avatar row) */}
                        {photoEditing && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`${glassInner} px-4 py-3 flex items-center gap-3 mb-5`}
                            >
                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-mono mr-1">// photo</p>
                                <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                <button
                                    onClick={() => photoInputRef.current?.click()}
                                    className="flex items-center gap-1.5 text-[10px] text-indigo-400 border border-indigo-800/60 px-3 py-1.5 rounded-lg hover:bg-indigo-950/40 transition-all font-mono"
                                >
                                    <Camera className="w-3 h-3" /> change photo
                                </button>
                                {photoUrl && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                await axios.post("http://localhost:3000/users/remove-avatar", {
                                                    userid: user.userid,
                                                });

                                                setPhotoUrl(null);

                                                setProfile((p) => ({
                                                    ...p,
                                                    avatarUrl: null,
                                                }));

                                                setDraft((d) => ({
                                                    ...d,
                                                    avatarUrl: null,
                                                }));

                                                setPhotoEditing(false);
                                            } catch (err) {
                                                console.error("Failed to remove avatar:", err);
                                            }
                                        }}
                                        className="flex items-center gap-1.5 text-[10px] text-red-400 border border-red-900/50 px-3 py-1.5 rounded-lg hover:bg-red-950/40 transition-all font-mono"
                                    >
                                        <X className="w-3 h-3" /> remove
                                    </button>
                                )}
                                <button onClick={() => setPhotoEditing(false)} className="text-[9px] text-zinc-700 hover:text-zinc-400 transition-colors font-mono ml-auto">
                                    cancel
                                </button>
                            </motion.div>
                        )}

                        {/* Identity on match cards */}
                        <div className={`${glassInner} p-4`}>
                            <div className="flex items-start justify-between gap-4">

                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono mb-1">
                // match card identity
                                    </p>

                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                        Your profile photo and username appear on match cards when set.
                                    </p>

                                    <p className="text-[10px] text-zinc-600 mt-1">
                                        You can remove your photo anytime in settings if you prefer a more private profile.
                                    </p>
                                </div>

                                {/* Status indicator (no toggle anymore) */}
                                <div className="flex-shrink-0 flex flex-col items-center gap-2 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-800/60">
                                        <Eye className="w-4 h-4 text-indigo-400" />
                                    </div>

                                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                                        active
                                    </span>
                                </div>
                            </div>
                        </div>

                    </motion.div>

                    {/* ── Profile ── */}
                    <>

                        {/* Personal Info */}
                        <motion.div {...fadeUp(1)} className={`${glass} p-5`}>
                            <SectionHeader
                                label="// personal_info"
                                editing={isEditing("personal")}
                                onEdit={() => startEdit("personal")}
                                onSave={() => saveEdit("personal")}
                                onCancel={cancelEdit}
                            />
                            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                {[
                                    ["first_name", "firstName"],
                                    ["last_name", "lastName"],
                                    ["username", "username"],
                                    ["email", "email", "email"],
                                    ["age", "age"],
                                    ["country", "country"],
                                    ["city", "city"],
                                ].map(([label, key, type]) => (
                                    <Field
                                        key={key}
                                        label={label}
                                        type={type || "text"}
                                        value={isEditing("personal") ? draft[key] : profile[key]}
                                        editing={isEditing("personal")}
                                        onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))}
                                    />




                                ))
                                }
                                <div>
                                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest mb-1 font-mono">devType</p>
                                    {isEditing("personal") ? (
                                        <select
                                            value={draft.devType}
                                            onChange={(e) => setDraft((d) => ({ ...d, devType: e.target.value }))}
                                            className="w-full bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-100 px-3 py-2 rounded-lg transition-colors outline-none focus:border-indigo-600/60 font-mono
                 hover:bg-white/[0.05] focus:bg-white/[0.05]"
                                        >
                                            {devTypeOptions.map((type) => (
                                                <option
                                                    key={type}
                                                    value={type}
                                                    className="bg-zinc-950 text-zinc-100 font-mono"
                                                >
                                                    {type}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-xs text-zinc-300 font-mono">{profile.devType || "—"}</p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4">
                                <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1.5 font-mono">bio</p>
                                {isEditing("personal") ? (
                                    <textarea
                                        value={draft.bio}
                                        onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))}
                                        rows={3}
                                        className="w-full bg-white/[0.05] border border-white/[0.08] focus:border-indigo-600/60 outline-none text-xs text-zinc-100 px-3 py-2 rounded-lg transition-colors resize-none font-mono"
                                    />
                                ) : (
                                    <p className="text-xs text-zinc-400 leading-relaxed">{profile.bio}</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Goals */}
                        <motion.div {...fadeUp(2)} className={`${glass} p-5`}>
                            <SectionHeader
                                label="// goals"
                                editing={isEditing("goals")}
                                onEdit={() => startEdit("goals")}
                                onSave={() => saveEdit("goals")}
                                onCancel={cancelEdit}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                {goalOptions.map(({ icon: Icon, title, desc }) => {
                                    const activeGoals = isEditing("goals") ? draft.goals : profile.goals;
                                    const selected = Array.isArray(activeGoals) && activeGoals.includes(title);
                                    return (
                                        <button
                                            key={title}
                                            onClick={() => {
                                                if (!isEditing("goals")) return;
                                                setDraft((d) => {
                                                    const current = Array.isArray(d.goals) ? d.goals : [];
                                                    return {
                                                        ...d,
                                                        goals: current.includes(title)
                                                            ? current.filter((g) => g !== title)
                                                            : [...current, title],
                                                    };
                                                });
                                            }}
                                            className={`relative text-left p-4 rounded-xl border transition-all ${selected
                                                ? "border-indigo-500 bg-indigo-950/60 ring-1 ring-indigo-500/20"
                                                : isEditing("goals")
                                                    ? "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
                                                    : "border-zinc-800/50 bg-zinc-900/30 opacity-50"
                                                } ${!selected && !isEditing("goals") ? "cursor-default" : ""}`}
                                        >
                                            {selected && (
                                                <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                                                    <span className="text-[9px] text-white font-bold">✓</span>
                                                </span>
                                            )}
                                            <div className="mb-2">
                                                <Icon className={`w-4 h-4 ${selected ? "text-indigo-400" : "text-zinc-600"}`} />
                                            </div>
                                            <div className="text-xs font-semibold text-zinc-100 mb-1 font-mono">{title}</div>
                                            <div className="text-[10px] text-zinc-600 leading-relaxed">{desc}</div>
                                        </button>
                                    );
                                })}
                            </div>

                            {(() => {
                                const activeGoals = isEditing("goals") ? draft.goals : profile.goals;
                                return Array.isArray(activeGoals) && activeGoals.length > 0 ? (
                                    <p className="text-[10px] text-indigo-400 mt-3 font-mono">
                                        {activeGoals.length} selected: {activeGoals.join(", ")}
                                    </p>
                                ) : null;
                            })()}
                        </motion.div>

                        {/* Preferences */}
                        <motion.div {...fadeUp(3)} className={`${glass} p-5`}>
                            <SectionHeader
                                label="// collaboration preferences"
                                editing={isEditing("prefs")}
                                onEdit={() => startEdit("prefs")}
                                onSave={() => saveEdit("prefs")}
                                onCancel={cancelEdit}
                            />
                            <div className="space-y-3">
                                {[
                                    { key: "workStyle", label: "Work style", opts: ["Remote only", "In-person", "Either"] },
                                    { key: "availability", label: "Availability", opts: ["Full-time", "Part-time", "Evenings & weekends"] },
                                    { key: "commitment", label: "Commitment level", opts: ["Casual / hobby", "Serious side project", "Full commitment"] },
                                    { key: "timezone", label: "Timezone overlap", opts: ["Same timezone", "±3 hrs is fine", "Fully async ok"] },
                                ].map(({ key, label, opts }) => (
                                    <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">{label}</p>
                                        <div className="flex gap-2 flex-wrap">
                                            {opts.map((o) => {
                                                const selected = isEditing("prefs")
                                                    ? draft.preferences[key] === o
                                                    : profile.preferences[key] === o;

                                                return (
                                                    <button
                                                        key={o}
                                                        onClick={() => {
                                                            if (!isEditing("prefs")) return;
                                                            setDraft((d) => ({
                                                                ...d,
                                                                preferences: { ...d.preferences, [key]: o }
                                                            }));
                                                        }}
                                                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all
                                    ${selected
                                                                ? "bg-indigo-600 border-indigo-500 text-white"
                                                                : "border-zinc-700 text-zinc-500 hover:border-indigo-500 hover:text-indigo-400"
                                                            }`}
                                                    >
                                                        {o}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                        {/* CV */}

                        <motion.div {...fadeUp(4)} className={`${glass} p-5`}>
                            <ReadOnlyHeader label="// education & certifications" />

                            <div className="grid grid-cols-1 gap-3">
                                {cvData.education.map((edu, i) => (
                                    <div key={i} className={`${glassInner} p-3`}>
                                        <p className="text-[10px] text-zinc-500 uppercase font-mono">{edu.type}</p>
                                        <p className="text-xs text-zinc-300 font-mono">{edu.title}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>


                        {/* Skills */}
                        <motion.div {...fadeUp(5)} className={`${glass} p-5`}>
                            <ReadOnlyHeader label="// skills" />

                            <div className="flex flex-wrap gap-2 mt-3">
                                {cvData.skills.length > 0 ? (
                                    cvData.skills.map((skill, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 text-xs rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-400/20 font-mono"
                                        >
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-xs text-zinc-600 font-mono">no skills found</p>
                                )}
                            </div>
                        </motion.div>

                        {/* GitHub Projects */}
                        {/* GitHub Projects */}
                        <motion.div {...fadeUp(6)} className={`${glass} p-5`}>
                            <ReadOnlyHeader label="// github.projects" />

                            <div className="flex flex-col gap-3 mt-3">
                                {cvData.repos.length > 0 ? (
                                    cvData.repos.map((repo, i) => (
                                        <a
                                            key={i}
                                            href={repo.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={`${glassInner} p-4 group transition-all hover:border-indigo-700/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.08)]`}
                                        >
                                            {/* Top Row */}
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

                                            {/* Description */}
                                            {repo.description && (
                                                <p className="text-[11px] text-zinc-500 leading-relaxed mb-3 group-hover:text-zinc-400 transition-colors">
                                                    {repo.description}
                                                </p>
                                            )}

                                            {/* Languages */}
                                            {repo.languages?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-2">
                                                    {repo.languages.map((lang, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`text-[9px] px-2 py-0.5 rounded-md border font-mono ${langColor[lang] ||
                                                                "bg-zinc-800/80 text-zinc-300 border-zinc-700/50"
                                                                }`}
                                                        >
                                                            {lang}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Topics */}
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
                                    ))
                                ) : (
                                    <p className="text-xs text-zinc-600 font-mono">no repositories found</p>
                                )}
                            </div>
                        </motion.div>

                    </>

                    <div className="h-4" />
                </div>
            </div>
        </div>

    );
}