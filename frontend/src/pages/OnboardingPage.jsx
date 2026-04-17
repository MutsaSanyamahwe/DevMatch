import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight, SkipForward, MapPin, User,
    Upload, Github, BookOpen, Award, Code, GitFork, Star,
    Rocket, Handshake, GraduationCap, Briefcase, FlaskConical, Camera, X, Loader2
} from "lucide-react";
import { useDebounce } from "use-debounce";
import { useUser } from "../context/UserContext";


const steps = ["Profile", "DevVerify", "Goals", "Prefs"];

const goalOptions = [
    { icon: Rocket, title: "Co-founder", desc: "Build a startup with one person from scratch." },
    { icon: Handshake, title: "Collaborator", desc: "Partner on a side project or open source work." },
    { icon: GraduationCap, title: "Mentor", desc: "Guide a junior dev one-on-one through growth." },
    { icon: BookOpen, title: "Mentee", desc: "Learn from a senior developer in focused pairing." },
    { icon: Briefcase, title: "Freelance Partner", desc: "Find one reliable dev for client work." },
    { icon: FlaskConical, title: "Accountability Buddy", desc: "Ship consistently with someone who keeps you honest." },
];

const DEV_TYPES = [
    "Frontend", "Backend", "Full-Stack Web", "Full-Stack Mobile",
    "ML / AI", "Data Analytics", "DevOps", "UI/UX Designer", "QA / Testing"
];

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

const slideDown = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    show: { opacity: 1, height: "auto", marginTop: 16, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.25 } },
};

function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] text-zinc-500 uppercase tracking-[.12em]">{label}</label>
            {children}
        </div>
    );
}

function TextInput({ icon: Icon, suffix, ...props }) {
    return (
        <div className="relative">
            {Icon && (
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                    <Icon className="w-3.5 h-3.5" />
                </span>
            )}
            <input
                {...props}
                className={`w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg py-3 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all caret-indigo-500 ${Icon ? "pl-9" : "pl-4"} ${suffix ? "pr-10" : "pr-4"}`}
            />
            {suffix && (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    {suffix}
                </span>
            )}
        </div>
    );
}

function GithubStatus({ checking, valid, error }) {
    if (checking) return (
        <span className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-indigo-400 rounded-full animate-spin" />
    );
    if (valid) return <span className="text-emerald-400 text-xs font-bold">✓</span>;
    if (error) return <span className="text-red-400 text-xs font-bold">✗</span>;
    return null;
}

