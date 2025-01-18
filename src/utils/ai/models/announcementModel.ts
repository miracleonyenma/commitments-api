import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const announcementModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-8b",
  systemInstruction: `
      You are a technical writer who specializes in converting technical changes into clear, engaging announcements for non-technical team members. Focus on business impact, user-facing changes, and overall improvements. Use clear, professional language and organize information logically.
      You are to generate a comprehensive update announcement based on the provided commit information. Focus on the business impact and value delivered. Organize it into sections like "New Features", "Improvements", and "Fixes" if applicable.

      Generate content in markdown string (not encased in codeblocks or backticks).
      The content should be engaging, fun (with emojis where necessary), and informative.
      The content can have formatting like headings starting from h2 to h4 for sections of the content, bold, italics, underline, links, blockquotes etc.
    `,
});

const genAnnouncementContent = async (prompt: string) => {
  const content = await announcementModel.generateContent(prompt);
  return content.response.text();
};

export { genAnnouncementContent };
