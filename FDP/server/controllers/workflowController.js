import candidates from "../data/candidates.js";

import { filterCandidates } from "../services/candidateService.js";

import {
  analyzeConversation,
  createEmailPreview,
  rankCandidatesWithAI,
} from "../services/llmService.js";

import { sendShortlistEmails } from "../services/emailService.js";

const createLogEntry = (message, level = "info") => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  timestamp: new Date().toISOString(),
  level,
  message,
});

export const runWorkflow = async (req, res) => {
  try {


    const { messages } = req.body;


    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: "Invalid request. 'messages' must be an array.",
      });
    }


    const aiResult = await analyzeConversation(messages);

    if (aiResult.needsClarification) {

      return res.json({
        success: true,
        type: "clarification",
        data: {
          question: aiResult.question,
          possibleInterpretation: aiResult.possibleInterpretation || null,
        },
      });
    }


    const preview = createEmailPreview(aiResult);

    return res.json({
      success: true,
      type: "ready_for_preview",
      status: "ready_for_preview",
      data: {
        parsed: aiResult,
        preview,
        message:
          "All required information has been received. Email preview is ready to generate.",
      },
    });
  } catch (error) {
    console.log("\n" + "=".repeat(40));
    console.error("❌ WORKFLOW ERROR OCCURRED");
    console.error("Error Message:", error.message);
    console.error("Stack Trace:", error.stack);
    console.log("=".repeat(40) + "\n");

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const executeWorkflow = async (req, res) => {
  try {
    console.log("\n========================================");
    console.log("📨 EXECUTION REQUEST RECEIVED");
    console.log("========================================");
    console.log("🔹 Time:", new Date().toISOString());

    const { parsedData } = req.body;
    console.log(
      "🔹 Parsed data received:",
      JSON.stringify(parsedData, null, 2),
    );

    if (!parsedData || typeof parsedData !== "object") {
      return res.status(400).json({
        success: false,
        error: "Invalid request. 'parsedData' must be provided.",
      });
    }

    const hasProvidedEmails =
      Array.isArray(parsedData.providedEmails) &&
      parsedData.providedEmails.length > 0;

    let executionCandidates = [];
    const logs = [];

    if (hasProvidedEmails) {
      logs.push(
        createLogEntry("Provided emails exist; skipping database filtering."),
      );
      executionCandidates = candidates.filter((candidate) =>
        parsedData.providedEmails.includes(candidate.email),
      );
    } else {
      logs.push(
        createLogEntry(
          "No provided emails found; filtering candidate database.",
        ),
      );
      executionCandidates = filterCandidates(candidates, parsedData);
    }

    logs.push(
      createLogEntry(
        `Matched ${executionCandidates.length} candidate(s) for execution.`,
      ),
    );

    // Bypass AI ranking: map candidates directly with a pending status
    const enrichedCandidates = executionCandidates.map((candidate) => ({
      ...candidate,
      status: "pending",
    }));

    logs.push(
      createLogEntry(
        `Successfully filtered ${enrichedCandidates.length} candidate(s) matching criteria.`
      )
    );

    console.log(`✅ Filtered ${enrichedCandidates.length} matching candidate(s) (ranking bypassed)`);
    console.log("\n✅ WORKFLOW FILTERING SUCCESSFUL");
    console.log("📤 Sending candidate list to client...");
    console.log("========================================\n");

    return res.json({
      success: true,
      type: "execution",
      status: "candidates_filtered",
      data: {
        parsed: parsedData,
      },
      candidates: enrichedCandidates,
      logs,
    });
  } catch (error) {
    console.log("\n" + "=".repeat(40));
    console.error("❌ EXECUTION ERROR OCCURRED");
    console.error("Error Message:", error.message);
    console.error("Stack Trace:", error.stack);
    console.log("=".repeat(40) + "\n");

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const sendEmails = async (req, res) => {
  try {
    console.log("\n========================================");
    console.log("📨 EMAIL SENDING REQUEST RECEIVED");
    console.log("========================================");
    console.log("🔹 Time:", new Date().toISOString());

    const { shortlistedCandidates, parsedData } = req.body;

    if (
      !Array.isArray(shortlistedCandidates) ||
      shortlistedCandidates.length === 0
    ) {
      console.error(
        "❌ VALIDATION FAILED: shortlistedCandidates must be a non-empty array",
      );
      return res.status(400).json({
        success: false,
        error:
          "Invalid request. 'shortlistedCandidates' must be a non-empty array.",
      });
    }

    if (!parsedData || typeof parsedData !== "object") {
      console.error("❌ VALIDATION FAILED: parsedData must be an object");
      return res.status(400).json({
        success: false,
        error: "Invalid request. 'parsedData' must be provided.",
      });
    }

    console.log(
      `🔹 Sending emails to ${shortlistedCandidates.length} candidates...`,
    );
    console.log(`🔹 Role: ${parsedData.role}`);
    console.log(
      `🔹 Required skills: ${parsedData.skills?.join(", ") || "None"}`,
    );

    const emailResults = await sendShortlistEmails(
      shortlistedCandidates,
      parsedData,
    );

    const sentCount = emailResults.filter((r) => r.status === "sent").length;
    const failedCount = emailResults.filter(
      (r) => r.status === "failed",
    ).length;

    console.log(`\n📊 Email Results:`);
    console.log(`  ✅ Sent: ${sentCount}`);
    console.log(`  ❌ Failed: ${failedCount}`);
    console.log("========================================\n");

    return res.json({
      success: true,
      type: "email_results",
      status: "completed",
      data: {
        totalCandidates: shortlistedCandidates.length,
        sentCount,
        failedCount,
        results: emailResults,
      },
    });
  } catch (error) {
    console.log("\n" + "=".repeat(40));
    console.error("❌ EMAIL SENDING ERROR OCCURRED");
    console.error("Error Message:", error.message);
    console.error("Stack Trace:", error.stack);
    console.log("=".repeat(40) + "\n");

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
