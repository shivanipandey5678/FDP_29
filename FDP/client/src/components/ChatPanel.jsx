import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, User, Send, Bot } from "lucide-react";

// Sub-component to stream text word-by-word
const StreamedText = ({ content, isLast, onComplete, scrollRef }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    if (!isLast) {
      setDisplayedText(content);
      return;
    }

    setDisplayedText("");
    const words = content.split(" ");
    let index = 0;

    const interval = setInterval(() => {
      if (index < words.length) {
        setDisplayedText((prev) => prev + (index === 0 ? "" : " ") + words[index]);
        index++;
        
        // Auto scroll during streaming
        if (scrollRef && scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 45); // High fidelity smooth streaming speed

    return () => clearInterval(interval);
  }, [content, isLast]);

  return <p className="whitespace-pre-wrap leading-relaxed text-sm">{displayedText}</p>;
};

const ChatPanel = ({ messages = [], onSendMessage, isLoading = false }) => {
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef(null);

  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto scroll to bottom when messages or loading state changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <Card className="bg-card border-border shadow-lg overflow-hidden flex flex-col h-full min-h-[580px]">
      <div className="h-1 bg-primary"></div>

      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">AI Recruitment Assistant</CardTitle>
            <CardDescription className="text-xs">Orchestrate hiring workflows in real-time</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between gap-4 overflow-hidden">
        {/* Messages List Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 min-h-[320px] max-h-[420px] overflow-y-auto border border-border/60 rounded-xl p-4 space-y-4 bg-background/50 backdrop-blur-sm scrollbar-thin scrollbar-thumb-border"
        >
          {messages.map((msg, index) => {
            const isLast = index === messages.length - 1;
            const isUser = msg.role === "user";

            return (
              <div
                key={index}
                className={`flex gap-3 items-start ${
                  isUser ? "justify-end" : "justify-start"
                }`}
              >
                {/* Assistant Avatar on Left */}
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm border ${
                    isUser
                      ? "bg-primary text-primary-foreground border-primary/30 rounded-tr-none"
                      : "bg-muted/80 text-foreground border-border/80 rounded-tl-none"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  ) : (
                    <StreamedText 
                      content={msg.content} 
                      isLast={isLast} 
                      scrollRef={scrollContainerRef} 
                    />
                  )}
                </div>

                {/* User Avatar on Right */}
                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 border border-primary/30 text-primary shadow-sm">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start justify-start animate-in fade-in duration-300">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary shadow-sm animate-pulse">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="bg-muted/65 border border-border/60 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>

        {/* Text Input Area */}
        <div className="space-y-2.5">
          <div className="relative group">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your hiring requirements... (e.g. 'I need a React developer with 5 years experience')"
              className="min-h-[85px] max-h-[120px] resize-none pr-12 pl-4 py-3 border border-border bg-background/80 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary/80 transition-all rounded-xl text-sm"
              disabled={isLoading}
            />
            <div className="absolute bottom-2.5 right-2.5">
              <Button 
                onClick={handleSendMessage} 
                size="icon" 
                className="h-8 w-8 rounded-lg shadow-md"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60 pl-1">
            Press <kbd className="font-sans font-medium px-1 bg-muted border border-border rounded text-[9px] text-muted-foreground">Enter</kbd> to send, <kbd className="font-sans font-medium px-1 bg-muted border border-border rounded text-[9px] text-muted-foreground">Shift + Enter</kbd> for a new line.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatPanel;
