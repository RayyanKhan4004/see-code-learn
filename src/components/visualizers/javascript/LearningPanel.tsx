import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayground } from "@/store/playground";
import { Lightbulb } from "lucide-react";

export function LearningPanel() {
  const step = usePlayground((s) => s.vm.currentStep);
  const line = usePlayground((s) => s.vm.currentLine);

  return (
    <Card className="overflow-hidden border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-3.5 w-3.5 text-[color:var(--webapi)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Learning Mode</h3>
        </div>
        {line != null && (
          <Badge variant="secondary" className="font-mono text-[10px]">
            line {line}
          </Badge>
        )}
      </div>
      <div className="min-h-[140px] p-4">
        <AnimatePresence mode="wait">
          {step ? (
            <motion.div
              key={step.explanation}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="space-y-2"
            >
              <Badge variant="outline" className="border-[color:var(--primary)]/40 text-[color:var(--primary)]">
                {step.concept}
              </Badge>
              <p className="text-sm font-medium text-foreground">{step.explanation}</p>
              {step.why && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <span className="font-semibold text-foreground/80">Why: </span>
                  {step.why}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.p
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground"
            >
              Press <span className="font-mono text-foreground">Run</span> to watch the JavaScript engine execute your code step by step.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
