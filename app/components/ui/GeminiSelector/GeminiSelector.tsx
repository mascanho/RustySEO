import { invoke } from "@tauri-apps/api/tauri";
import React, { useState } from "react";
import { toast } from "sonner";
import { Select } from "@mantine/core";

const GeminiSelector = ({ closeGemini }: any) => {
  const [geminiModel, setGeminiModel] = useState("");
  const [prevSelected, setPrevSelected] = useState("");
  const [userInput, setUserInput] = useState("");

  const geminiModels = [{ value: "gemini-1.5-flash", label: "Gemini Flash" }];

  const handleGeminiSelect = (value: string | null) => {
    if (value) {
      setGeminiModel(value);
      setPrevSelected(value);
    }
  };

  const handleModelSelection = (model: string) => {
    // Implement logic to handle model selection
    console.log(`Selected model: ${model}`);
  };

  console.log(userInput);

  const handleAddApiKey: any = async (key: string) => {
    try {
      // Set the global AI Model
      const model = await invoke<{ success: boolean }>("ai_model_selected", {
        model: "gemini",
      });
      console.log(model, "This is the model");
      if (model) {
        console.log("Model selected successfully");
      }

      // Set the API key for the Gemini Model
      const result = await invoke<{ success: boolean }>("set_gemini_api_key", {
        key,
        apiType: "gemini",
        geminiModel,
      });
      console.log(result, "This is the result");
      if (result) {
        console.log("API key added successfully");
        toast("API key added successfully");
        // Perform any additional actions on success
      } else {
        console.log("Failed to add API key");
        // Handle the failure case
      }
    } catch (error) {
      console.error("Error adding API key:", error);
      // Handle the error (e.g., show an error message to the user)
    }
    closeGemini();
  };

  return (
    <div className="flex flex-col space-y-3 px-4 pb-4">
      <h2 className="dark:text-white">
        Paste your{" "}
        <a
          href="https://ai.google.dev"
          target="_blank"
          className="underline dark:text-white"
        >
          Google Gemini API key
        </a>
      </h2>
      <Select
        placeholder="Select Model"
        value={geminiModel}
        data={geminiModels}
        className="w-full dark:bg-brand-darker  dark:text-white"
        onChange={(e) => handleGeminiSelect(e)}
      />

      <input
        onChange={(e) => setUserInput(e.target.value)}
        type="password"
        name="pagespeed"
        className="border rounded-md py-1 dark:text-white px-2 dark:bg-brand-darker dark:border-white/30"
      />
      <button
        onClick={() => handleAddApiKey(userInput)}
        type="button"
        className="w-full flex items-center pt-1 h-9 justify-center font-semibold border bg-blue-500 text-white rounded-md dark:border-white/10"
      >
        Connect Model
      </button>
    </div>
  );
};

export default GeminiSelector;
