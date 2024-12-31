import CodeBlock from "../CodeBlock";
import CodeBlockSchemaAI from "../CodeBlockSchemaAI";
import { FiCopy } from "react-icons/fi";
import { FiInfo } from "react-icons/fi";
import { useState } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PageSchemaAI = ({
  schema,
  AIschema,
}: {
  schema: string;
  AIschema: any;
}) => {
  const [showImprovements, setShowImprovements] = useState(false);

  const copyToClipboard = (text: string, placeholder: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${placeholder} to clipboard`);
  };

  // Extract just the improvements portion after "Improvements:"
  const geminiFeedback = AIschema.split("Improvements:")[1];

  // Extract schema portion before "Improvements:"
  const schemaContent = AIschema.split("Improvements:")[0];
  const cleanedAISchema = schemaContent.trim();
  // Remove the first line and extra newlines
  const schemaLines = cleanedAISchema.split("\n");
  const formattedAISchema = schemaLines
    .slice(1)
    .join("\n")
    .replace(/```/g, "")
    .trim();

  const formatFeedback = (feedback: string) => {
    if (!feedback) return null;

    const firstSentence = "The original JSON-LD had several issues.";
    const lastSentence =
      "These are RustySEO's recommendations to improve the JSON-LD before publishing";

    // Extract the middle content for numbered points
    const mainContent = feedback
      .replace(firstSentence, "")
      .replace(lastSentence, "")
      .split(".")
      .filter(Boolean)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    return (
      <div className="text-xs">
        <p className="mb-2">{firstSentence}</p>
        <ul className="list-none pl-4 space-y-1 mb-2">
          {mainContent.map((item, index) => (
            <li key={index} className="pb-1">
              <span className="font-bold text-blue-500">{index + 1}. </span>
              {item}.
            </li>
          ))}
        </ul>
        <p>{lastSentence}.</p>
      </div>
    );
  };

  return (
    <section className="h-fit aiSchema overflow-hidden">
      <section className="custom-scrollbar rounded-md h-full overflow-auto bg-white/40 dark:bg-brand-darker relative flex space-x-2  px-2 overflow-x-hidden">
        <div className="w-1/2 relative h-full flex items-center overflow-hidden m-auto">
          <div
            className={`absolute top-4 right-3 flex items-center gap-2 ${schema.trim().length === 0 ? "hidden" : ""}`}
          >
            <span className="text-xs bg-white rounded-md px-2">Current</span>
            <button
              onClick={() => copyToClipboard(schema, "current schema")}
              className="p-1 hover:bg-brand-bright rounded-md hover:text-white"
            >
              <FiCopy className="w-4 h-4 dark:text-white" />
            </button>
          </div>
          {schema?.trim().length === 0 ? (
            <div className="flex items-center justify-center h-full w-full rounded-md">
              <p className="text-center  text-sm text-black/50 dark:text-white/50 leading-8">
                No Schema found on this page. <br />
                RustySEO generated some JSON-LD for you.
              </p>
            </div>
          ) : (
            <CodeBlockSchemaAI code={schema} />
          )}
        </div>
        <div className="w-1/2 relative h-full">
          <div className="absolute top-4 right-3 flex items-center gap-2">
            <span className="text-xs bg-white rounded-md px-2">
              {schema.trim().length === 0 ? "Generated" : "Improved"}
            </span>
            <button
              onClick={() =>
                copyToClipboard(formattedAISchema, "improved schema")
              }
              className="p-1 hover:bg-brand-bright rounded-md hover:text-white"
            >
              <FiCopy className="w-4 h-4 dark:text-white hover:text-white " />
            </button>
          </div>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger onClick={() => {}} asChild>
                <button className="absolute bottom-3 right-3 p-1 hover:bg-brand-bright rounded-md hover:text-white">
                  <FiInfo className="w-4 h-4 dark:text-white" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                className="p-2 max-w-md h-[300px] overflow-y-auto custom-scrollbar mb-20"
              >
                {formatFeedback(geminiFeedback)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <CodeBlockSchemaAI code={formattedAISchema} />
        </div>
      </section>
    </section>
  );
};

export default PageSchemaAI;
