import { createOllama } from "ollama-ai-provider";
import { StreamingTextResponse, streamText } from "ai";

const ollama = createOllama();
const apiUrl = "http://127.0.0.1:8080/hello";

// Async function to fetch the model from the Rust API server
async function fetchModel(): Promise<string> {
  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Rusty API Fetch Error: ${response.statusText}`);
    }

    // Read the response body as text
    const model = await response.text();
    return model;
  } catch (error) {
    console.error("Couldn't make the request:", error);
    throw error; // Rethrow the error for further handling
  }
}

// API route handler
export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    console.log("Received messages:", messages);

    // Fetch the model before processing the request
    const model = await fetchModel();

    console.log("The model selected is: ", model);

    // Process the request with the fetched model
    const stream = await streamText({
      // @ts-ignore
      model: ollama(model), // Use the fetched model string
      messages,
    });

    // Return the streaming response
    // @ts-ignore
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
