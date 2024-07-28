import { createOllama } from "ollama-ai-provider";
import { StreamingTextResponse, streamText, StreamData } from "ai";

const ollama = createOllama();

export async function POST(request: Request) {
  const { messages } = await request.json();

  console.log(messages);

  const result = await streamText({
    model: ollama("llama3"),
    messages,
  });

  return new StreamingTextResponse(result.toAIStream());
}
