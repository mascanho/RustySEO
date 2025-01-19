"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import URLInput from "./URLInput";
import StopWordsInput from "./StopWordsInput";
import SelectorInput from "./SelectorInput";
import ResultsDisplay from "./ResultsDisplay";
import SummarySidebar from "./SummarySidebar";
import { performTopicModeling } from "../utils/topicModeling";

interface FileInfo {
  name: string;
  type: string;
}

export default function TopicModeling() {
  const [urls, setUrls] = useState<string[]>([]);
  const [stopWords, setStopWords] = useState<string[]>([]);
  const [results, setResults] = useState<{
    keywords: string[];
    topics: string[];
  } | null>(null);
  const [selectorType, setSelectorType] = useState<string>("class");
  const [selectors, setSelectors] = useState<string[]>([]);
  const [urlFileInfo, setUrlFileInfo] = useState<FileInfo | null>(null);
  const [stopWordsFileInfo, setStopWordsFileInfo] = useState<FileInfo | null>(
    null,
  );

  const handleModelingClick = async () => {
    const modelingResults = await performTopicModeling(
      urls,
      stopWords,
      selectorType,
      selectors,
    );
    setResults(modelingResults);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Topic Modeling Tool</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-md bg-white h-full ">
          <CardHeader>
            <CardTitle>Input Form</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <URLInput
              urls={urls}
              setUrls={setUrls}
              setFileInfo={setUrlFileInfo}
            />
            <StopWordsInput
              stopWords={stopWords}
              setStopWords={setStopWords}
              setFileInfo={setStopWordsFileInfo}
            />
            <div className="flex space-x-4">
              <div className="flex-1">
                <label htmlFor="selector" className="text-sm font-medium">
                  Select Selector Type
                </label>
                <Select
                  onValueChange={(value) => {
                    setSelectorType(value);
                    setSelectors([]);
                  }}
                  defaultValue={selectorType}
                >
                  <SelectTrigger id="selector">
                    <SelectValue placeholder="Select a selector type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">CSS Class</SelectItem>
                    <SelectItem value="id">ID</SelectItem>
                    <SelectItem value="tag">HTML Tag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <SelectorInput
                  selectorType={selectorType}
                  selectors={selectors}
                  setSelectors={setSelectors}
                />
              </div>
            </div>
            <Button onClick={handleModelingClick}>
              Perform Topic Modeling
            </Button>
          </CardContent>
        </section>
        <div className="lg:col-span-1">
          <SummarySidebar
            urls={urls}
            stopWords={stopWords}
            selectorType={selectorType}
            selectors={selectors}
            urlFileInfo={urlFileInfo}
            stopWordsFileInfo={stopWordsFileInfo}
          />
        </div>
      </div>
      {results && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultsDisplay results={results} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
