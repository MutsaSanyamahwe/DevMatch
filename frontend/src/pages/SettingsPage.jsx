import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Github, FileText, CheckCircle2,
    RefreshCw, Loader2
} from "lucide-react";
import { useUser } from "../context/UserContext";

const fadeUp = (i = 0) => ({
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] },
});

function GhDot({ checking, valid, error }) {
    if (checking) return <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />;
    if (valid) return <span className="w-2 h-2 rounded-full bg-emerald-400" />;
    if (error) return <span className="w-2 h-2 rounded-full bg-red-400" />;
    return <span className="w-2 h-2 rounded-full bg-zinc-600" />;
}

export default function SettingsPage() {
    const { user } = useUser();
    const { userid } = user;

    const [cvFile, setCvFile] = useState(null);
    const [cvDragOver, setCvDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const [savedUsername, setSavedUsername] = useState("");
    const [ghDraft, setGhDraft] = useState("");
    const [ghChecking, setGhChecking] = useState(false);
    const [ghValid, setGhValid] = useState(true);
    const [ghError, setGhError] = useState("");
    const [debounceProgress, setDebounceProgress] = useState(0);
    const debounceRef = useRef(null);
    const progressRef = useRef(null);

    const [analyzing, setAnalyzing] = useState(false);
    const [analysisDone, setAnalysisDone] = useState(false);

    const cvChanged = !!cvFile;
    const ghChanged = ghDraft !== savedUsername && ghValid;
    const hasChanges = cvChanged || ghChanged;

    useEffect(() => {
        const val = ghDraft.trim();

        if (!val || val === savedUsername) {
            clearTimeout(debounceRef.current);
            clearInterval(progressRef.current);
            setGhChecking(false);
            setGhValid(val === savedUsername);
            setGhError("");
            setDebounceProgress(0);
            return;
        }

        setGhChecking(true);
        setGhValid(false);
        setGhError("");
        setDebounceProgress(0);

        clearInterval(progressRef.current);
        const start = Date.now();
        const DURATION = 700;
        progressRef.current = setInterval(() => {
            const elapsed = Date.now() - start;
            setDebounceProgress(Math.min((elapsed / DURATION) * 100, 100));
            if (elapsed >= DURATION) clearInterval(progressRef.current);
        }, 16);

        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            clearInterval(progressRef.current);
            setDebounceProgress(0);
            const exists = val.length >= 3 && val !== "notauser";
            setGhChecking(false);
            setGhValid(exists);
            setGhError(exists ? "" : `error: @${val} not found on github`);
        }, DURATION);

        return () => {
            clearTimeout(debounceRef.current);
            clearInterval(progressRef.current);
        };
    }, [ghDraft, savedUsername]);

    const handleDrop = (e) => {
        e.preventDefault();
        setCvDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/pdf") setCvFile(file);
    };

    const handleFileInput = (e) => {
        const file = e.target.files?.[0];
        if (file) setCvFile(file);
    };

    const handleAnalyze = async () => {
        if (!hasChanges || analyzing) return;
        setAnalyzing(true);

        try {
            const formData = new FormData();
            formData.append("cv_file", cvFile);
            formData.append("github_username", ghDraft);

            const res = await fetch("https://devverify-system.onrender.com/analyze", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Verification failed");
            }

            const data = await res.json();

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
                throw new Error(errData.error || "Failed to save CV data");
            }

            setSavedUsername(ghDraft);
            setAnalysisDone(true);
        } catch (err) {
            console.error(err.message);
        } finally {
            setAnalyzing(false);
        }
    };

    useEffect(() => {
        if (analysisDone) {
            const t = setTimeout(() => setAnalysisDone(false), 6000);
            return () => clearTimeout(t);
        }
    }, [analysisDone]);

    const handleDiscard = () => {
        setCvFile(null);
        setGhDraft(savedUsername);
        setGhValid(true);
        setGhError("");
        setDebounceProgress(0);
        setAnalysisDone(false);
    };

    const ghHintText = ghChecking
        ? "// validating..."
        : ghError
            ? `// ${ghError}`
            : ghValid && ghDraft !== savedUsername
                ? `// ✓ github.com/${ghDraft} found`
                : analysisDone
                    ? "// ✓ analysis complete"
                    : "";

    const ghHintColor = ghError
        ? "text-red-400"
        : ghValid && !ghChecking
            ? "text-emerald-400"
            : "text-zinc-500";

    return (
        <div className="h-full flex flex-col px-10 py-8 gap-6 bg-zinc-950 font-mono">

            {/* Header */}
            <motion.div {...fadeUp(0)}>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    data_sources<span className="text-indigo-400">.</span>config
                </h1>
                <p className="text-xs text-zinc-500 mt-1.5">
                    devmatch builds your profile from cv + github signals
                </p>
            </motion.div>

            {/* Success banner */}
            {analysisDone && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2 border border-emerald-900 bg-emerald-950/40 text-emerald-400 rounded-lg px-4 py-2.5 text-xs"
                >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>// profile updated · analysis complete</span>
                </motion.div>
            )}

            {/* Cards */}
            <div className="grid grid-cols-2 gap-5">

                {/* CV Card */}
                <motion.div {...fadeUp(1)} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">curriculum_vitae</p>
                            <p className="text-xs text-zinc-500">.pdf || .docx</p>
                        </div>
                    </div>

                    <div className="px-5 py-4">
                        <p className="text-[10px] text-zinc-600 mb-2 tracking-widest uppercase">// drop or browse</p>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setCvDragOver(true); }}
                            onDragLeave={() => setCvDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => !cvFile && fileInputRef.current?.click()}
                            className={`border border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors
                                ${cvFile
                                    ? "border-emerald-800 bg-emerald-950/20"
                                    : cvDragOver
                                        ? "border-indigo-600 bg-indigo-950/20"
                                        : "border-zinc-700 hover:border-zinc-500"
                                }`}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={handleFileInput}
                                className="hidden"
                            />
                            {cvFile ? (
                                <p className="text-xs text-emerald-400 truncate">↳ {cvFile.name}</p>
                            ) : (
                                <p className="text-xs text-zinc-500">
                                    drop <span className="text-indigo-400">cv.pdf</span> here or{" "}
                                    <span className="text-indigo-400">browse</span>
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* GitHub Card */}
                <motion.div {...fadeUp(2)} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                            <Github className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">github</p>
                            <p className="text-xs text-zinc-500 truncate">
                                {savedUsername ? `github.com/${savedUsername}` : "no account linked"}
                            </p>
                        </div>
                    </div>

                    <div className="px-5 py-4">
                        <p className="text-[10px] text-zinc-600 mb-2 tracking-widest uppercase">// github handle</p>

                        <div className={`flex items-center bg-zinc-950 border rounded-lg overflow-hidden transition-colors
                            ${ghError
                                ? "border-red-800"
                                : ghValid && ghDraft !== savedUsername
                                    ? "border-emerald-800"
                                    : "border-zinc-800 focus-within:border-indigo-700"
                            }`}>
                            <span className="text-indigo-400 text-xs px-3 select-none whitespace-nowrap">~/devmatch $</span>
                            <input
                                type="text"
                                value={ghDraft}
                                onChange={(e) => {
                                    setGhDraft(e.target.value);
                                    setAnalysisDone(false);
                                }}
                                placeholder="username"
                                autoComplete="off"
                                spellCheck={false}
                                className="flex-1 bg-transparent border-none outline-none text-xs text-white py-2.5 caret-indigo-400 font-mono"
                            />
                            <div className="px-3">
                                <GhDot
                                    checking={ghChecking}
                                    valid={ghValid && !ghChecking}
                                    error={!!ghError}
                                />
                            </div>
                        </div>

                        {/* Debounce progress bar */}
                        <div className="h-px bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full transition-none"
                                style={{ width: `${debounceProgress}%` }}
                            />
                        </div>

                        {/* Hint */}
                        <p className={`text-[11px] mt-1.5 h-4 font-mono transition-opacity ${ghHintColor} ${ghHintText ? "opacity-100" : "opacity-0"}`}>
                            {ghHintText || "‎"}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Action Bar */}
            <motion.div {...fadeUp(4)} className="flex items-center justify-between mt-auto">
                <p className="text-xs text-zinc-600">// cv + github required to run analysis</p>

                <div className="flex items-center gap-3">
                    {hasChanges && !analyzing && (
                        <button
                            onClick={handleDiscard}
                            className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-4 py-2.5 rounded-lg transition-colors"
                        >
                            discard
                        </button>
                    )}

                    <button
                        onClick={handleAnalyze}
                        disabled={!hasChanges || analyzing || ghChecking}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all
                            ${analyzing
                                ? "bg-indigo-950 text-indigo-400 cursor-not-allowed"
                                : hasChanges && !ghChecking
                                    ? "bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-[0_0_20px_rgba(99,102,241,.35)] hover:-translate-y-px"
                                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                            }`}
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                analyzing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-3.5 h-3.5" />
                                ./run-analysis
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}