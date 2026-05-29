import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Sparkles, Moon, Sun } from "lucide-react";

import WorkflowPanel from "./components/WorkflowPanel";
import JsonOutputPanel from "./components/JsonOutputPanel";
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
      setCandidates(data.candidates || []);
      setLogs((prev) => [...prev, ...(data.logs || [])]);
      
      // Premium real-time visualization delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setWorkflowStatus("completed");
      addLog("Workflow execution completed.", "success");

      const executionMessage = {
        role: "assistant",
        content: `Workflow execution completed. ${data.candidates?.length ?? 0} candidate(s) were processed.`,
      };

      setMessages((prev) => [...prev, executionMessage]);
    } catch (error) {
      addLog(error.message || "Execution failed.", "error");
      console.error(error);
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
            Recruitment Workflow Assistant
          </h1>

          <p className="max-w-2xl text-lg text-muted-foreground">
            Orchestrate intelligent recruitment workflows with AI automation.
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
          <div className="grid gap-6 lg:grid-cols-2">
            <JsonOutputPanel data={parsedData} />
            <CandidatesTable candidates={candidates} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <EmailPreview preview={preview} />
              {workflowStatus === "ready_for_preview" && preview ? (
                <div className="mt-4 flex justify-end">
                  <Button onClick={handleApprove}>Approve and Execute</Button>
                </div>
              ) : null}
            </div>
            <ExecutionLogs logs={logs} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
