// @ts-nocheck
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";
import { invoke } from "@tauri-apps/api/core";
import React, { useEffect } from "react";
import { MdOutlineErrorOutline } from "react-icons/md";

const HistoryDomainCrawls = () => {
  const [expandedRows, setExpandedRows] = React.useState<number[]>([]);
  const { crawlData, domainCrawlLoading } = useGlobalCrawlStore();

  useEffect(() => {
    try {
      // Ensure the table exists (idempotent operation)
      invoke("create_domain_results_table");
      console.log("Table created or already exists");
    } catch (error) {
      console.error("Error creating table:", error);
    }
  }, []); // runs once when the component mounts

  useEffect(() => {
    // Fetch data from the database
    const fetchData = async () => {
      try {
        // Read data from the table
        const result = await invoke("read_domain_results_history_table");
        console.log("Data fetched successfully:", result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []); // needs to run everytime the crawl finishes

  const crawlHistory = [
    {
      id: 1,
      domain: crawlData?.[0]?.url || "",
      date: new Date().toISOString().split("T")[0],
      pages: crawlData?.length,
      errors: 5,
      status: "completed",
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

  // ADD THE DATA TO THE DB
  useEffect(() => {
    const createHistory = async () => {
      try {
        const result = await invoke("create_domain_results_history", {
          data: crawlHistory,
        });
        console.log(result);
      } catch (error) {
        console.error("Error creating domain results history:", error);
      }
    };

    if (crawlData.length === 0) {
      return;
    } else {
      createHistory();
    }
  }, [domainCrawlLoading]);

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
