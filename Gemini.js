require('dotenv').config();
// const apiKey = process.env.GOOGLE_API_KEY
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

async function run(message) {
    const structuredPrompt = `
    You are a helpful assistant. Answer the user's question clearly.
    Formatting rules:
    - DO NOT use markdown headings like ## or ###.
    - Use clean paragraph spacing with blank lines between ideas.
    - Use simple bullet points  for lists or steps.
    - Use bold text  sparingly for key terms.
    
    User Question: ${message}
  `;

    const interaction = await ai.interactions.create({
        model: "gemini-3.1-flash-lite",
        input: structuredPrompt,
  
    });

    return interaction.output_text;
}

module.exports = { run }

