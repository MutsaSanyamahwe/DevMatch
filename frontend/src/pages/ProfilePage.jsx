import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
    Edit2, Check, X, Github, ExternalLink,
    Lock, ArrowUpRight, Eye, Camera,
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

const devTypeOptions = [
    "Frontend", "Backend", "Full-Stack Web", "Full-Stack Mobile",
    "ML / AI", "Data Analytics", "DevOps", "UI/UX Designer", "QA / Testing",
];

const langColor = {
    TypeScript: "bg-indigo-950 text-indigo-400 border-indigo-900",
    "Node.js": "bg-emerald-950 text-emerald-400 border-emerald-900",
    React: "bg-violet-950 text-violet-400 border-violet-900",
    SQL: "bg-zinc-800 text-zinc-400 border-zinc-700",
    Shell: "bg-amber-950 text-amber-400 border-amber-900",
    Docker: "bg-sky-950 text-sky-400 border-sky-900",
    Python: "bg-teal-950 text-teal-400 border-teal-900",
};

const fadeUp = (i = 0) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay: i * 0.055, ease: [0.22, 1, 0.36, 1] },
});

// Shared card/inner styles — no glass blur, just clean borders
const card = "bg-zinc-900/40 border border-zinc-800 rounded-2xl";
const cardInner = "bg-zinc-900/60 border border-zinc-800 rounded-xl";

/* ── Sub-components ── */

function SectionHeader({ label, editing, onEdit, onSave, onCancel }) {
    return (
        <div className="flex items-center justify-between mb-5">
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest">{label}</span>
            {!editing ? (
                <button
                    onClick={onEdit}
                    className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-indigo-400 border border-zinc-800 hover:border-indigo-900 px-2.5 py-1 rounded-lg transition-all"
                >
                    <Edit2 className="w-2.5 h-2.5" strokeWidth={1.5} /> edit
                </button>
            ) : (
                <div className="flex gap-1.5">
                    <button onClick={onSave} className="flex items-center gap-1 text-[10px] text-emerald-400 border border-emerald-900 bg-emerald-950/40 px-2.5 py-1 rounded-lg transition-all">
                        <Check className="w-2.5 h-2.5" strokeWidth={1.5} /> save
                    </button>
                    <button onClick={onCancel} className="flex items-center gap-1 text-[10px] text-zinc-500 border border-zinc-800 px-2.5 py-1 rounded-lg hover:border-zinc-700 transition-all">
                        <X className="w-2.5 h-2.5" strokeWidth={1.5} /> cancel
                    </button>
                </div>
            )}
        </div>
    );
}

function ReadOnlyHeader({ label }) {
    const navigate = useNavigate();
    return (
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
                <span className="text-[11px] text-zinc-500 uppercase tracking-widest">{label}</span>
                <span className="flex items-center gap-1 text-[10px] text-zinc-700">
                    <Lock className="w-2.5 h-2.5" strokeWidth={1.5} /> read-only
                </span>
            </div>
            <button
                onClick={() => navigate("/settings")}
                className="flex items-center gap-1 text-[10px] text-zinc-600 hover:text-indigo-400 border border-zinc-800 hover:border-indigo-900 px-2.5 py-1 rounded-lg transition-all"
            >
                <ArrowUpRight className="w-2.5 h-2.5" strokeWidth={1.5} /> update in settings
            </button>
        </div>
    );
}

function Field({ label, value, editing, onChange, type = "text" }) {
    return (
        <div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1.5">{label}</p>
            {editing ? (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-800 outline-none text-sm text-zinc-100 px-3 py-2 rounded-lg transition-colors"
                />
            ) : (
                <p className="text-sm text-zinc-300">{value || <span className="text-zinc-700">—</span>}</p>
            )}
        </div>
    );
}

