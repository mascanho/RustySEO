import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SummarySidebarProps {
  urls: string[];
  pages: string[];
  stopWords: string[];
  selectorType: string;
  selectors: string[];
  urlFileInfo: { name: string; type: string } | null;
  stopWordsFileInfo: { name: string; type: string } | null;
}

export default function SummarySidebar({
  urls,
  pages,
  stopWords,
  selectorType,
  selectors,
  urlFileInfo,
  stopWordsFileInfo,
}: SummarySidebarProps) {
  return (
    <section className="h-[450px] overflow-auto rounded-md bg-white w-full">
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-6">
        <div>
          <h3 className="font-semibold mb-2">URLs</h3>
          <div className="flex flex-wrap gap-2">
            {urls &&
              urls.map((url, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {url}
                </Badge>
              ))}
          </div>
          <h3 className="mt-2 font-semibold mb-2">Pages</h3>
          <div className="flex flex-wrap gap-2">
            {pages &&
              pages.map((page, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {page}
                </Badge>
              ))}
          </div>{" "}
          {urlFileInfo && (
            <p className="text-sm mt-2">
              Uploaded file: {urlFileInfo.name} ({urlFileInfo.type})
            </p>
          )}
        </div>
        <div>
          <h3 className="font-semibold mb-2">Stop Words</h3>
          <div className="flex flex-wrap gap-2">
            {stopWords &&
              stopWords.map((word, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {word}
                </Badge>
              ))}
          </div>
          {stopWordsFileInfo && (
            <p className="text-sm mt-2">
              Uploaded file: {stopWordsFileInfo.name} ({stopWordsFileInfo.type})
            </p>
          )}
        </div>
        <div>
          <h3 className="font-semibold mb-2">Selector Type</h3>
          <Badge variant="secondary" className="text-xs">
            {selectorType}
          </Badge>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Selectors</h3>
          <div className="flex flex-wrap gap-2">
            {selectors &&
              selectors.map((selector, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {selector}
                </Badge>
              ))}
          </div>
        </div>
      </CardContent>
    </section>
  );
}
