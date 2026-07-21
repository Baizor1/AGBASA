const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openrouter/free";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_NAME = "Agbasa";

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function paraphraseText(text: string): Promise<string> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": SITE_URL,
      "X-Title": SITE_NAME,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert paraphrasing assistant. Rewrite the given text while preserving its original meaning. Improve clarity, flow, and vocabulary. Provide ONLY the paraphrased version without any explanations, labels, or prefixes.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 0.5,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0].message.content.trim();
}

export async function detectPlagiarism(
  text: string,
  compareWith?: string
): Promise<{
  similarityScore: number;
  analysis: string;
  matches: { text: string; similarity: number }[];
}> {
  let systemPrompt: string;
  let userPrompt: string;

  if (compareWith) {
    systemPrompt =
      "You are a plagiarism detection expert. Analyze the two texts provided and produce a JSON output with the following fields:\n" +
      '- "similarityScore": a number from 0 to 100 indicating overall similarity,\n' +
      '- "analysis": a brief textual analysis of the comparison,\n' +
      '- "matches": an array of objects each with "text" (a phrase or sentence that matches) and "similarity" (0-100).\n' +
      "Return ONLY valid JSON without any markdown formatting or code fences.";

    userPrompt = `TEXT 1 (source):\n${compareWith}\n\nTEXT 2 (candidate):\n${text}\n\nCompare these texts for plagiarism.`;
  } else {
    systemPrompt =
      "You are a plagiarism detection expert. Analyze the given text for signs of plagiarism. " +
      "Look for unusual phrasing, inconsistent writing style, sudden vocabulary shifts, and other markers. " +
      "Produce a JSON output with the following fields:\n" +
      '- "similarityScore": a number from 0 to 100 indicating likelihood of plagiarism,\n' +
      '- "analysis": a brief textual analysis explaining the findings,\n' +
      '- "matches": an array of objects each with "text" (a suspicious segment) and "similarity" (0-100 indicating how likely it is plagiarized).\n' +
      "Return ONLY valid JSON without any markdown formatting or code fences.";

    userPrompt = `TEXT:\n${text}\n\nAnalyze this text for signs of plagiarism.`;
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": SITE_URL,
      "X-Title": SITE_NAME,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorBody}`);
  }

  const data: OpenRouterResponse = await response.json();
  const content = data.choices[0].message.content.trim();

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid response from plagiarism analysis");
  }

  return JSON.parse(jsonMatch[0]);
}
