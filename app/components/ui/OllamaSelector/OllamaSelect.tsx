// @ts-nocheck
import { Select } from "@mantine/core";
import { invoke } from "@tauri-apps/api/tauri";
import React, { useState } from "react";

const ollamaModels = [
  {
    name: "Llama3",
    value: "llama3",
  },
  {
    name: "CodeLlama",
    value: "codellama",
  },
  {
    name: "Mistral",
    value: "mistral",
  },
  {
    name: "Mixtral",
    value: "mixtral",
  },
  {
    name: "Phi-2",
    value: "phi",
  },
  {
    name: "Orca 2",
    value: "orca2",
  },
  {
    name: "Vicuna",
    value: "vicuna",
  },
  {
    name: "Starling-LM",
    value: "starling-lm",
  },
  {
    name: "Neural Chat",
    value: "neural-chat",
  },
  {
    name: "Stable Beluga",
    value: "stable-beluga",
  },
];

const OllamaSelect = ({ closeOllama }: any) => {
  const [model, setModel] = useState("");

  const handleModelSelection = async (model: any) => {
    try {
      // Call the Tauri command with the model parameter
      const result = await invoke("write_model_to_disk", { model });
      console.log("Model saved to:", result);
      setModel(model);
    } catch (error) {
      console.error("Failed to save model:", error);
    }
  };

  const handleOllamaSelect = (e: any) => {
    setModel(e);
  };

  return (
    <section className="w-full h-full pb-5 overflow-hidden">
      <div className="p-2">
        <h2 className="font-semibold text-sm">
          To enhance your experience, you’ll need to download an AI model from
          Ollama.
        </h2>

        <ol className="text-sm mt-2 list-decimal list-inside">
          <li>
            Visit Ollama&apos;s Website:{" "}
            <span className="underline">ollama.com</span> download page.
          </li>
          <li>
            Select Your Model: Choose the AI model that best fits your needs.
          </li>
          <li>
            Download and Install: Follow the installation instructions provided.
          </li>
          <li>Once installed you can select the model bellow.</li>
        </ol>
      </div>
      <div className="p-2">
        <Select
          label="Ollama AI Model"
          placeholder="Select Model"
          defaultValue="llama2"
          data={ollamaModels}
          className="w-full"
          onChange={(e) => handleOllamaSelect(e)}
        />
      </div>

      <button
        onClick={() => {
          handleModelSelection(model);
          closeOllama();
        }}
        type="button"
        className="w-[96%] mx-auto flex justify-center mt-2 rounded-md  bg-blue-500 text-white px-3 py-1"
      >
        Connect model
      </button>
    </section>
  );
};

export default OllamaSelect;
