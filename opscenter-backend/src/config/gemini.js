import logger from "../middleware/logger.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash";

async function callGemini(model, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
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

// 503 = model temporarily overloaded on Google's own side ("spikes in demand are usually
// temporary"). Retry once on the same model, then fall back to a different model if that
// one's also saturated — different models are independently rate-limited/overloaded.
export const generateGeminiCompletion = async (prompt) => {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    try {
        return await callGemini(PRIMARY_MODEL, prompt);
    } catch (error) {
        if (error.status !== 503) {
            logger.error(`Gemini API error: ${error.status}`, error.body);
            throw error;
        }

        logger.warn(`Gemini ${PRIMARY_MODEL} overloaded (503), retrying once after 1.5s`);
        await new Promise((r) => setTimeout(r, 1500));
        try {
            return await callGemini(PRIMARY_MODEL, prompt);
        } catch (retryError) {
            if (retryError.status !== 503) {
                logger.error(`Gemini API error (after retry): ${retryError.status}`, retryError.body);
                throw retryError;
            }
            logger.warn(`Gemini ${PRIMARY_MODEL} still overloaded, falling back to ${FALLBACK_MODEL}`);
            try {
                return await callGemini(FALLBACK_MODEL, prompt);
            } catch (fallbackError) {
                logger.error(`Gemini API error (fallback model): ${fallbackError.status}`, fallbackError.body);
                throw fallbackError;
            }
        }
    }
};
