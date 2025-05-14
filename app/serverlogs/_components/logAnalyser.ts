// src/utils/logAnalyzer.ts
export interface LogAnalysisResult {
  filename: string;
  summary: {
    errorCount: number;
    warningCount: number;
    infoCount: number;
    totalLines: number;
  };
  compressedContent: string;
  notableErrors: string[];
}

export async function analyzeLogChunk(
  content: string,
): Promise<Partial<LogAnalysisResult>> {
  const lines = content.split("\n");
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  const notableErrors: string[] = [];

  lines.forEach((line) => {
    if (line.match(/ERROR|ERR|FAILED|CRITICAL/i)) {
      errorCount++;
      if (line.length < 500) notableErrors.push(line); // Capture short error lines
    } else if (line.match(/WARN/i)) {
      warningCount++;
    } else if (line.match(/INFO/i)) {
      infoCount++;
    }
  });

  return {
    summary: {
      errorCount,
      warningCount,
      infoCount,
      totalLines: lines.length,
    },
    notableErrors,
  };
}

export function compressLogContent(content: string): string {
  // Simple compression - remove excess whitespace and duplicate empty lines
  return content.replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n");
}
