import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to, subject, body) => {
  try {
    console.log("📧 SENDING EMAIL WITH NODEMAILER");
    console.log(`  To: ${to}`);
    console.log(`  Subject: ${subject}`);

    
    const mailOptions = {
        from: `"Kalvium Recruitment" <${process.env.SENDER_EMAIL}>`,
      to: to,
      subject: subject,
      text: body,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("  ✅ Nodemailer send successful:", info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("  ❌ Email sending failed:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const sendShortlistEmails = async (candidates, parsedData) => {
  const results = [];

  for (const candidate of candidates) {
    try {
      console.log(
        `\n📨 Sending shortlist email to ${candidate.name} (${candidate.email})...`,
      );

      const subject = `Congratulations! You've been shortlisted for ${parsedData.role}`;
      let body = `Congratulations on being shortlisted for the ${parsedData.role} position at Kalvium!\n\n`;

      body += `Your Profile Highlights:\n`;
      body += `• Position: ${parsedData.role}\n`;
      body += `• Experience: ${candidate.experience}\n`;
      body += `• Qualification: ${candidate.qualification}\n`;
      body += `• CGPA: ${candidate.cgpa}\n`;
      body += `• Skills: ${candidate.skills.join(", ")}\n`;
      body += `• Location: ${candidate.location}\n\n`;

      body += `Based on our review of your profile against our requirements:\n`;
      if (parsedData.skills && parsedData.skills.length) {
        body += `• Required Skills: ${parsedData.skills.join(", ")}\n`;
      }
      if (parsedData.experience) {
        body += `• Required Experience: ${parsedData.experience}\n`;
      }
      body += `\n`;

      body += `We are pleased to move you forward to the next stage of our hiring process.\n\n`;

      body += `Next Steps:\n`;
      body += `Please confirm your availability for the interview within the next 3 days.\n`;
      if (parsedData.interviewDate) {
        body += `Tentative Interview Date: ${parsedData.interviewDate}\n`;
      }
      if (parsedData.interviewMode) {
        body += `Interview Mode: ${parsedData.interviewMode}\n`;
      }
      if (parsedData.interviewLink) {
        body += `Interview Link: ${parsedData.interviewLink}\n`;
      }
      body += `\n`;

      body += `Please reply to this email to confirm your participation.\n`;
      if (parsedData.hrContact) {
        body += `For any queries, feel free to reach out to ${parsedData.hrContact}.\n`;
      }

      body += `\nWe look forward to learning more about you!\n\n`;
      body += `Best regards,\nKalvium Recruitment Team`;

      const result = await sendEmail(candidate.email, subject, body);

      results.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        email: candidate.email,
        status: result.success ? "sent" : "failed",
        message: result.success ? "Email sent successfully" : result.error,
        timestamp: result.timestamp,
      });

      console.log(`  ✅ Email sent to ${candidate.name}`);
    } catch (error) {
      console.error(
        `  ❌ Failed to send email to ${candidate.name}:`,
        error.message,
      );
      results.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        email: candidate.email,
        status: "failed",
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return results;
};
