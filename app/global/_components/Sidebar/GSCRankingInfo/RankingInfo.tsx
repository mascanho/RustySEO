import { invoke } from "@tauri-apps/api/core";
import React, { useState, useEffect } from "react";
import RankingMenus from "../../Sidebar/../Sidebar/GSCRankingInfo/RankingInfo";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

interface MatchedDataItem {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface InstalledInfo {
  clientId: string;
  clientSecret: string;
}

const RankingInfo = () => {
  const [matchedData, setMatchedData] = useState<MatchedDataItem[] | null>(
    null,
  );
  const [credentials, setCredentials] = useState<InstalledInfo | null>(null);
  const { selectedTableURL } = useGlobalCrawlStore();

  // Fetch matched data when selectedTableURL changes
  useEffect(() => {
    const fetchMatchedData = async () => {
      try {
        const url = selectedTableURL?.[0]?.url;

        if (!url) {
          console.error("No URL found in selectedTableURL");
          setMatchedData(null);
          return;
        }

        console.log("Fetching data for URL:", url);

        const result: MatchedDataItem[] = await invoke("call_gsc_match_url", {
          url,
        });

        if (!result || result.length === 0) {
          console.error("No data returned from the backend");
          setMatchedData(null);
          return;
        }

        // Aggregate data
        const aggregatedData = result.reduce(
          (acc: MatchedDataItem[], current) => {
            const existing = acc.find((item) => item.query === current.query);
            if (existing) {
              existing.clicks += current.clicks;
              existing.impressions += current.impressions;
              existing.position =
                (existing.position * existing.impressions +
                  current.position * current.impressions) /
                (existing.impressions + current.impressions);
            } else {
              acc.push({ ...current });
            }
            return acc;
          },
          [],
        );

        setMatchedData(aggregatedData);
      } catch (error) {
        console.error("Error fetching matched data:", error);
        setMatchedData(null);
      }
    };

    fetchMatchedData();
  }, [selectedTableURL]); // Only run when selectedTableURL changes

  // Fetch credentials once on component mount
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const credentials = await invoke("get_search_console_credentials");
        setCredentials(credentials as InstalledInfo);
      } catch (error) {
        console.error("Error fetching credentials:", error);
      }
    };

    fetchCredentials();
  }, []); // Empty dependency array ensures this runs only once

  if (!matchedData || matchedData.length === 0) {
    return (
      <div className="w-full max-w-[400px] h-[28rem] flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full ranking-table max-w-full h-[calc(50rem-260px)] overflow-auto bg-brand-bright/5 dark:bg-transparent">
      <table className="w-full text-xs">
        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
          <tr>
            <th align="left" className="py-2 -ml-4 text-left text-[10px]">
              <span className="-ml-2">Queries</span>
            </th>
            <th className="py-2 text-center text-[10px]">Clicks</th>
            <th className="py-2 text-right text-[10px]">Imp.</th>
            <th className="py-2 text-center text-[10px] bg-brand-dark !important">
              Pos.
            </th>
          </tr>
        </thead>
        <tbody className="text-[9px]">
          {matchedData.map((item: MatchedDataItem, index: number) => (
            <tr
              key={index}
              className={`
                ${index % 1 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}
                transition-colors duration-150
              `}
            >
              <td className="py-2 pl-2 truncate text-[9px] max-w-[130px] overflow-hidden text-ellipsis">
                <RankingMenus
                  credentials={credentials}
                  url={selectedTableURL?.[0]?.url || ""}
                  query={item.query}
                  impressions={item.impressions}
                  clicks={item.clicks}
                  position={item.position}
                >
                  <span className="pointer hover:underline hover:text-brand-bright text-[10px] overflow-hidden text-ellipsis">
                    {item.query}
                  </span>
                </RankingMenus>
              </td>
              <td
                align="left"
                className="py-2 text-center text-brand-bright text-[9px]"
              >
                {item.clicks}
              </td>
              <td align="right" className="py-2 text-purple-500 text-[9px]">
                {item.impressions}
              </td>
              <td className="py-2 text-center text-blue-500 text-[9px]">
                {item.position.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingInfo;
