// @ts-nocheck
import { Select } from "@mantine/core";
import { invoke } from "@tauri-apps/api/tauri";
import React, { useEffect, useState } from "react";

const ollamaModels = [
  { name: "Llama-3.1", value: "llama3.1" },
  { name: "Mistral", value: "mistral" },
  { name: "Phi-3", value: "phi3" },
  { name: "Gemma 2", value: "gemma2" },
  { name: "Llama 2", value: "llama2" },
  { name: "CodeLlama", value: "codellama" },
  { name: "Orca Mini", value: "orca-mini" },
  { name: "Vicuna", value: "vicuna" },
  { name: "Nous-Hermes", value: "nous-hermes" },
  { name: "Wizard-Vicuna", value: "wizard-vicuna" },
];

const OllamaSelect = ({ closeOllama }: any) => {
  const [model, setModel] = useState("");
  const [prevSelected, setPrevSelected] = useState("");

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

    // Set the model in localstorage
    const model = e;
    localStorage.setItem("model", e);
  };

  useEffect(() => {
    // retrieve the model from localstorage
    const storedModel = localStorage.getItem("model");
    setPrevSelected(storedModel);
    setModel(storedModel || "");
  }, []);

  return (
    <section className="w-full h-full pb-3 overflow-hidden">
      <div className="p-4">
        <h2 className="font-semibold text-sm dark:text-white">
          To enhance your experience, you'll need to download Ollama.
        </h2>

        <ol className="text-sm mt-2 list-decimal list-inside dark:text-white">
          <li>
            Visit Ollama&apos;s Website:{" "}
            <a href="https://ollama.com" _target="_blank" className="underline">
              ollama.com
            </a>{" "}
            download page.
          </li>
          <li>
            Select Your Model: Choose the AI model that best fits your needs.
          </li>
          <li>
            Download and Install: Follow the installation instructions provided.
          </li>
          <li>Once installed you can select the model bellow.</li>
          <li>Restart the app.</li>
        </ol>
      </div>
      <div className="p-2 px-4">
        <Select
          label="Ollama AI Model"
          placeholder="Select Model"
          value={model}
          data={ollamaModels}
          className="w-full dark:bg-brand-darker hover:bg-red-500 dark:text-white"
          onChange={(e) => handleOllamaSelect(e)}
        />
      </div>

      <button
        disabled={!model}
        onClick={() => {
          handleModelSelection(model);
          closeOllama();
        }}
        type="button"
        className={`w-[96%] mx-auto flex justify-center mt-2 rounded-md  bg-blue-500 text-white px-3 py-1 ${!prevSelected && !model && "bg-gray-500"} cursor-pointer `}
      >
        Connect model
      </button>
    </section>
  );
};

export default OllamaSelect;
