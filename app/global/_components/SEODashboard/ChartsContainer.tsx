import CrawlBarChart from "./Charts/CrawlsBarChart";
import IndexingStatusChart from "./Charts/IndexingStatusChart";

function ChartsContainer() {
  return (
    <div className="w-full h-full text-white bg-red-500">
      <IndexingStatusChart />
      <CrawlBarChart />
    </div>
  );
}

export default ChartsContainer;
