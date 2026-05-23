const BASE_URL = process.env.LITELLM_BASE_URL ?? "http://localhost:4000";
const API_KEY = process.env.LITELLM_API_KEY ?? "";
const MODEL = process.env.LITELLM_MODEL ?? "smart";

export async function chatComplete(prompt: string, maxTokens = 200): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`AI gateway error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim();
}
