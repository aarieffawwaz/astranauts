const SYSTEM_PROMPT =
  "You are ARMOR AI, smart fleet operations assistant for PAMA mining. Answer concisely in the same language as the question.";

export async function askGemini(question) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    console.error("[Gemini] VITE_GEMINI_API_KEY is not set — did you restart Vite after editing .env?");
    throw new Error("Gemini API key missing");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: question }] }],
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error(`[Gemini] ${res.status} ${res.statusText}`, errBody);
    throw new Error(`Gemini request failed: ${res.status}`);
  }

  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Sorry, I couldn't generate a response."
  );
}
