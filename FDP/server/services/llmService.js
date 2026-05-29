import { client } from "../utils/openaiClient.js";
import { SYSTEM_PROMPT } from "../prompts/systemPrompt.js";

const normalizeOpenAIJson = (text) => {
  try {
    if (!text) return null;

    let normalized = text.trim();

  
    if (normalized.startsWith("```")) {
      normalized = normalized
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, "");
    }

 
    if (normalized.startsWith('"') && normalized.endsWith('"')) {
      try {
        normalized = JSON.parse(normalized);
      } catch (e) {
        console.warn("String JSON parse failed, using raw string");
      }
    }

    return normalized;
  } catch (error) {
    console.error("normalizeOpenAIJson error:", error);
    return null;
  }
};

export const analyzeConversation = async (messages) => {
  if (!messages || !Array.isArray(messages)) {
    throw new Error("Messages must be a non-empty array");
  }

  const formattedMessages = messages.map((msg) => {
    if (!msg || !msg.role || !msg.content) {
      throw new Error("Each message must have 'role' and 'content' properties");
    }
    return {
      role: msg.role,
      content: msg.content,
    };
  });

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",

    response_format: {
      type: "json_object",
    },

    temperature: 0,

    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...formattedMessages,
    ],
  });

  console.log("  📡 OpenAI Response Received");
  console.log("  🔹 Choices count:", response.choices?.length);
  console.log("  🔹 First message:", response.choices?.[0]?.message);

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned empty response");
  }

  console.log("  📝 Raw AI Response:", content);

  const normalized = normalizeOpenAIJson(content);

  if (typeof normalized !== "string") {
    console.log("  ✅ Successfully parsed object directly:", normalized);
    return normalized;
  }

  try {
    const parsed = JSON.parse(normalized);
    console.log("  ✅ Successfully parsed JSON:", parsed);
    return parsed;
  } catch (parseError) {
    console.error("  ❌ JSON parse failed. Raw content:", normalized);
    throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
  }
};

export const createEmailPreview = (parsed) => {
  const role = parsed.role || "candidate";
  const subjectMap = {
    shortlist_candidates: `Candidate shortlist update for ${role}`,
    send_interview_email: `Interview invitation for ${role}`,
    send_selection_email: `Selection update for ${role}`,
    send_second_round_email: `Second round interview invitation for ${role}`,
    send_assignment_email: `Assignment details for ${role}`,
    send_hr_followup_email: `HR follow-up for ${role}`,
    send_onboarding_email: `Onboarding next steps for ${role}`,
  };

  const subject = subjectMap[parsed.action] || `Recruitment update for ${role}`;
  const assignmentLink =
    parsed.assignmentLink ||
    parsed.assignment_link ||
    parsed.assignmentUrl ||
    parsed.assignmentURL ||
    parsed.assignment ||
    parsed.link;
  const interviewLink =
    parsed.interviewLink ||
    parsed.interview_link ||
    parsed.meetLink ||
    parsed.googleMeetLink ||
    parsed.interviewURL ||
    parsed.interviewUrl;

  let body = "";

  if (parsed.action === "send_interview_email") {
    body += `We are excited to invite you to interview for the ${role} role.`;
    if (parsed.interviewRound) {
      body += ` This is for the ${parsed.interviewRound} round.`;
    }
    if (parsed.interviewDate) {
      body += ` The interview is scheduled for ${parsed.interviewDate}.`;
    }
    if (parsed.interviewMode) {
      body += ` The interview mode is ${parsed.interviewMode}.`;
    }
    if (interviewLink) {
      body += ` You can join the interview here: ${interviewLink}.`;
    }
    if (parsed.hrContact) {
      body += ` If you have any questions, please contact ${parsed.hrContact}.`;
    }
    body += `\n\nPlease confirm your availability at your earliest convenience.`;
  } else if (parsed.action === "send_selection_email") {
    body += `Congratulations! You have been selected to move forward in the hiring process for the ${role} role.`;
    body += ` We will share next steps shortly.`;
  } else if (parsed.action === "send_second_round_email") {
    body += `Great news — you have been shortlisted for the second round for the ${role} position.`;
    body += ` We will communicate the next interview details soon.`;
  } else if (parsed.action === "send_assignment_email") {
    body += `Please find the assignment details for the ${role} role below.`;
    if (assignmentLink) {
      body += ` You can access the assignment here: ${assignmentLink}.`;
    }
    if (parsed.assignmentDeadline) {
      body += ` Please submit by ${parsed.assignmentDeadline}.`;
    }
    body += `\n\nKindly complete the assignment and submit it by the deadline.`;
  } else if (parsed.action === "send_hr_followup_email") {
    body += `This is a quick follow-up from our HR team regarding your ${role} application.`;
    body += ` We will connect with you shortly with more details.`;
  } else if (parsed.action === "send_onboarding_email") {
    body += `Welcome aboard! Here are the next steps for onboarding into the ${role} role.`;
    body += ` We look forward to welcoming you to the team.`;
  } else if (parsed.action === "shortlist_candidates") {
    body += `We have reviewed the candidate requirements for the ${role} role and are moving forward with shortlisting.`;
    if (parsed.skills && parsed.skills.length) {
      body += ` The required skills include: ${parsed.skills.join(", ")}.`;
    }
    if (parsed.experience) {
      body += ` Desired experience is ${parsed.experience}.`;
    }
    body += `\n\nPlease confirm if you would like to proceed with these shortlisted candidates.`;
  } else {
    body += `This email contains an update about the ${role} role.`;
  }

  if (parsed.providedEmails && parsed.providedEmails.length) {
    body += `\n\nThis preview will be sent to: ${parsed.providedEmails.join(", ")}.`;
  }

  body += `\n\nThank you for your time.`;

  return {
    subject,
    greeting: "Dear Candidate,",
    body,
    closing: `Best regards,\nKalvium Recruitment Team`,
  };
};

