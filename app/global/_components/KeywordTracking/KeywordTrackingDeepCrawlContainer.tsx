// @ts-nocheck
import { KeywordsTableDeep } from "./KeywordTrackingDeepTable";
import { StatsWidgets } from "./KeywordTrackingWidgets";

const KeywordTrackingDeepCrawlContainer = () => {
  return (
    <section className="px-2 h-full mt-1">
      <StatsWidgets />
      <KeywordsTableDeep />
    </section>
  );
};

export default KeywordTrackingDeepCrawlContainer;
