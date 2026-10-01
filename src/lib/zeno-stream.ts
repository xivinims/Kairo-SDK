import { buildZenoSystemPrompt, type ZenoMessage } from "./zeno-agent";

interface StreamZenoTextOptions {
  messages: ZenoMessage[];
  apiKey: string;
  model: string;
  onText: (text: string) => void;
}

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
}

export function buildThinkingPreview(text: string, maxCharacters = 10) {
  const clean = text
    .replace(/[*#_`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "…";
  const preview = clean.slice(0, maxCharacters);
  return `${preview}…`;
}

function parseSseEvent(event: string) {
  return event
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
}

export async function streamZenoText({
  messages,
  apiKey,
  model,
  onText,
}: StreamZenoTextOptions) {
  const latest = messages[messages.length - 1]?.content ?? "";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildZenoSystemPrompt(latest, "safe") }],
        },
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.65,
          topP: 0.95,
        },
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`gemini-${response.status}:${detail.slice(0, 180)}`);
  }

  if (!response.body) {
    throw new Error("stream-unavailable");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, "\n");
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";

    for (const event of events) {
      for (const payload of parseSseEvent(event)) {
        if (payload === "[DONE]") continue;

        let chunk: GeminiStreamChunk;
        try {
          chunk = JSON.parse(payload) as GeminiStreamChunk;
        } catch {
          continue;
        }

        const nextText =
          chunk.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("") ?? "";

        if (!nextText) continue;
        answer += nextText;
        onText(answer);
      }
    }
  }

  const tail = buffer.trim();
  if (tail) {
    for (const payload of parseSseEvent(tail)) {
      try {
        const chunk = JSON.parse(payload) as GeminiStreamChunk;
        const nextText =
          chunk.candidates?.[0]?.content?.parts
            ?.map((part) => part.text ?? "")
            .join("") ?? "";
        if (nextText) {
          answer += nextText;
          onText(answer);
        }
      } catch {
        // Ignore a trailing partial SSE event.
      }
    }
  }

  const finalText = answer.trim();
  if (!finalText) throw new Error("empty-stream");
  return finalText;
}
