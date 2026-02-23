import { z } from "zod";

type GeminiResult<T> = {
  data: T;
  rawText: string;
};

const MODEL = "gemini-2.5-flash";

function parseCandidateText(payload: unknown): string {
  const response = payload as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part) => part.text ?? "").join("\n").trim();
}

function parseJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(cleaned);
}

async function callGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${body}`);
  }

  const payload = (await response.json()) as unknown;
  const text = parseCandidateText(payload);

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

export async function generateStrictJson<T>(options: {
  prompt: string;
  schema: z.ZodType<T>;
  retryPrompt?: string;
}): Promise<GeminiResult<T>> {
  let latestRaw = "";
  let latestError: unknown;

  const prompts = [options.prompt, options.retryPrompt ?? `${options.prompt}\nReturn strict JSON only.`];

  for (const prompt of prompts) {
    try {
      latestRaw = await callGemini(prompt);
      const parsed = parseJson(latestRaw);
      const validated = options.schema.parse(parsed);
      return { data: validated, rawText: latestRaw };
    } catch (error) {
      latestError = error;
    }
  }

  throw latestError instanceof Error
    ? latestError
    : new Error(`Gemini JSON parse failed. Raw response: ${latestRaw.slice(0, 240)}`);
}
