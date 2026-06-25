import logger from "../middleware/logger.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export const generateGeminiCompletion = async (prompt) => {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
        body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
    });

    if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        logger.error(`Gemini API error: ${res.status} ${res.statusText}`, errBody);
        throw new Error(`Gemini request failed: ${res.status}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response.";
};