function VerifyPreview({ cvInfo, repos, skills }) {
    const [reposExpanded, setReposExpanded] = useState(false);
    const topRepos = reposExpanded ? repos : repos.slice(0, 3);
    const hasDegrees = cvInfo.degrees?.length > 0;
    const hasCerts = cvInfo.certifications?.length > 0;

    return (
        <motion.div variants={slideDown} initial="hidden" animate="show" exit="exit" className="overflow-hidden">
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/60 rounded-xl px-4 py-3 mb-4">
                <span className="text-emerald-400 text-base">✓</span>
                <div>
                    <p className="text-xs font-semibold text-emerald-400">Profile analyzed successfully</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Review what we extracted — this will pre-fill your profile</p>
                </div>
            </div>

            {skills?.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Code className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">Skills extracted</span>
                        <span className="ml-auto text-[10px] text-zinc-600">{skills.length} found</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {skills.map((skill) => (
                            <span key={skill} className="bg-indigo-950 border border-indigo-800/60 text-indigo-300 text-[10px] px-2 py-0.5 rounded-md">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {repos?.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-2 mb-3">
                        <GitFork className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">Public repos</span>
                        <span className="ml-auto text-[10px] text-zinc-600">{repos.length} found</span>
                    </div>
                    <div className="space-y-2">
                        {topRepos.map((repo) => (
                            <div key={repo.name} className="flex items-start justify-between gap-3 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5">
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-zinc-200 truncate">{repo.name}</p>
                                    {repo.description && <p className="text-[10px] text-zinc-600 truncate mt-0.5">{repo.description}</p>}
                                    <div className="flex items-center gap-3 mt-1.5">
                                        {repo.language && <span className="text-[10px] text-sky-400">{repo.language}</span>}
                                        {repo.stars > 0 && (
                                            <span className="flex items-center gap-0.5 text-[10px] text-zinc-500">
                                                <Star className="w-2.5 h-2.5" /> {repo.stars}
                                            </span>
                                        )}
                                        {repo.forks > 0 && (
                                            <span className="flex items-center gap-0.5 text-[10px] text-zinc-500">
                                                <GitFork className="w-2.5 h-2.5" /> {repo.forks}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {repo.url && (
                                    <a href={repo.url} target="_blank" rel="noreferrer"
                                        className="text-[10px] text-indigo-500 hover:text-indigo-400 flex-shrink-0 mt-0.5 transition-colors">
                                        view →
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                    {repos.length > 3 && (
                        <button onClick={() => setReposExpanded((v) => !v)}
                            className="mt-2 w-full text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors py-1">
                            {reposExpanded ? "show less ↑" : `show ${repos.length - 3} more repos ↓`}
                        </button>
                    )}
                </div>
            )}

            {hasDegrees && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">Education</span>
                    </div>
                    <div className="space-y-2">
                        {cvInfo.degrees.map((deg, i) => (
                            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5">
                                <p className="text-xs font-medium text-zinc-200">{deg.degree ?? deg.title ?? deg}</p>
                                {deg.institution && <p className="text-[10px] text-zinc-500 mt-0.5">{deg.institution}</p>}
                                {deg.year && <p className="text-[10px] text-zinc-700 mt-0.5">{deg.year}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hasCerts && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Award className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">Certifications</span>
                    </div>
                    <div className="space-y-2">
                        {cvInfo.certifications.map((cert, i) => (
                            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5">
                                <p className="text-xs font-medium text-zinc-200">{cert.name ?? cert.title ?? cert}</p>
                                {cert.issuer && <p className="text-[10px] text-zinc-500 mt-0.5">{cert.issuer}</p>}
                                {cert.year && <p className="text-[10px] text-zinc-700 mt-0.5">{cert.year}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!skills?.length && !repos?.length && !hasDegrees && !hasCerts && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-5 text-center">
                    <p className="text-xs text-zinc-500">
                        We couldn't extract much this time — you can add details manually in your profile.
                    </p>
                </div>
            )}
        </motion.div>
    );
}

// ── Loading label per step ─────────────────────────────────────────────────
const STEP_LOADING_LABEL = {
    0: "saving profile...",
    2: "saving goals...",
    3: "saving prefs...",
};

export default function OnboardingPage() {
    const { user } = useUser();
    const location = useLocation();
    const navigate = useNavigate();
    const { userid, is_setup, step_skills, step_goals, step_prefs } = user;

    const [step, setStep] = useState(0);
    // Tracks the highest step the user has completed and advanced past
    const [completedUpTo, setCompletedUpTo] = useState(-1);
    const [advancing, setAdvancing] = useState(false);

    // ── Step 0: Profile ──
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const avatarInputRef = useRef(null);
    const [username, setUsername] = useState("");
    const [age, setAge] = useState("");
    const [sex, setSex] = useState("");
    const [country, setCountry] = useState("");
    const [city, setCity] = useState("");
    const [devType, setDevType] = useState("");

    // ── Step 1: DevVerify ──
    const [cvFile, setCvFile] = useState(null);
    const [githubUsername, setGithubUsername] = useState("");
    const [debouncedGithubUsername] = useDebounce(githubUsername, 600);
    const [githubChecking, setGithubChecking] = useState(false);
    const [githubValid, setGithubValid] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [verified, setVerified] = useState(false);
    const [verifyError, setVerifyError] = useState("");
    const [cvInfo, setCvInfo] = useState({ certifications: [], degrees: [] });
    const [userRepos, setUserRepos] = useState([]);
    const [githubSkills, setGithubSkills] = useState([]);

    // ── Step 2: Goals ──
    const [selectedGoals, setGoals] = useState([]);

    // ── Step 3: Prefs ──
    const [prefs, setPrefs] = useState({
        workStyle: "", availability: "", timezone: "", commitment: "",
    });
    const setPref = (key, val) => setPrefs((p) => ({ ...p, [key]: val }));

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const removeAvatar = () => {
        setAvatarFile(null);
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
        if (avatarInputRef.current) avatarInputRef.current.value = "";
    };

    useEffect(() => {
        if (!debouncedGithubUsername.trim()) {
            setGithubValid(false);
            setGithubChecking(false);
            setVerifyError("");
            return;
        }
        const validate = async () => {
            setGithubChecking(true);
            setGithubValid(false);
            setVerifyError("");
            try {
                const res = await fetch(`https://api.github.com/users/${debouncedGithubUsername}`);
                if (!res.ok) {
                    setGithubValid(false);
                    setVerifyError("GitHub username not found — double check and try again.");
                } else {
                    setGithubValid(true);
                    setVerifyError("");
                }
            } catch {
                setGithubValid(false);
                setVerifyError("Could not reach GitHub. Check your connection.");
            } finally {
                setGithubChecking(false);
            }
        };
        validate();
    }, [debouncedGithubUsername]);

    useEffect(() => {
        if (githubUsername.trim() && githubUsername !== debouncedGithubUsername) {
            setGithubChecking(true);
            setGithubValid(false);
        }
    }, [githubUsername, debouncedGithubUsername]);

    const toggleGoal = (title) =>
        setGoals((prev) =>
            prev.includes(title) ? prev.filter((g) => g !== title) : [...prev, title]
        );

    const handleVerify = async () => {
        if (!githubUsername || !cvFile || !githubValid) return;
        setVerifying(true);
        setVerifyError("");
        try {
            const formData = new FormData();
            formData.append("cv_file", cvFile);
            formData.append("github_username", githubUsername);
            const res = await fetch("https://devverify-system.onrender.com/analyze", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Verification failed");
            }
            const data = await res.json();
            setCvInfo(data.cv_info || { certifications: [], degrees: [] });
            setUserRepos(data.github_repos || []);
            setGithubSkills(data.github_skills || []);
            setVerified(true);
            if (!userid) throw new Error("No user ID found. Please log in again");
            const saveRes = await fetch("https://devmatch-1npz.onrender.com/users/save-cv", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userid,
                    cv_info: data.cv_info || { certifications: [], degrees: [] },
                    github_skills: data.github_skills || [],
                    github_data: data.github_data || []
                })
            });
            if (!saveRes.ok) {
                const errData = await saveRes.json();
                throw new Error(errData.error || "Failed to save CV data to DB");
            }
        } catch (err) {
            setVerifyError(err.message || "Something went wrong. Please try again.");
        } finally {
            setVerifying(false);
        }
    };

    const resetVerify = () => {
        setVerified(false);
        setCvInfo({ certifications: [], degrees: [] });
        setUserRepos([]);
        setGithubSkills([]);
    };

    const handleProfileSubmit = async () => {
        if (!userid) { console.error("No user ID found"); return false; }
        try {
            let avatarUrl = null;
            if (avatarFile) {
                const fd = new FormData();
                fd.append("avatar", avatarFile);
                fd.append("userid", userid);
                const uploadRes = await fetch("https://devmatch-1npz.onrender.com/users/upload-avatar", {
                    method: "POST",
                    body: fd,
                });
                const uploadData = await uploadRes.json();
                if (!uploadRes.ok) throw new Error(uploadData.message || "Avatar upload failed");
                avatarUrl = uploadData.avatarUrl;
            }
            const res = await fetch("https://devmatch-1npz.onrender.com/users/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userid, username, age, sex, country, city, avatarUrl, devType }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Profile update failed");
            return true;
        } catch (err) {
            console.error("Error updating profile:", err);
            return false;
        }
    };

    const saveUserGoals = async () => {
        if (!userid) return;
        try {
            const res = await fetch("https://devmatch-1npz.onrender.com/users/save-goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userid, goals: selectedGoals }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save goals");
        } catch (err) {
            console.error("Error saving user goals:", err);
        }
    };

    const saveUserPreferences = async () => {
        if (!userid) return;
        try {
            const res = await fetch("https://devmatch-1npz.onrender.com/users/save-preferences", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userid, preferences: prefs }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to save preferences");
        } catch (err) {
            console.error("Error saving user preferences:", err);
        }
    };

    useEffect(() => {
        if (is_setup && step_skills && step_goals && step_prefs) {
            navigate("/dashboard");
        } else if (is_setup && step_skills && step_goals) {
            setStep(3); setCompletedUpTo(2);
        } else if (is_setup && step_skills) {
            setStep(2); setCompletedUpTo(1);
        } else if (is_setup) {
            setStep(1); setCompletedUpTo(0);
        } else {
            setStep(0);
        }
    }, [userid, is_setup, step_skills, step_goals, step_prefs, navigate]);

    const canAdvance = () => {
        if (step === 0) return username.trim() && age && sex && country.trim();
        if (step === 1) return verified;
        if (step === 2) return selectedGoals.length > 0;
        return true;
    };

    const advance = async () => {
        if (!canAdvance() || advancing) return;
        setAdvancing(true);
        try {
            if (step === 0) {
                const ok = await handleProfileSubmit();
                if (!ok) return;
            }
            if (step === 2) await saveUserGoals();
            if (step === 3) await saveUserPreferences();

            setCompletedUpTo((prev) => Math.max(prev, step));

            if (step < steps.length - 1) setStep((s) => s + 1);
            else window.location.href = "/dashboard";
        } finally {
            setAdvancing(false);
        }
    };

    // A step is locked if the user has already completed and advanced past it
    const isStepLocked = (targetStep) => targetStep <= completedUpTo;

    const nextLabel = () => {
        if (advancing) return STEP_LOADING_LABEL[step] ?? "saving...";
        if (step < steps.length - 1) return "next";
        return "go to dashboard";
    };

    return (
        <div className="min-h-full bg-[#0f0f11] flex items-center justify-center p-6 md:p-10">
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        "linear-gradient(rgba(99,102,241,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.03) 1px,transparent 1px)",
                    backgroundSize: "60px 60px",
                }}
            />

            <div className="relative z-10 w-full max-w-lg font-mono">

                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl font-black tracking-tight text-zinc-50 mb-2"
                        style={{ fontFamily: "'Syne', sans-serif" }}>
                        dev<span className="text-indigo-500">match</span>
                    </h1>
                    <p className="text-xs text-zinc-600 tracking-widest">// let's build your profile</p>
                </motion.div>

                {/* Progress */}
                <div className="flex items-center justify-center mb-10">
                    {steps.map((label, i) => (
                        <div key={label} className="flex items-center">
                            <div className="flex flex-col items-center gap-1.5">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300 ${i < step ? "bg-indigo-600 border-indigo-600 text-white"
                                    : i === step ? "border-indigo-500 text-indigo-400"
                                        : "border-zinc-800 text-zinc-600"
                                    }`}>
                                    {i < step ? "✓" : i + 1}
                                </div>
                                <span className={`text-[10px] tracking-wider whitespace-nowrap ${i === step ? "text-indigo-400" : "text-zinc-700"}`}>
                                    {label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-10 h-0.5 mx-2 mb-5 rounded transition-all duration-300 ${i < step ? "bg-indigo-600" : "bg-zinc-800"}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Content — unchanged */}
                <AnimatePresence mode="wait">

                    {step === 0 && (
                        <motion.div key="profile" variants={fadeUp} initial="hidden" animate="show" exit="exit"
                            className="space-y-4">
                            <p className="text-[11px] text-indigo-400 uppercase tracking-[.15em] text-center mb-6">
                                // tell us about yourself
                            </p>
                            <div className="flex flex-col items-center mb-2">
                                <div className="relative group">
                                    <div
                                        onClick={() => avatarInputRef.current?.click()}
                                        className={`w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-all overflow-hidden ${avatarPreview ? "border-indigo-600" : "border-zinc-700 hover:border-zinc-500 bg-zinc-900"}`}
                                    >
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-zinc-600 group-hover:text-zinc-400 transition-colors">
                                                <Camera className="w-5 h-5" />
                                                <span className="text-[9px] tracking-wider">photo</span>
                                            </div>
                                        )}
                                    </div>
                                    {avatarPreview && (
                                        <button onClick={removeAvatar}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center hover:bg-red-950 hover:border-red-800 transition-all">
                                            <X className="w-2.5 h-2.5 text-zinc-400" />
                                        </button>
                                    )}
                                </div>
                                <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                                    onChange={handleAvatarChange} className="hidden" />
                                <p className="text-[10px] text-zinc-700 mt-2">
                                    {avatarPreview ? "click photo to change" : "optional profile photo"}
                                </p>
                            </div>
                            <Field label="Display name">
                                <TextInput icon={User} type="text" placeholder="how you'll appear on your profile"
                                    value={username} onChange={(e) => setUsername(e.target.value)} />
                            </Field>
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Age">
                                    <TextInput type="number" placeholder="e.g. 24" min="16" max="80"
                                        value={age} onChange={(e) => setAge(e.target.value)} />
                                </Field>
                                <Field label="Sex">
                                    <select value={sex} onChange={(e) => setSex(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-lg px-4 py-3 text-sm text-zinc-200 outline-none transition-all appearance-none cursor-pointer"
                                        style={{ colorScheme: "dark" }}>
                                        <option value="" disabled>select...</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="non-binary">Non-binary</option>
                                        <option value="prefer-not">Prefer not to say</option>
                                    </select>
                                </Field>
                            </div>
                            <Field label="Country">
                                <TextInput icon={MapPin} type="text" placeholder="e.g. South Africa"
                                    value={country} onChange={(e) => setCountry(e.target.value)} />
                            </Field>
                            <Field label="City (optional)">
                                <TextInput icon={MapPin} type="text" placeholder="e.g. Johannesburg"
                                    value={city} onChange={(e) => setCity(e.target.value)} />
                            </Field>
                            <Field label="Developer type">
                                <div className="flex flex-wrap gap-2">
                                    {DEV_TYPES.map((type) => (
                                        <button key={type} type="button" onClick={() => setDevType(type)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-medium transition-all ${devType === type
                                                ? "bg-indigo-600 text-white border border-indigo-500"
                                                : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200"}`}>
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </Field>
                            <p className="text-[10px] text-zinc-700 text-center pt-1">
                                your location helps us surface nearby developers
                            </p>
                        </motion.div>
                    )}

                    {step === 1 && (
                        <motion.div key="devverify" variants={fadeUp} initial="hidden" animate="show" exit="exit"
                            className="space-y-4">
                            <p className="text-[11px] text-indigo-400 uppercase tracking-[.15em] text-center mb-6">
                                // verify your dev profile
                            </p>
                            <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${cvFile ? "border-indigo-600 bg-indigo-950/20" : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/50"}`}>
                                <input type="file" accept=".pdf,.doc,.docx"
                                    onChange={(e) => { setCvFile(e.target.files[0]); resetVerify(); }}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                                <Upload className={`w-6 h-6 mx-auto mb-2 ${cvFile ? "text-indigo-400" : "text-zinc-600"}`} />
                                {cvFile ? (
                                    <>
                                        <p className="text-xs font-medium text-indigo-400 mb-0.5">CV uploaded</p>
                                        <p className="text-[10px] text-zinc-600 truncate max-w-[240px] mx-auto">{cvFile.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs text-zinc-400 mb-0.5">drop your CV here or click to browse</p>
                                        <p className="text-[10px] text-zinc-700">PDF, DOC or DOCX</p>
                                    </>
                                )}
                            </div>
                            <Field label="GitHub username">
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Github className="w-3.5 h-3.5 text-zinc-600" />
                                    </span>
                                    <input type="text" placeholder="your-github-handle" value={githubUsername}
                                        onChange={(e) => {
                                            setGithubUsername(e.target.value);
                                            setVerified(false);
                                            resetVerify();
                                            if (e.target.value.trim()) setGithubChecking(true);
                                            else { setGithubChecking(false); setGithubValid(false); }
                                        }}
                                        className={`w-full bg-zinc-950 border rounded-lg py-3 pl-9 pr-10 text-sm text-zinc-200 placeholder-zinc-700 outline-none transition-all caret-indigo-500 focus:ring-2 focus:ring-indigo-500/10 ${githubValid ? "border-emerald-700 focus:border-emerald-600"
                                            : verifyError && githubUsername ? "border-red-800 focus:border-red-700"
                                                : "border-zinc-800 focus:border-indigo-500"}`} />
                                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center">
                                        <GithubStatus checking={githubChecking} valid={githubValid}
                                            error={!githubChecking && !githubValid && !!verifyError && !!githubUsername} />
                                    </span>
                                </div>
                                <AnimatePresence>
                                    {githubValid && !verifyError && (
                                        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="text-[10px] text-emerald-500 mt-1.5">
                                            ✓ @{githubUsername} found on GitHub
                                        </motion.p>
                                    )}
                                </AnimatePresence>
                            </Field>
                            <AnimatePresence>
                                {verifyError && (
                                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="bg-red-950/40 border border-red-800/60 rounded-lg px-4 py-3">
                                        <p className="text-xs text-red-400">{verifyError}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {!verified ? (
                                <button onClick={handleVerify}
                                    disabled={!cvFile || !githubValid || verifying || githubChecking}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wider py-3 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(99,102,241,.35)]">
                                    {verifying ? (
                                        <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> analyzing repos...</>
                                    ) : "analyze my profile →"}
                                </button>
                            ) : (
                                <button onClick={resetVerify}
                                    className="w-full text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors py-1">
                                    re-upload and re-analyze ↺
                                </button>
                            )}
                            <AnimatePresence>
                                {verified && <VerifyPreview cvInfo={cvInfo} repos={userRepos} skills={githubSkills} />}
                            </AnimatePresence>
                            <p className="text-[10px] text-zinc-700 text-center">
                                CV + GitHub help us auto-fill your skills and boost match accuracy
                            </p>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div key="goals" variants={fadeUp} initial="hidden" animate="show" exit="exit">
                            <p className="text-[11px] text-indigo-400 uppercase tracking-[.15em] text-center mb-1">
                                // what are you looking for?
                            </p>
                            <p className="text-[10px] text-zinc-600 text-center mb-6">
                                select all that apply — you can always change this later
                            </p>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {goalOptions.map(({ icon: Icon, title, desc }) => {
                                    const selected = selectedGoals.includes(title);
                                    return (
                                        <button key={title} onClick={() => toggleGoal(title)}
                                            className={`relative text-left p-4 rounded-xl border transition-all ${selected
                                                ? "border-indigo-500 bg-indigo-950 ring-1 ring-indigo-500/30"
                                                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"}`}>
                                            {selected && (
                                                <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                                                    <span className="text-[9px] text-white font-bold">✓</span>
                                                </span>
                                            )}
                                            <div className="mb-2">
                                                <Icon className={`w-5 h-5 ${selected ? "text-indigo-400" : "text-zinc-600"}`} />
                                            </div>
                                            <div className="text-xs font-semibold text-zinc-100 mb-1">{title}</div>
                                            <div className="text-[10px] text-zinc-600 leading-relaxed">{desc}</div>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedGoals.length > 0 && (
                                <p className="text-[10px] text-indigo-400 text-center">
                                    {selectedGoals.length} selected: {selectedGoals.join(", ")}
                                </p>
                            )}
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div key="prefs" variants={fadeUp} initial="hidden" animate="show" exit="exit"
                            className="space-y-3">
                            <p className="text-[11px] text-indigo-400 uppercase tracking-[.15em] text-center mb-6">
                                // collaboration preferences
                            </p>
                            {[
                                { key: "workStyle", label: "Work style", opts: ["Remote only", "In-person", "Either"] },
                                { key: "availability", label: "Availability", opts: ["Full-time", "Part-time", "Evenings & weekends"] },
                                { key: "commitment", label: "Commitment level", opts: ["Casual / hobby", "Serious side project", "Full commitment"] },
                                { key: "timezone", label: "Timezone overlap", opts: ["Same timezone", "±3 hrs is fine", "Fully async ok"] },
                            ].map(({ key, label, opts }) => (
                                <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-3">{label}</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {opts.map((o) => (
                                            <button key={o} onClick={() => setPref(key, o)}
                                                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${prefs[key] === o
                                                    ? "bg-indigo-600 border-indigo-500 text-white"
                                                    : "border-zinc-700 text-zinc-500 hover:border-indigo-500 hover:text-indigo-400"}`}>
                                                {o}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                </AnimatePresence>

                {/* ── Navigation ── */}
                <div className="flex items-center justify-between mt-8">
                    {/* Back — hidden if step 0 or if the user has already completed this step */}
                    <button
                        onClick={() => step > 0 && !isStepLocked(step - 1) && setStep((s) => s - 1)}
                        className={`text-xs text-zinc-600 hover:text-zinc-400 transition-colors ${step === 0 || isStepLocked(step - 1) ? "invisible" : ""}`}
                    >
                        ← back
                    </button>

                    <div className="flex items-center gap-3">
                        {step > 0 && step < steps.length - 1 && (
                            <button
                                onClick={() => setStep((s) => s + 1)}
                                className="text-xs text-zinc-600 hover:text-zinc-400 flex items-center gap-1 transition-colors"
                            >
                                <SkipForward className="w-3 h-3" /> skip
                            </button>
                        )}

                        <button
                            onClick={advance}
                            disabled={!canAdvance() || advancing}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold tracking-wider px-5 py-2.5 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(99,102,241,.35)] min-w-[140px] justify-center"
                        >
                            {advancing
                                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />{STEP_LOADING_LABEL[step] ?? "saving..."}</>
                                : <>{step < steps.length - 1 ? "next" : "go to dashboard"}<ChevronRight className="w-3.5 h-3.5" /></>
                            }
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}