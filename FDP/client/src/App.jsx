import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Sparkles, Moon, Sun } from "lucide-react";

import WorkflowPanel from "./components/WorkflowPanel";

import CandidatesTable from "./components/CandidatesTable";
import EmailPreview from "./components/EmailPreview";
import ExecutionLogs from "./components/ExecutionLogs";
import ChatPanel from "./components/ChatPanel";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello. Describe your hiring requirement.",
    },
  ]);
  const [workflowStatus, setWorkflowStatus] = useState("idle");
  const [parsedData, setParsedData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const addLog = (message, level = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: new Date().toLocaleTimeString(),
        level,
        message,
      },
    ]);
  };

  const handleSendMessage = async (content) => {
    const userMessage = {
      role: "user",
      content,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setWorkflowStatus("idle");
    setPreview(null);
    setParsedData(null);
    setCandidates([]);
    setSelectedCandidateIds([]);
    setIsLoading(true);
    addLog("Sending request to backend.", "info");

    try {
      const res = await fetch("http://localhost:5000/api/workflow/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Something went wrong");
      }

      let assistantContent = "";

      if (data.type === "clarification") {
        setWorkflowStatus("clarification");
        assistantContent = data.data.question;
        addLog("Clarification requested by AI.", "info");
      } else if (data.type === "ready_for_preview") {
        setWorkflowStatus("ready_for_preview");
        setParsedData(data.data.parsed);
        setPreview(data.data.preview);
        assistantContent = data.data.message || "Preview is ready.";
        addLog("Preview generated and ready for approval.", "success");
      } else {
        setWorkflowStatus("idle");
        assistantContent = data.data?.question || JSON.stringify(data.data);
        addLog("Received unknown response type from backend.", "error");
      }

      const assistantMessage = {
        role: "assistant",
        content: assistantContent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      addLog(error.message || "Failed to send message.", "error");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCandidate = (id) => {
    setSelectedCandidateIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleToggleAll = () => {
    const selectable = candidates.filter((c) => c.status === "pending");
    const selectableIds = selectable.map((c) => c.id);
    const allSelected = selectable.every((c) =>
      selectedCandidateIds.includes(c.id)
    );

    if (allSelected) {
      setSelectedCandidateIds((prev) =>
        prev.filter((id) => !selectableIds.includes(id))
      );
    } else {
      setSelectedCandidateIds((prev) => {
        const otherIds = prev.filter((id) => !selectableIds.includes(id));
        return [...otherIds, ...selectableIds];
      });
    }
  };

  const handleApprove = async () => {
    if (!parsedData) return;

    setWorkflowStatus("awaiting_approval");
    addLog("Approval received. Beginning execution.", "info");

    try {
      const res = await fetch("http://localhost:5000/api/workflow/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ parsedData }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Execution failed");
      }

      setWorkflowStatus("execution");
      const filtered = data.candidates || [];
      setCandidates(filtered);
      setSelectedCandidateIds(filtered.map(c => c.id));
      setLogs((prev) => [...prev, ...(data.logs || [])]);

      addLog(`Filtered ${filtered.length} candidate(s) matching criteria.`, "success");

      const executionMessage = {
        role: "assistant",
        content: `I found ${filtered.length} candidate(s) matching your criteria. Please review them in the Candidates list below. All candidates are selected by default. You can uncheck any candidates you want to exclude and then click the "Send Emails" button inside the table card.`,
      };

      setMessages((prev) => [...prev, executionMessage]);
    } catch (error) {
      addLog(error.message || "Execution failed.", "error");
      console.error(error);
    }
  };

  const handleSendEmails = async () => {
    if (selectedCandidateIds.length === 0) {
      addLog("No candidates selected to email.", "warning");
      return;
    }

    setIsLoading(true);
    addLog(`Sending emails to ${selectedCandidateIds.length} candidate(s)...`, "info");

    try {
      const selectedCandidates = candidates.filter((c) =>
        selectedCandidateIds.includes(c.id)
      );

      const res = await fetch("http://localhost:5000/api/workflow/send-emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shortlistedCandidates: selectedCandidates,
          parsedData,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Failed to send emails");
      }

      const results = data.data?.results || [];
      setCandidates((prevCandidates) =>
        prevCandidates.map((candidate) => {
          const match = results.find((r) => r.candidateId === candidate.id);
          if (match) {
            return {
              ...candidate,
              status: match.status,
              error: match.message,
            };
          }
          return candidate;
        })
      );

      setWorkflowStatus("completed");
      addLog(
        `Email outreach complete. Sent: ${data.data.sentCount}, Failed: ${data.data.failedCount}.`,
        "success"
      );

      const successMessage = {
        role: "assistant",
        content: `Emails sent successfully to ${data.data.sentCount} candidate(s). Failed: ${data.data.failedCount}.`,
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error) {
      addLog(error.message || "Failed to send emails.", "error");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}

        <div className="mb-16 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>

              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20"
              >
                AI-Powered
              </Badge>
            </div>

            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Intellect Hire
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground">
            AI-Powered Recruitment Automation & Candidate Engagement System.
          </p>
        </div>

        {/* Main Grid */}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ChatPanel messages={messages} onSendMessage={handleSendMessage} isLoading={isLoading} />
          </div>

          <WorkflowPanel status={workflowStatus} candidates={candidates} />
        </div>

        <div className="mt-12 space-y-6">
          {/* Step 1: Email Preview & Approval */}
          <div>
            <EmailPreview preview={preview} />
            {workflowStatus === "ready_for_preview" && preview ? (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleApprove}>Approve and Execute</Button>
              </div>
            ) : null}
          </div>

          {/* Step 2: Candidates List with Selection */}
          <CandidatesTable
            candidates={candidates}
            selectedIds={selectedCandidateIds}
            onToggleCandidate={handleToggleCandidate}
            onToggleAll={handleToggleAll}
            onSendEmails={handleSendEmails}
          />

          {/* Step 3: Execution Logs */}
          <ExecutionLogs logs={logs} />
        </div>
      </div>
    </main>
  );
}

export default App;
