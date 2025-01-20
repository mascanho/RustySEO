// @ts-nocheck
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";

interface ResultsDisplayProps {
  results: {
    keywords: string[];
    topics: string[];
  };
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Topic Modeling Results", 20, 20);

    doc.setFontSize(14);
    doc.text("Keywords:", 20, 40);
    results.keywords.forEach((keyword, index) => {
      doc.setFontSize(12);
      doc.text(`- ${keyword}`, 30, 50 + index * 10);
    });

    doc.setFontSize(14);
    doc.text("Topics:", 20, 60 + results.keywords.length * 10);
    results.topics.forEach((topic, index) => {
      doc.setFontSize(12);
      doc.text(
        `- ${topic}`,
        30,
        70 + results.keywords.length * 10 + index * 10,
      );
    });

    doc.save("topic_modeling_results.pdf");
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Keywords</h3>
        <ul className="list-disc pl-5">
          {results?.keywords.map((keyword, index) => (
            <li key={index}>{keyword}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold">Topics</h3>
        <ul className="list-disc pl-5">
          {results.topics.map((topic, index) => (
            <li key={index}>{topic}</li>
          ))}
        </ul>
      </div>
      <Button onClick={handleDownloadPDF}>Download Results as PDF</Button>
    </div>
  );
}
