import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import React from "react";
import { MdOutlineErrorOutline } from "react-icons/md";

const HistoryDomainCrawls = () => {
  const [expandedRows, setExpandedRows] = React.useState<number[]>([]);
  const { crawlData } = useGlobalCrawlStore();

  const crawlHistory = [
    {
      date: "2023-10-01",
      pagesCrawled: 120,
      errors: 5,
      website: "example1.com",
      details: "Detail 1",
      newLinksFound: 30,
      avgResponseTime: "200ms",
      totalJavascript: 700,
    },
  ];

  const handleRowClick = (index: number) => {
    const currentExpandedRows = [...expandedRows];
    const rowIndex = currentExpandedRows.indexOf(index);
    if (rowIndex >= 0) {
      currentExpandedRows.splice(rowIndex, 1);
    } else {
      currentExpandedRows.push(index);
    }
    setExpandedRows(currentExpandedRows);
  };

  return (
    <div className="text-xs px-">
      <div className="text-center">
        <div>
          {crawlHistory?.map((entry, index) => (
            <React.Fragment key={index}>
              <div
                onClick={() => handleRowClick(index)}
                className={`cursor-pointer px-2 flex mr-2 py-1 justify-between ${index % 2 === 0 ? "bg-gray-100 dark:bg-brand-dark" : "bg-gray-200 dark:bg-brand-darker"}`}
              >
                <div>{entry.date}</div>
                <div>{entry.pagesCrawled}</div>
                <div className="flex items-center space-x-2">
                  <span>
                    <MdOutlineErrorOutline className="mr-1 text-red-500" />
                  </span>
                  {entry.errors}
                </div>
              </div>
              {expandedRows.includes(index) && (
                <div className="bg-brand-bright/20 text-black dark:text-white/50 px-2 py-2">
                  <div className="text-left">
                    <p>
                      <strong>Website:</strong> {entry.website}
                    </p>
                    <p>
                      <strong>Pages Crawled:</strong> {entry.pagesCrawled}
                    </p>
                    <p>
                      <strong>Details:</strong> {entry.details}
                    </p>
                    <p>
                      <strong>New Links Found:</strong> {entry.newLinksFound}
                    </p>
                    <p>
                      <strong>Average Response Time:</strong>{" "}
                      {entry.avgResponseTime}
                    </p>
                    <p>
                      <strong>Javascript:</strong>
                      {""}
                      {entry.totalJavascript}
                    </p>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HistoryDomainCrawls;