/* ── Main ── */
export default function ProfilePage() {
    const { user } = useUser();
    if (user == null) return <div>Loading...</div>;
    const { userid } = user;

    const [profile, setProfile] = useState({
        firstName: "", lastName: "", username: "", email: "",
        age: "", city: "", country: "", bio: "",
        goals: [], devType: "", preferences: { roles: [], workStyle: [], projectSize: [] }, avatarUrl: null,
    });
    const [draft, setDraft] = useState(profile);
    const [editingSection, setEditing] = useState(null);
    const [photoUrl, setPhotoUrl] = useState(null);
    const [photoEditing, setPhotoEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [cvData, setCvData] = useState({ education: [], skills: [], repos: [] });
    const photoInputRef = useRef(null);

    const startEdit = (s) => { setDraft({ ...profile }); setEditing(s); };
    const cancelEdit = () => { setDraft({ ...profile }); setEditing(null); };
    const isEditing = (s) => editingSection === s;

    const saveEdit = async (s) => {
        setEditing(null);
        setProfile({ ...draft });
        try {
            if (s === "goals") {
                await axios.post(`https://devmatch-1npz.onrender.com/users/save-goals`, { userid, goals: draft.goals });
            }
            if (s === "prefs") {
                await axios.post(`https://devmatch-1npz.onrender.com/users/save-preferences`, { userid, preferences: draft.preferences });
            }
            if (s === "personal") {
                await axios.put(`https://devmatch-1npz.onrender.com/profile/update-user-info/${userid}`, {
                    name: draft.firstName, surname: draft.lastName, username: draft.username,
                    email: draft.email, age: draft.age, country: draft.country, city: draft.city,
                    bio: draft.bio, devType: draft.devType,
                });
            }
        } catch (err) {
            console.error("Failed to save:", err);
        }
    };

    useEffect(() => {
        if (!userid) return;
        const fetchProfile = async () => {
            try {
                const [resProfile, resGoals, resPrefs] = await Promise.all([
                    axios.get(`https://devmatch-1npz.onrender.com/profile/user-info/${userid}`),
                    axios.get(`https://devmatch-1npz.onrender.com/profile/get-user-goals/${userid}`),
                    axios.get(`https://devmatch-1npz.onrender.com/profile/get-user-preferences/${userid}`),
                ]);
                const base = resProfile.data;
                const mapped = {
                    firstName: base.name || "", lastName: base.surname || "",
                    username: base.username || "", email: base.email || "",
                    age: base.age || "", country: base.country || "", city: base.city || "",
                    bio: base.bio || "", avatarUrl: base.avatarUrl || null,
                    goals: resGoals.data?.goals || [],
                    devType: base.devType || "",
                    preferences: resPrefs.data?.preferences || { roles: [], workStyle: [], projectSize: [] },
                };
                setProfile(mapped);
                setDraft(mapped);
                setPhotoUrl(mapped.avatarUrl);
            } catch (err) {
                console.error("Failed to fetch profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [userid]);

    useEffect(() => {
        if (!userid) return;
        axios.get(`https://devmatch-1npz.onrender.com/profile/get-cv-data/${userid}`)
            .then(res => setCvData(res.data))
            .catch(err => console.error("Failed to fetch CV data:", err));
    }, [userid]);

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !userid) return;
        const previewUrl = URL.createObjectURL(file);
        setPhotoUrl(previewUrl);
        const formData = new FormData();
        formData.append("userid", userid);
        formData.append("avatar", file);
        try {
            const res = await axios.post("https://devmatch-1npz.onrender.com/users/upload-avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setPhotoUrl(res.data.avatarUrl);
            setProfile(p => ({ ...p, avatarUrl: res.data.avatarUrl }));
            setDraft(d => ({ ...d, avatarUrl: res.data.avatarUrl }));
            setPhotoEditing(false);
        } catch (err) {
            console.error("Avatar upload failed:", err);
        }
    };

    const handleRemovePhoto = async () => {
        try {
            await axios.post("https://devmatch-1npz.onrender.com/users/remove-avatar", { userid });
            setPhotoUrl(null);
            setProfile(p => ({ ...p, avatarUrl: null }));
            setDraft(d => ({ ...d, avatarUrl: null }));
            setPhotoEditing(false);
        } catch (err) {
            console.error("Failed to remove avatar:", err);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-zinc-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                                animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                            />
                        ))}
                    </div>
                    <p className="text-[11px] text-zinc-600 uppercase tracking-widest">Loading profile</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="h-full overflow-y-auto bg-zinc-950 text-zinc-200"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');`}</style>

            <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col gap-5">

                {/* HERO CARD */}
                <motion.div {...fadeUp(0)} className={`${card} p-6`}>
                    <div className="flex items-start gap-5 mb-5">

                        {/* Avatar */}
                        <div className="relative group flex-shrink-0">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center bg-zinc-800">
                                {photoUrl ? (
                                    <img src={photoUrl} alt="avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-zinc-400"
                                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                        {profile.firstName?.[0] || "?"}
                                    </span>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-zinc-950" />
                            <button
                                onClick={() => setPhotoEditing(v => !v)}
                                className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                                <Camera className="w-4 h-4 text-white" strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Identity */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold text-zinc-50 leading-tight"
                                style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.03em" }}>
                                {profile.firstName} {profile.lastName}
                            </h1>
                            <p className="text-sm text-zinc-500 mt-1">
                                @{profile.username} · {profile.city}{profile.city && profile.country && ", "}{profile.country}
                            </p>
                            <p className="text-sm text-zinc-400 mt-3 leading-relaxed max-w-md">{profile.bio}</p>
                        </div>
                    </div>

                    {/* Photo edit panel */}
                    {photoEditing && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                            className={`${cardInner} px-4 py-3 flex items-center gap-3 mb-5`}
                        >
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mr-1">// photo</p>
                            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                            <button
                                onClick={() => photoInputRef.current?.click()}
                                className="flex items-center gap-1.5 text-[11px] text-indigo-400 border border-indigo-900 px-3 py-1.5 rounded-lg hover:bg-indigo-950/40 transition-all"
                            >
                                <Camera className="w-3 h-3" strokeWidth={1.5} /> Change photo
                            </button>
                            {photoUrl && (
                                <button
                                    onClick={handleRemovePhoto}
                                    className="flex items-center gap-1.5 text-[11px] text-red-400 border border-red-900/50 px-3 py-1.5 rounded-lg hover:bg-red-950/40 transition-all"
                                >
                                    <X className="w-3 h-3" strokeWidth={1.5} /> Remove
                                </button>
                            )}
                            <button onClick={() => setPhotoEditing(false)}
                                className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors ml-auto">
                                Cancel
                            </button>
                        </motion.div>
                    )}

                    {/* Match card identity info */}
                    <div className={`${cardInner} p-4 flex items-center justify-between gap-4`}>
                        <div>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1">// match card identity</p>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                Your photo and username appear on match cards when set.
                            </p>
                        </div>
                        <div className="flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/40">
                            <Eye className="w-4 h-4 text-indigo-400" strokeWidth={1.5} />
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500">active</span>
                        </div>
                    </div>
                </motion.div>

                {/* PERSONAL INFO */}
                <motion.div {...fadeUp(1)} className={`${card} p-5`}>
                    <SectionHeader
                        label="// personal info"
                        editing={isEditing("personal")}
                        onEdit={() => startEdit("personal")}
                        onSave={() => saveEdit("personal")}
                        onCancel={cancelEdit}
                    />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                        {[
                            ["First name", "firstName"],
                            ["Last name", "lastName"],
                            ["Username", "username"],
                            ["Email", "email", "email"],
                            ["Age", "age"],
                            ["Country", "country"],
                            ["City", "city"],
                        ].map(([label, key, type]) => (
                            <Field
                                key={key} label={label} type={type || "text"}
                                value={isEditing("personal") ? draft[key] : profile[key]}
                                editing={isEditing("personal")}
                                onChange={(v) => setDraft(d => ({ ...d, [key]: v }))}
                            />
                        ))}
                        <div>
                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1.5">Dev type</p>
                            {isEditing("personal") ? (
                                <select
                                    value={draft.devType}
                                    onChange={(e) => setDraft(d => ({ ...d, devType: e.target.value }))}
                                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-800 text-sm text-zinc-100 px-3 py-2 rounded-lg outline-none transition-colors"
                                >
                                    {devTypeOptions.map(t => (
                                        <option key={t} value={t} className="bg-zinc-950">{t}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm text-zinc-300">{profile.devType || <span className="text-zinc-700">—</span>}</p>
                            )}
                        </div>
                    </div>
                    <div className="mt-5">
                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-1.5">Bio</p>
                        {isEditing("personal") ? (
                            <textarea
                                value={draft.bio}
                                onChange={(e) => setDraft(d => ({ ...d, bio: e.target.value }))}
                                rows={3}
                                className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-800 outline-none text-sm text-zinc-100 px-3 py-2 rounded-lg transition-colors resize-none"
                            />
                        ) : (
                            <p className="text-sm text-zinc-400 leading-relaxed">{profile.bio || <span className="text-zinc-700">—</span>}</p>
                        )}
                    </div>
                </motion.div>

                {/* GOALS */}
                <motion.div {...fadeUp(2)} className={`${card} p-5`}>
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
                                        setDraft(d => {
                                            const cur = Array.isArray(d.goals) ? d.goals : [];
                                            return { ...d, goals: cur.includes(title) ? cur.filter(g => g !== title) : [...cur, title] };
                                        });
                                    }}
                                    className={`relative text-left p-4 rounded-xl border transition-all ${selected
                                            ? "border-indigo-800 bg-indigo-950/50"
                                            : isEditing("goals")
                                                ? "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
                                                : "border-zinc-800/40 bg-zinc-900/20 opacity-50 cursor-default"
                                        }`}
                                >
                                    {selected && (
                                        <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
                                        </span>
                                    )}
                                    <Icon className={`w-4 h-4 mb-2 ${selected ? "text-indigo-400" : "text-zinc-600"}`} strokeWidth={1.5} />
                                    <div className="text-sm font-semibold text-zinc-100 mb-1"
                                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</div>
                                    <div className="text-[11px] text-zinc-500 leading-relaxed">{desc}</div>
                                </button>
                            );
                        })}
                    </div>
                    {(() => {
                        const activeGoals = isEditing("goals") ? draft.goals : profile.goals;
                        return Array.isArray(activeGoals) && activeGoals.length > 0 ? (
                            <p className="text-[11px] text-indigo-400 mt-3">
                                {activeGoals.length} selected: {activeGoals.join(", ")}
                            </p>
                        ) : null;
                    })()}
                </motion.div>

                {/* PREFERENCES */}
                <motion.div {...fadeUp(3)} className={`${card} p-5`}>
                    <SectionHeader
                        label="// collaboration preferences"
                        editing={isEditing("prefs")}
                        onEdit={() => startEdit("prefs")}
                        onSave={() => saveEdit("prefs")}
                        onCancel={cancelEdit}
                    />
                    <div className="flex flex-col gap-3">
                        {[
                            { key: "workStyle", label: "Work style", opts: ["Remote only", "In-person", "Either"] },
                            { key: "availability", label: "Availability", opts: ["Full-time", "Part-time", "Evenings & weekends"] },
                            { key: "commitment", label: "Commitment level", opts: ["Casual / hobby", "Serious side project", "Full commitment"] },
                            { key: "timezone", label: "Timezone overlap", opts: ["Same timezone", "±3 hrs is fine", "Fully async ok"] },
                        ].map(({ key, label, opts }) => (
                            <div key={key} className={`${cardInner} p-4`}>
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
                                                    setDraft(d => ({ ...d, preferences: { ...d.preferences, [key]: o } }));
                                                }}
                                                className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${selected
                                                        ? "bg-indigo-600 border-indigo-600 text-white"
                                                        : "border-zinc-700 text-zinc-500 hover:border-indigo-800 hover:text-indigo-400"
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

                {/* EDUCATION & CERTS */}
                <motion.div {...fadeUp(4)} className={`${card} p-5`}>
                    <ReadOnlyHeader label="// education & certifications" />
                    <div className="flex flex-col gap-2">
                        {cvData.education.length > 0 ? cvData.education.map((edu, i) => (
                            <div key={i} className={`${cardInner} p-3`}>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{edu.type}</p>
                                <p className="text-sm text-zinc-300 mt-0.5">{edu.title}</p>
                            </div>
                        )) : (
                            <p className="text-sm text-zinc-700">No education data — run an analysis in settings.</p>
                        )}
                    </div>
                </motion.div>

                {/* SKILLS */}
                <motion.div {...fadeUp(5)} className={`${card} p-5`}>
                    <ReadOnlyHeader label="// skills" />
                    {cvData.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {cvData.skills.map((skill, i) => (
                                <span key={i} className="px-3 py-1.5 text-[11px] rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-900">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-700">No skills found — run an analysis in settings.</p>
                    )}
                </motion.div>

                {/* GITHUB PROJECTS */}
                <motion.div {...fadeUp(6)} className={`${card} p-5`}>
                    <ReadOnlyHeader label="// github projects" />
                    <div className="flex flex-col gap-3">
                        {cvData.repos.length > 0 ? cvData.repos.map((repo, i) => (
                            <a
                                key={i}
                                href={repo.url}
                                target="_blank"
                                rel="noreferrer"
                                className={`${cardInner} p-4 group hover:border-indigo-900/60 transition-all`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                            <Github className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
                                        </div>
                                        <p className="text-sm font-semibold text-zinc-200 group-hover:text-indigo-300 transition-colors"
                                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                            {repo.name}
                                        </p>
                                    </div>
                                    <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-indigo-400 transition-colors" strokeWidth={1.5} />
                                </div>
                                {repo.description && (
                                    <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">{repo.description}</p>
                                )}
                                {repo.languages?.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {repo.languages.map((lang, idx) => (
                                            <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-md border ${langColor[lang] || "bg-zinc-800 text-zinc-300 border-zinc-700"}`}>
                                                {lang}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {repo.topics?.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {repo.topics.map((topic, idx) => (
                                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/40 border border-indigo-900/40 text-indigo-400">
                                                #{topic}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </a>
                        )) : (
                            <p className="text-sm text-zinc-700">No repositories found — link your GitHub in settings.</p>
                        )}
                    </div>
                </motion.div>

                <div className="h-4" />
            </div>
        </div>
    );
}