import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { FaSpider } from "react-icons/fa6";

const iconType = {
  spider: <FaSpider className="text-sm text-brand-bright" />,
  crawler: "fa-robot",
};

const CrawlerType = () => {
  const { crawlerType } = useGlobalCrawlStore();

  return <div>{crawlerType === "spider" && iconType.spider}</div>;
};

export default CrawlerType;
