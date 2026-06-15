import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Loader2, Activity, XCircle, AlertTriangle } from "lucide-react"

const WORKFLOW_STEPS = [
  {
    id: 1,
    name: "Analyze Requirements",
    description: "Parsing user intent and expectations",
  },
  {
    id: 2,
    name: "Generate Email Preview",
    description: "Creating initial template preview",
  },
  {
    id: 3,
    name: "Awaiting Approval",
    description: "Waiting for user approval to execute",
  },
  {
    id: 4,
    name: "Fetch & Rank Candidates",
    description: "Retrieving matching candidates from database",
  },
  {
    id: 5,
    name: "Send Emails",
    description: "Delivering personalized messages via Nodemailer",
  },
  {
    id: 6,
    name: "Finalize Workflow",
    description: "Updating candidate statuses and logs",
  },
]

function getStepState(stepId, status, sentEmails, failedEmails, totalEmails) {
  // status can be: "idle", "clarification", "ready_for_preview", "awaiting_approval", "execution", "completed"
  switch (stepId) {
    case 1: // Analyze Requirements
      if (status === "completed" || status === "execution" || status === "awaiting_approval" || status === "ready_for_preview") {
        return "completed";
      }
      return "active";
      
    case 2: // Generate Email Preview
      if (status === "completed" || status === "execution" || status === "awaiting_approval" || status === "ready_for_preview") {
        return "completed";
      }
      if (status === "clarification") {
        return "active";
      }
      return "pending";
      
    case 3: // Awaiting Approval
      if (status === "completed" || status === "execution" || status === "awaiting_approval") {
        return "completed";
      }
      if (status === "ready_for_preview") {
        return "active";
      }
      return "pending";
      
    case 4: // Fetch & Rank Candidates
      if (status === "completed") {
        return "completed";
      }
      if (status === "awaiting_approval" || status === "execution") {
        return "active";
      }
      return "pending";
      
    case 5: // Send Emails
      if (status === "completed") {
        if (failedEmails > 0) {
          return "failed";
        }
        return "completed";
      }
      if (status === "execution") {
        return "active";
      }
      return "pending";
      
    case 6: // Finalize Workflow
      if (status === "completed") {
        if (failedEmails > 0) {
          return "warning";
        }
        return "completed";
      }
      return "pending";
      
    default:
      return "pending";
  }
}

const getStepStyle = (state) => {
  switch (state) {
    case "completed":
      return {
        containerClass: "bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-300",
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
        nameClass: "font-semibold text-emerald-600 dark:text-emerald-400 text-sm",
        descClass: "text-xs text-emerald-600/70 dark:text-emerald-400/70",
        badge: (
          <Badge className="ml-auto bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 text-[10px] py-0 px-2 font-medium">
            Complete
          </Badge>
        ),
      };
    case "failed":
      return {
        containerClass: "bg-rose-500/5 border border-rose-500/20 text-rose-600 dark:text-rose-400 animate-in fade-in duration-300",
        icon: <XCircle className="h-5 w-5 text-rose-500 shrink-0" />,
        nameClass: "font-semibold text-rose-600 dark:text-rose-400 text-sm",
        descClass: "text-xs text-rose-600/70 dark:text-rose-400/70",
        badge: (
          <Badge className="ml-auto bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 text-[10px] py-0 px-2 font-medium">
            Failed
          </Badge>
        ),
      };
    case "warning":
      return {
        containerClass: "bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 animate-in fade-in duration-300",
        icon: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
        nameClass: "font-semibold text-amber-600 dark:text-amber-400 text-sm",
        descClass: "text-xs text-amber-600/70 dark:text-amber-400/70",
        badge: (
          <Badge className="ml-auto bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 text-[10px] py-0 px-2 font-medium">
            Warning
          </Badge>
        ),
      };
    case "active":
      return {
        containerClass: "bg-primary/5 border border-primary/20 text-foreground animate-pulse",
        icon: <Loader2 className="h-5 w-5 text-primary shrink-0 animate-spin" />,
        nameClass: "font-semibold text-foreground text-sm",
        descClass: "text-xs text-muted-foreground",
        badge: (
          <Badge className="ml-auto bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 text-[10px] py-0 px-2 font-medium animate-bounce">
            In Progress
          </Badge>
        ),
      };
    case "pending":
    default:
      return {
        containerClass: "bg-secondary/10 border border-border/50 text-muted-foreground/60",
        icon: <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />,
        nameClass: "font-semibold text-muted-foreground/60 text-sm",
        descClass: "text-xs text-muted-foreground/40",
        badge: (
          <Badge variant="outline" className="ml-auto bg-transparent border-muted-foreground/20 text-muted-foreground/40 text-[10px] py-0 px-2 font-medium">
            Pending
          </Badge>
        ),
      };
  }
};

export default function WorkflowPanel({ status = "idle", candidates = [] }) {
  const totalEmails = candidates.length;
  const sentEmails = candidates.filter(c => c.status === "sent").length;
  const failedEmails = candidates.filter(c => c.status === "failed").length;

  return (
    <Card className="bg-card border-border shadow-lg overflow-hidden group">
      <div className="h-1 bg-primary"></div>

      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">
            Execution Status
          </CardTitle>
        </div>
        <CardDescription className="text-sm">
          Real-time workflow progress
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {WORKFLOW_STEPS.map((step) => {
            const state = getStepState(step.id, status, sentEmails, failedEmails, totalEmails);
            const style = getStepStyle(state);

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg transition-all duration-300 ${style.containerClass}`}
              >
                <div className="mt-0.5 shrink-0">
                  {style.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={style.nameClass}>
                      {step.name}
                    </p>
                    {style.badge}
                  </div>

                  <p className={style.descClass}>
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {status === "completed" && (
          failedEmails > 0 ? (
            <div className="mt-5 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 animate-in fade-in duration-500">
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-500" />
                Workflow completed with {failedEmails} failure(s)
              </p>
            </div>
          ) : (
            <div className="mt-5 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in duration-500">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Workflow completed successfully
              </p>
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}