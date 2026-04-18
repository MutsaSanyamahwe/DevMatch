import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Github, FileText, CheckCircle2, RefreshCw, Loader2, X } from "lucide-react";
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
    return <span className="w-2 h-2 rounded-full bg-zinc-700" />;
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
    const [ghValid, setGhValid] = useState(false);
    const [ghError, setGhError] = useState("");
    const [debounceProgress, setDebounceProgress] = useState(0);
    const debounceRef = useRef(null);
    const progressRef = useRef(null);

    const [analyzing, setAnalyzing] = useState(false);
    const [analysisDone, setAnalysisDone] = useState(false);

    // Button requires BOTH a cv file AND a valid github username
    const canAnalyze = !!cvFile && ghValid && !ghChecking && !analyzing;

    /* ── GitHub debounce validation ── */
    useEffect(() => {
        const val = ghDraft.trim();

        if (!val) {
            clearTimeout(debounceRef.current);
            clearInterval(progressRef.current);
            setGhChecking(false);
            setGhValid(false);
            setGhError("");
            setDebounceProgress(0);
            return;
        }

        if (val === savedUsername) {
            setGhChecking(false);
            setGhValid(true);
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
            setGhError(exists ? "" : `@${val} not found on github`);
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
        if (!canAnalyze) return;
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
                    github_data: data.github_data || [],
                }),
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
        setGhValid(!!savedUsername);
        setGhError("");
        setDebounceProgress(0);
        setAnalysisDone(false);
    };

    const ghHintText =
        ghChecking ? "validating..."
            : ghError ? ghError
                : ghValid && ghDraft !== savedUsername ? `github.com/${ghDraft} found`
                    : "";

    const ghHintColor = ghError
        ? "text-red-400"
        : ghValid && !ghChecking
            ? "text-emerald-400"
            : "text-zinc-500";

    // What's still missing for the button
    const missing = [];
    if (!cvFile) missing.push("cv");
    if (!ghValid || ghChecking) missing.push("github");

    return (
        <div
            className="min-h-full flex flex-col bg-zinc-950 text-zinc-200 px-8 py-10 gap-8"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=swap');`}</style>

            {/* Header */}
            <motion.div {...fadeUp(0)}>
                <p className="text-[11px] text-indigo-400 tracking-[.15em] uppercase mb-2">// data sources</p>
                <h1
                    className="font-bold text-white tracking-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(22px,2.5vw,30px)", letterSpacing: "-0.03em" }}
                >
                    Profile configuration
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                    DevMatch builds your profile from your CV and GitHub activity. Both are required to run an analysis.
                </p>
            </motion.div>

            {/* Success banner */}
            {analysisDone && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2.5 border border-emerald-900 bg-emerald-950/40 text-emerald-400 rounded-xl px-4 py-3 text-sm"
                >
                    <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    <span>Profile updated — analysis complete.</span>
                </motion.div>
            )}

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* CV Card */}
                <motion.div {...fadeUp(1)} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-zinc-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>CV / Résumé</p>
                            <p className="text-[11px] text-zinc-500">PDF format</p>
                        </div>
                        {cvFile && (
                            <button
                                onClick={() => setCvFile(null)}
                                className="ml-auto text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                                <X className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                        )}
                    </div>

                    <div className="px-5 py-5">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setCvDragOver(true); }}
                            onDragLeave={() => setCvDragOver(false)}
                            onDrop={handleDrop}
                            onClick={() => !cvFile && fileInputRef.current?.click()}
                            className={`border border-dashed rounded-xl p-6 text-center transition-colors ${cvFile
                                    ? "border-emerald-800 bg-emerald-950/20 cursor-default"
                                    : cvDragOver
                                        ? "border-indigo-700 bg-indigo-950/20 cursor-copy"
                                        : "border-zinc-700 hover:border-zinc-600 cursor-pointer"
                                }`}
                        >
                            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileInput} className="hidden" />
                            {cvFile ? (
                                <div className="flex flex-col items-center gap-1">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-1" strokeWidth={1.5} />
                                    <p className="text-sm text-emerald-400 font-medium truncate max-w-full px-4">{cvFile.name}</p>
                                    <p className="text-[11px] text-zinc-600">{(cvFile.size / 1024).toFixed(0)} KB</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1">
                                    <FileText className="w-5 h-5 text-zinc-600 mb-1" strokeWidth={1.5} />
                                    <p className="text-sm text-zinc-500">
                                        Drop your <span className="text-indigo-400">CV.pdf</span> here
                                    </p>
                                    <p className="text-[11px] text-zinc-600">or <span className="text-zinc-400 underline underline-offset-2">browse files</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* GitHub Card */}
                <motion.div {...fadeUp(2)} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                            <Github className="w-4 h-4 text-zinc-400" strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-zinc-100" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>GitHub</p>
                            <p className="text-[11px] text-zinc-500 truncate">
                                {savedUsername ? `github.com/${savedUsername}` : "no account linked"}
                            </p>
                        </div>
                        {ghValid && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
                    </div>

                    <div className="px-5 py-5 flex flex-col gap-3">
                        <p className="text-[11px] text-zinc-600 tracking-widest uppercase">// your handle</p>

                        <div className={`flex items-center bg-zinc-950 border rounded-xl overflow-hidden transition-colors ${ghError
                                ? "border-red-900"
                                : ghValid && ghDraft !== savedUsername
                                    ? "border-emerald-800"
                                    : "border-zinc-800 focus-within:border-indigo-800"
                            }`}>
                            <span className="text-indigo-400 text-xs px-3 select-none whitespace-nowrap font-mono">~/$ </span>
                            <input
                                type="text"
                                value={ghDraft}
                                onChange={(e) => { setGhDraft(e.target.value); setAnalysisDone(false); }}
                                placeholder="username"
                                autoComplete="off"
                                spellCheck={false}
                                className="flex-1 bg-transparent border-none outline-none text-sm text-white py-3 caret-indigo-400 font-mono"
                            />
                            <div className="px-3">
                                <GhDot checking={ghChecking} valid={ghValid && !ghChecking} error={!!ghError} />
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-px bg-zinc-800 rounded-full overflow-hidden -mt-1">
                            <div
                                className="h-full bg-indigo-600 rounded-full transition-none"
                                style={{ width: `${debounceProgress}%` }}
                            />
                        </div>

                        {/* Hint */}
                        <p className={`text-[11px] font-mono min-h-[16px] transition-opacity ${ghHintColor} ${ghHintText ? "opacity-100" : "opacity-0"}`}>
                            {ghHintText || "‎"}
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Action bar */}
            <motion.div {...fadeUp(3)} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">

                {/* Status / missing hint */}
                <div className="text-[11px] font-mono text-zinc-600">
                    {canAnalyze ? (
                        <span className="text-emerald-500">// ready — both sources connected</span>
                    ) : missing.length > 0 ? (
                        <span>// waiting for: <span className="text-zinc-400">{missing.join(" + ")}</span></span>
                    ) : null}
                </div>

                <div className="flex items-center gap-2.5">
                    {(cvFile || ghDraft) && !analyzing && (
                        <button
                            onClick={handleDiscard}
                            className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-700 px-4 py-2.5 rounded-lg transition-colors"
                        >
                            discard
                        </button>
                    )}

                    <button
                        onClick={handleAnalyze}
                        disabled={!canAnalyze}
                        title={!canAnalyze && missing.length > 0 ? `Missing: ${missing.join(" and ")}` : undefined}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-all ${analyzing
                                ? "bg-indigo-950 text-indigo-400 cursor-not-allowed"
                                : canAnalyze
                                    ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                                    : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                            }`}
                    >
                        {analyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
                                Run analysis
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}