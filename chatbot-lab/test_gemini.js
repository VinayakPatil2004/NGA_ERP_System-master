import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'backend', '.env') });

async function testGemini() {
    console.log("🔑 Checking GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "FOUND" : "NOT FOUND");
    if (!process.env.GEMINI_API_KEY) {
        console.error("❌ No API key found!");
        process.exit(1);
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log("🤖 Sending test generation query to gemini-2.5-flash...");
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Hello, respond with exactly "Gemini is connected!"',
        });
        console.log("📡 Response:", response.text);
        process.exit(0);
    } catch (err) {
        console.error("❌ Gemini Call Failed:", err);
        process.exit(1);
    }
}

testGemini();
