// @ts-nocheck
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Check } from "lucide-react";
import type { Ad } from "@/types/ad";

interface KeywordValidatorProps {
  validationResults: {
    valid: boolean;
    missingKeywords: string[];
  };
  adContent: Ad;
}

export function KeywordValidator({
  validationResults,
  adContent,
}: KeywordValidatorProps) {
  // If no keywords, show nothing
  if (!adContent.keywords.length) {
    return null;
  }

  if (validationResults.valid) {
    return (
      <Alert
        variant="default"
        className="bg-green-50 border-green-200 overflow-y-auto h-56 min-h-56"
      >
        <Check className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">
          All keywords are present
        </AlertTitle>
        <AlertDescription className="text-green-700">
          All of your keywords appear in your ad copy.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert
      variant="destructive"
      className="bg-red-50 border-red-200 overflow-y-auto h-56 min-h-56"
    >
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">Missing keywords</AlertTitle>
      <AlertDescription className="text-red-700">
        <p>The following keywords are missing from your ad copy:</p>
        <ul className="list-disc list-inside mt-1">
          {validationResults.missingKeywords.map((keyword, index) => (
            <li key={index}>{keyword}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