export const createShortlistEmailForCandidate = (candidate, parsed) => {
  const role = parsed.role || "candidate";
  const subject = `Congratulations! You've been shortlisted for ${role}`;

  let body = `Congratulations on being shortlisted for the ${role} position at Kalvium!\n\n`;

  body += `Your Profile Highlights:\n`;
  body += `• Position: ${role}\n`;
  body += `• Experience: ${candidate.experience}\n`;
  body += `• Qualification: ${candidate.qualification}\n`;
  body += `• CGPA: ${candidate.cgpa}\n`;
  body += `• Skills: ${candidate.skills.join(", ")}\n`;
  body += `• Location: ${candidate.location}\n\n`;

  body += `Based on our review of your profile against our requirements:\n`;
  if (parsed.skills && parsed.skills.length) {
    body += `• Required Skills: ${parsed.skills.join(", ")}\n`;
  }
  if (parsed.experience) {
    body += `• Required Experience: ${parsed.experience}\n`;
  }
  body += `\n`;

  body += `We are pleased to move you forward to the next stage of our hiring process.\n\n`;

  body += `Next Steps:\n`;
  body += `Please confirm your availability for the interview within the next 3 days.\n`;
  if (parsed.interviewDate) {
    body += `Tentative Interview Date: ${parsed.interviewDate}\n`;
  }
  if (parsed.interviewMode) {
    body += `Interview Mode: ${parsed.interviewMode}\n`;
  }
  if (parsed.interviewLink) {
    body += `Interview Link: ${parsed.interviewLink}\n`;
  }
  body += `\n`;

  body += `Please reply to this email to confirm your participation.\n`;
  if (parsed.hrContact) {
    body += `For any queries, feel free to reach out to ${parsed.hrContact}.\n`;
  }

  body += `\nWe look forward to learning more about you!\n`;

  return {
    subject,
    greeting: `Dear ${candidate.name},`,
    body,
    closing: `Best regards,\nKalvium Recruitment Team`,
    candidateEmail: candidate.email,
  };
};

export const rankCandidatesWithAI = async (parsed, candidates) => {
  console.log("  🤖 OpenAI API Call - Ranking Candidates");
  console.log("  🔹 Candidates to rank:", candidates.length);

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",

    messages: [
      {
        role: "system",
        content:
          "You are an AI recruitment ranking engine. Analyze candidates and return a JSON array with rankings.",
      },
      {
        role: "user",
        content: `
Hiring Requirements:
${JSON.stringify(parsed)}

Candidates:
${JSON.stringify(candidates)}

Rank candidates based on:
- skills
- experience
- qualification
- cgpa
- location

Return ONLY valid JSON array with no markdown or extra text. Example format:

[
  {
    "id": 1,
    "score": 91,
    "reason": "Strong React skills and excellent CGPA"
  }
]
`,
      },
    ],
  });

  console.log("  📡 OpenAI Ranking Response Received");
  const rankingContent = response.choices[0].message.content;
  console.log("  📝 Raw Ranking Response:", rankingContent);

  const normalized = normalizeOpenAIJson(rankingContent);

  try {
    const rankedResult = JSON.parse(normalized);
    console.log("  ✅ Successfully parsed ranking result");
    return rankedResult;
  } catch (parseError) {
    console.error("  ❌ JSON parse failed. Raw content:", normalized);
    throw new Error(`Failed to parse ranking response: ${parseError.message}`);
  }
};
