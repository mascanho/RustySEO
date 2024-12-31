import { toast } from "sonner";
import CodeBlock from "../CodeBlock";
import CodeBlockSchemaAI from "../CodeBlockSchemaAI";
import { FiCopy } from "react-icons/fi";

const PageSchemaAI = ({
  schema,
  AIschema,
}: {
  schema: string;
  AIschema: any;
}) => {
  const copyToClipboard = (text: string, placeholder: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${placeholder} to clipboard`);
  };

  // Extract just the schema portion before "Improvements:"
  const schemaContent = AIschema.split("**Improvements:**")[0];
  const cleanedAISchema = schemaContent.trim();
  // Remove the first line and extra newlines
  const schemaLines = cleanedAISchema.split("\n");
  const formattedAISchema = schemaLines
    .slice(1)
    .join("\n")
    .replace(/```/g, "")
    .trim();

  console.log(schemaContent, "this is the schema content");

  return (
    <section className="h-fit aiSchema overflow-x-hidden">
      <section className="custom-scrollbar rounded-md overflow-auto bg-white/40 dark:bg-brand-darker relative flex space-x-2 mt-1 px-2 overflow-x-hidden">
        <div className="w-1/2 relative">
          <div className="absolute top-4 right-3 flex items-center gap-2">
            <span className="text-xs bg-white rounded-md px-2">Current</span>
            <button
              onClick={() => copyToClipboard(schema, "current schema")}
              className="p-1 hover:bg-brand-bright rounded-md hover:text-white"
            >
              <FiCopy className="w-4 h-4 dark:text-white" />
            </button>
          </div>
          <CodeBlockSchemaAI code={schema} />
        </div>
        <div className="w-1/2 relative">
          <div className="absolute top-4 right-3 flex items-center gap-2">
            <span className="text-xs bg-white rounded-md px-2">Improved</span>
            <button
              onClick={() =>
                copyToClipboard(formattedAISchema, "improved schema")
              }
              className="p-1 hover:bg-brand-bright rounded-md hover:text-white"
            >
              <FiCopy className="w-4 h-4 dark:text-white hover:text-white " />
            </button>
          </div>
          <CodeBlockSchemaAI code={formattedAISchema} />
        </div>
      </section>
    </section>
  );
};

export default PageSchemaAI;
