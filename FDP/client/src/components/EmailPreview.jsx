import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Copy, Check } from "lucide-react";

export default function EmailPreview({ preview }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!preview) return;
    const fullEmail = [
      `Subject: ${preview.subject || ""}`,
      "",
      preview.greeting || "",
      preview.body || "",
      preview.closing || "",
    ].join("\n");

    navigator.clipboard.writeText(fullEmail).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className="bg-card border-border shadow-lg overflow-hidden animate-in fade-in duration-500">
      <div className="h-1 bg-primary"></div>

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
              <Mail className="h-5 w-5 text-primary" />
            </div>

            <div>
              <CardTitle className="text-lg">Generated Email</CardTitle>

              <CardDescription className="text-sm">
                Professional email preview before execution.
              </CardDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            disabled={!preview}
          >
            {copied ? (
              <><Check className="h-4 w-4 text-emerald-500" /> <span className="text-xs text-emerald-500 ml-1">Copied!</span></>
            ) : (
              <><Copy className="h-4 w-4" /> <span className="text-xs ml-1">Copy</span></>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="bg-secondary border border-border rounded-lg overflow-hidden">
          {preview ? (
            <>
              <div className="bg-primary/10 border-b border-border p-4 space-y-2">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide">
                    Subject
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {preview.subject}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4 text-sm text-foreground/90 leading-relaxed">
                <p className="font-semibold">{preview.greeting}</p>
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90">
                  {preview.body}
                </pre>
                <div className="pt-3 whitespace-pre-wrap text-sm text-foreground/90">
                  {preview.closing}
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-sm text-muted-foreground">
              No generated email preview available yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
