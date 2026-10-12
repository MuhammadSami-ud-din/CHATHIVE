require('dotenv').config();
// const apiKey = process.env.GOOGLE_API_KEY
const {GoogleGenAI} = require("@google/genai");

const ai = new GoogleGenAI({apiKey :process.env.GOOGLE_API_KEY });

async function run(){
const interaction = await ai.interactions.create({
  model: "gemini-3.8-flash",
  input: "Explain how AI works in a few words",
});

console.log(interaction.output_text);
}

run().catch(console.error)
