import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing OpenAI API key. Set OPENAI_API_KEY environment variable.",
  );
}

export const client = new OpenAI({
  apiKey,
});
