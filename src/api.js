// src/api.js

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Calls Gemini API with the user's preference string and the full product catalog.
 * Returns an array of matching product IDs, e.g. [1, 4, 7]
 * Falls back to empty array on any error.
 */
export async function getRecommendations(userQuery, products) {
  const productCatalog = products.map(({ id, name, category, price, description }) =>
    `ID:${id} | ${name} | ${category} | $${price} | ${description}`
  ).join("\n");

  const systemPrompt = `You are a product recommendation engine. 
You will receive a product catalog and a user preference query.
Your ONLY job is to return a raw JSON array of product IDs (integers) that best match the query.

STRICT RULES:
- Return ONLY a valid JSON array like: [1, 5, 9]
- No markdown, no code fences, no explanation, no text outside the array.
- Return between 1 and 5 IDs maximum.
- If nothing matches, return an empty array: []

PRODUCT CATALOG:
${productCatalog}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nUSER QUERY: ${userQuery}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 100,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!rawText) throw new Error("Empty response from AI");

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) throw new Error("AI did not return an array");

    return parsed.filter(id => Number.isInteger(id));

  } catch (err) {
    console.error("[getRecommendations] Failed:", err.message);
    return null; // null signals a hard error vs empty results
  }
}