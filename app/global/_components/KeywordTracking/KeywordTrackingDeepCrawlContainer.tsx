// @ts-nocheck
import { StatsWidgets } from "@/app/components/ui/GscContainer/Widgets/WidgetsKeywordsContainer";
import { KeywordsTableDeep } from "./KeywordTrackingDeepTable";

const KeywordTrackingDeepCrawlContainer = () => {
  return (
    <section className="px-2 h-10 mt-1">
      <StatsWidgets />
      <KeywordsTableDeep />
    </section>
  );
};

export default KeywordTrackingDeepCrawlContainer;
