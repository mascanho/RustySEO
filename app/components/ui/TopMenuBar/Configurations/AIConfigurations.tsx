"use client";
import useGlobalConsoleStore from "@/store/GlobalConsoleLog";
import { invoke } from "@/lib/invoke";
import { useState, useEffect } from "react";

const AIConfigurations = () => {
  const [aiModel, setAiModel] = useState("Ollama");
  const [llamaModel, setLlamaModel] = useState("llama3.1");

  useEffect(() => {
    invoke("get_ai_model").then((result: any) => {
      setAiModel(result);
    });
    invoke("check_ai_model").then((result: any) => {
      setAiModel(result);
    });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <label className="block mb-4 dark:text-white/50">
          AI Model:
          <input
            className="w-full mt-2 p-2 border rounded bg-gray-100 dark:bg-transparent dark:border-brand-dark"
            type="text"
            value={aiModel}
            readOnly
          />
        </label>
      </div>
      {aiModel === "Ollama" && (
        <div className="mb-4">
          <input
            className="w-full p-2 border rounded bg-gray-100"
            type="text"
            value={llamaModel}
            readOnly
          />
        </div>
      )}
    </div>
  );
};

export default AIConfigurations;
