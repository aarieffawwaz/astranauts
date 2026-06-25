import logger from "../middleware/logger.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

async function callGemini(prompt) {
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
        const error = new Error(`Gemini request failed: ${res.status}`);
        error.status = res.status;
        error.body = errBody;
        throw error;
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response.";
}

export const generateGeminiCompletion = async (prompt) => {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    try {
        return await callGemini(prompt);
    } catch (error) {
        // 503 = model temporarily overloaded on Google's side, per their own error message — worth one retry.
        if (error.status === 503) {
            logger.warn("Gemini overloaded (503), retrying once after 1.5s");
            await new Promise((r) => setTimeout(r, 1500));
            try {
                return await callGemini(prompt);
            } catch (retryError) {
                logger.error(`Gemini API error (after retry): ${retryError.status}`, retryError.body);
                throw retryError;
            }
        }
        logger.error(`Gemini API error: ${error.status}`, error.body);
        throw error;
    }
};
