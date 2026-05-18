// src/api.js
export async function getRecommendations(userQuery, products) {
  const key = import.meta.env.VITE_OPENROUTER_API_KEY;

  const productCatalog = products.map(({ id, name, category, price, description }) =>
    `ID:${id} | ${name} | ${category} | $${price} | ${description}`
  ).join("\n");

  const prompt = `You are a product recommendation engine.
Return ONLY a raw JSON array of product IDs (integers) that match the user query.
No markdown, no explanation. Max 5 IDs. If nothing matches return [].

CATALOG:
${productCatalog}

USER QUERY: ${userQuery}`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "AI Recommender",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.2-3b-instruct:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const raw = data.choices?.[0]?.message?.content?.trim();
    const cleaned = raw.replace(/```json|```/gi, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) throw new Error("Not an array");
    return parsed.filter(id => Number.isInteger(id));

  } catch (err) {
    console.error("FULL ERROR:", err.message);
    return null;
  }
}