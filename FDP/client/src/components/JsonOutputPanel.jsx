import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Code2 } from "lucide-react";

export default function JsonOutputPanel({ data }) {
  return (
    <Card className="bg-card border-border shadow-lg overflow-hidden animate-in fade-in duration-500">
      <div className="h-1 bg-primary"></div>

      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <Code2 className="h-5 w-5 text-primary" />

          <CardTitle className="text-lg">Parsed Instructions</CardTitle>
        </div>

        <CardDescription className="text-sm">
          Structured AI interpretation in JSON format
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="bg-secondary border border-border rounded-lg p-4 font-mono text-xs text-foreground overflow-x-auto">
          <pre className="whitespace-pre-wrap wrap-break-word leading-relaxed">
            {data
              ? JSON.stringify(data, null, 2)
              : "No parsed instruction data received from backend yet."}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
