import { X, CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { useUiStore } from "../../stores/ui";
import type { FetchProgressMap } from "../../hooks/useFetchProgress";

interface Props {
  progress: FetchProgressMap;
}

export default function FetchSheet({ progress }: Props) {
  const { isFetchSheetOpen, setFetchSheetOpen } = useUiStore();
  const entries = Object.values(progress);

  if (!isFetchSheetOpen) return null;

  const done = entries.filter((e) => e.phase === "done").length;
  const errors = entries.filter((e) => e.phase === "error").length;
  const total = entries[0]?.reposTotal ?? 0;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 border-l bg-background shadow-xl flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="text-sm font-semibold">Fetch en cours</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {done}/{total} terminés{errors > 0 && `, ${errors} erreur(s)`}
          </p>
        </div>
        <button
          onClick={() => setFetchSheetOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {total > 0 && (
        <div className="px-4 pt-3">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-200"
              style={{ width: total > 0 ? `${((done + errors) / total) * 100}%` : "0%" }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {entries.map((entry) => (
          <div
            key={entry.repoPath}
            className="flex items-start gap-2 text-sm py-1"
          >
            <PhaseIcon phase={entry.phase} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{entry.repoName}</p>
              {entry.message && (
                <p className="text-xs text-muted-foreground truncate">{entry.message}</p>
              )}
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-4">
            En attente de démarrage…
          </p>
        )}
      </div>
    </div>
  );
}

function PhaseIcon({ phase }: { phase: string }) {
  if (phase === "done") return <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />;
  if (phase === "error") return <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />;
  if (phase === "running") return <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0 mt-0.5" />;
  return <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />;
}
