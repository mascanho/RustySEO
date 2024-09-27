"use client";
import { invoke } from "@tauri-apps/api/tauri";
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
        <label className="block mb-2">
          AI Model:
          <input
            className="w-full p-2 border rounded bg-gray-100"
            type="text"
            value={aiModel}
            readOnly
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block mb-2">
          Llama Model:
          <select
            className={`w-full p-2 border rounded ${aiModel === "Gemini" ? "bg-gray-200" : ""}`}
            value={llamaModel}
            onChange={(e) => setLlamaModel(e.target.value)}
            disabled={aiModel === "Gemini"}
          >
            <option value="llama2">Llama 2</option>
            <option value="llama2-uncensored">Llama 2 Uncensored</option>
            <option value="codellama">Code Llama</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default AIConfigurations;
