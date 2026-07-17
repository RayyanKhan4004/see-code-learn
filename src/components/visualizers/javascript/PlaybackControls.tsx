import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlayground } from "@/store/playground";
import { javascriptModule } from "@/lib/visualizer/javascript/examples";
import { Pause, Play, RotateCcw, SkipBack, SkipForward, Zap, Loader2 } from "lucide-react";
import { useEffect } from "react";

export function PlaybackControls() {
  const {
    isPlaying,
    play,
    pause,
    stepForward,
    stepBackward,
    reset,
    speedMs,
    setSpeed,
    stepIndex,
    trace,
    exampleId,
    loadExample,
    runCode,
    isTracing,
    isLiveTrace,
    traceError,
  } = usePlayground();

  useEffect(() => {
    if (!isPlaying) return;
    const t = setTimeout(() => stepForward(), speedMs);
    return () => clearTimeout(t);
  }, [isPlaying, stepIndex, speedMs, stepForward]);

  useEffect(() => {
    if (stepIndex >= trace.length - 1 && isPlaying) pause();
  }, [stepIndex, trace.length, isPlaying, pause]);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <Select value={exampleId} onValueChange={loadExample}>
        <SelectTrigger className="h-9 w-[200px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {javascriptModule.examples.map((ex) => (
            <SelectItem key={ex.id} value={ex.id}>
              {ex.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        onClick={runCode}
        disabled={isTracing}
        className="gap-1.5 bg-[color:var(--primary)] text-primary-foreground hover:bg-[color:var(--primary)]/90"
        title="Execute the current code and generate a fresh trace"
      >
        {isTracing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
        Run Code
      </Button>

      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={reset} title="Reset playback">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={stepBackward}
          disabled={stepIndex < 0}
          title="Step back"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        {isPlaying ? (
          <Button size="sm" variant="secondary" onClick={pause} className="gap-1.5">
            <Pause className="h-4 w-4" /> Pause
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              if (stepIndex >= trace.length - 1) reset();
              play();
            }}
            className="gap-1.5"
            disabled={trace.length === 0}
          >
            <Play className="h-4 w-4" /> Play
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={stepForward}
          disabled={stepIndex >= trace.length - 1}
          title="Step forward"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 items-center gap-2 min-w-[160px]">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Speed</span>
        <Slider
          value={[1400 - speedMs]}
          min={100}
          max={1300}
          step={100}
          onValueChange={(v) => setSpeed(1400 - v[0])}
          className="flex-1"
        />
      </div>

      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground tabular-nums">
        {isLiveTrace && (
          <span className="rounded bg-[color:var(--primary)]/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--primary)]">
            live
          </span>
        )}
        {traceError && <span className="text-destructive">{traceError}</span>}
        <span>
          Step {Math.max(0, stepIndex + 1)} / {trace.length}
        </span>
      </div>
    </div>
  );
}
