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
    console.log("\n========================================");
    console.log("📨 WORKFLOW REQUEST RECEIVED");
    console.log("========================================");
    console.log("🔹 Time:", new Date().toISOString());

    const { messages } = req.body;
    console.log("🔹 Messages received:", JSON.stringify(messages, null, 2));

    if (!messages || !Array.isArray(messages)) {
      console.error("❌ VALIDATION FAILED: Messages must be an array");
      return res.status(400).json({
        success: false,
        error: "Invalid request. 'messages' must be an array.",
      });
    }

    console.log("✅ Validation passed - messages is valid array\n");

    console.log("🔄 STEP 1: Analyzing conversation with AI...");
    const aiResult = await analyzeConversation(messages);
    console.log("✅ STEP 1 COMPLETED");
    console.log("📝 AI Analysis Result:", JSON.stringify(aiResult, null, 2));

    if (aiResult.needsClarification) {
      console.log("\n⚠️  CLARIFICATION NEEDED");
      console.log("❓ Question:", aiResult.question);
      console.log(
        "💡 Possible Interpretation:",
        aiResult.possibleInterpretation,
      );
      console.log("📤 Sending clarification response to client...\n");
      return res.json({
        success: true,
        type: "clarification",
        data: {
          question: aiResult.question,
          possibleInterpretation: aiResult.possibleInterpretation || null,
        },
      });
    }

    console.log(
      "✅ No clarification needed - validation indicates preview can be generated\n",
    );

    const preview = createEmailPreview(aiResult);

    console.log("🔄 STEP 2: Preview generation complete");
    console.log("📤 Sending preview-ready response to client...\n");

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
      console.error("❌ VALIDATION FAILED: parsedData must be an object");
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

    console.log("🔄 STEP 3: Ranking candidates with AI...");
    const rankedCandidates = await rankCandidatesWithAI(
      parsedData,
      executionCandidates,
    );
    console.log("✅ STEP 3 COMPLETED");

    // Merge ranked results with full candidate details
    const enrichedCandidates = rankedCandidates.map((rankedItem) => {
      const candidateDetails = executionCandidates.find(
        (c) => c.id === rankedItem.id,
      );

      return {
        ...candidateDetails,
        score: rankedItem.score,
        reason: rankedItem.reason,
        status: "pending", // Email status starts as pending
      };
    });

    console.log("✅ Enriched candidates with full details and ranking scores");

    let finalCandidates = [...enrichedCandidates];
    if (enrichedCandidates.length > 0) {
      console.log(`\n🔄 Automatically sending emails to ${enrichedCandidates.length} matching candidate(s)...`);
      logs.push(createLogEntry(`Automatically sending emails to ${enrichedCandidates.length} candidate(s)...`));
      
      const emailResults = await sendShortlistEmails(enrichedCandidates, parsedData);
      
      finalCandidates = enrichedCandidates.map(candidate => {
        const result = emailResults.find(r => r.candidateId === candidate.id);
        return {
          ...candidate,
          status: result ? result.status : "failed",
          error: result ? result.message : "Not processed",
        };
      });

      const sentCount = emailResults.filter((r) => r.status === "sent").length;
      const failedCount = emailResults.filter((r) => r.status === "failed").length;

      logs.push(createLogEntry(`Email sending finished: ${sentCount} sent successfully, ${failedCount} failed.`));
      console.log(`✅ Email sending complete: ${sentCount} sent, ${failedCount} failed.`);
    } else {
      console.log("⚠️ No matching candidates to send emails to.");
      logs.push(createLogEntry("No matching candidates to send emails to."));
    }

    console.log("\n✅ WORKFLOW EXECUTION SUCCESSFUL");
    console.log("📤 Sending execution response to client...");
    console.log("========================================\n");

    return res.json({
      success: true,
      type: "execution",
      status: "completed",
      data: {
        parsed: parsedData,
      },
      candidates: finalCandidates,
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
