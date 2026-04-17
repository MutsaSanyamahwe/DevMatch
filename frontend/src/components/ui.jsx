// Shared components used by both MatchesPage and DiscoverPage
// Styled to match the devmatch dark/indigo/mono aesthetic

const COLOR_MAP = {
    blue: "bg-indigo-950 text-indigo-300",
    purple: "bg-violet-950 text-violet-300",
    teal: "bg-teal-950  text-teal-300",
    coral: "bg-orange-950 text-orange-300",
    anon: "bg-zinc-800  text-zinc-500",
};

export function Avatar({ initials, color = "gray", size = "md", src }) {
    const sizeClasses = {
        sm: "w-6 h-6 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-16 h-16 text-base",
    };

    return (
        <div
            className={`rounded-full flex items-center justify-center bg-${color}-600 text-white font-bold overflow-hidden ${sizeClasses[size]}`}
        >
            {src ? (
                <img
                    src={src}
                    alt={initials}
                    className="object-cover w-full h-full"
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
}

export function StackTag({ label }) {
    return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-mono">
            {label}
        </span>
    );
}

export function AnonTag() {
    return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-500 border border-amber-900 italic font-mono">
            photo hidden
        </span>
    );
}

export function AvailBadge({ availability, label }) {
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded font-mono whitespace-nowrap border ${availability === "open"
            ? "bg-emerald-950 text-emerald-400 border-emerald-900"
            : "bg-amber-950 text-amber-500 border-amber-900"
            }`}>
            {label}
        </span>
    );
}

export function DevRow({ dev, actions, highlighted = false }) {
    return (
        <div className={`py-4 ${highlighted ? "border border-emerald-900/50 rounded-xl bg-emerald-950/20 px-4 mb-3" : ""}`}>
            {/* Header */}
            <div className="flex gap-3 items-start mb-3">
                <Avatar initials={dev.initials} color={dev.color} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[13px] font-bold text-zinc-100" style={{ fontFamily: "'Syne', sans-serif" }}>
                            {dev.name}
                        </span>
                        <AvailBadge availability={dev.availability} label={dev.availLabel} />
                        {dev.photoHidden && <AnonTag />}
                    </div>
                    <p className="text-[11px] text-zinc-500">{dev.role}</p>
                    <p className="text-[11px] text-zinc-700">{dev.location}</p>
                    {dev.matchedAgo && (
                        <p className="text-[10px] text-emerald-600 tracking-wider mt-0.5">// matched {dev.matchedAgo}</p>
                    )}
                </div>
            </div>

            {/* Stack */}
            <div className="flex flex-wrap gap-1.5 mb-2.5">
                {dev.stack.map((s) => <StackTag key={s} label={s} />)}
            </div>

            {/* Stats row */}
            <div className="flex gap-4 mb-2.5">
                <Stat label="projects" value={dev.projects} />
                <Stat label="yrs exp" value={dev.experience} />
                <Stat label="linked" value={dev.linkedProfile} />
            </div>

            {/* Bio */}
            <p className="text-[11px] text-zinc-600 leading-[1.8] mb-3">{dev.bio}</p>

            {actions}
        </div>
    );
}

function Stat({ label, value }) {
    return (
        <span className="text-[11px] text-zinc-700 font-mono">
            <span className="text-zinc-400 font-medium">{value}</span> {label}
        </span>
    );
}