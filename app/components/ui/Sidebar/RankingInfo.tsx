import { invoke } from "@tauri-apps/api/tauri";
import React, { useState, useEffect } from "react";
import RankingMenus from "./RankingInfo/RankingMenus";

interface MatchedDataItem {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

const RankingInfo = ({ keywords }: { keywords: string[] }) => {
  const [matchedData, setMatchedData] = useState<MatchedDataItem[] | null>(
    null,
  );
  const [sessionUrl, setSessionUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleUrlMatch = async (url: string) => {
      try {
        const result: MatchedDataItem[] = await invoke("call_gsc_match_url", {
          url,
        });

        // Process the result to sum clicks, impressions, and average the position
        const aggregatedData = result.reduce(
          (acc: MatchedDataItem[], current) => {
            const existing = acc.find((item) => item.query === current.query);
            if (existing) {
              // Update existing item with summed clicks, impressions and weighted position
              existing.clicks += current.clicks;
              existing.impressions += current.impressions;
              existing.position =
                (existing.position * existing.impressions +
                  current.position * current.impressions) /
                (existing.impressions + current.impressions);
            } else {
              // Add new item if the query is not in the accumulator yet
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

    const url = sessionStorage.getItem("url");
    if (url) {
      handleUrlMatch(url);
      setSessionUrl(url);
    }
  }, [keywords]);

  if (!matchedData || matchedData.length === 0) {
    return (
      <div className="w-full max-w-[400px] h-[10rem] flex items-center justify-center text-gray-500">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full ranking-table max-w-[23rem] rounded-lg h-[28rem] overflow-auto bg-white dark:bg-transparent shadow pr-2">
      <table className="w-full text-xs ">
        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
          <tr>
            <th align="left" className="py-2 -ml-4 text-left text-[10px]">
              <span className="-ml-2">Queries</span>
            </th>
            <th className="py-2 text-center text-[10px]">Clicks</th>
            <th className="py-2 text-right text-[10px]">Imp.</th>
            <th className="py-2 text-center text-[10px] bg-brand-dark !important">
              Avg. Pos.
            </th>
          </tr>
        </thead>
        <tbody className="text-[9px] ">
          {matchedData.map((item: MatchedDataItem, index: number) => (
            <tr
              key={index}
              className={`
                ${index % 1 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"}
                hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors duration-150
              `}
            >
              <td className="py-2 pl-2 truncate text-[9px]">
                <RankingMenus url={sessionUrl} query={item.query}>
                  <span className="pointer hover:underline hover:text-brand-bright">
                    {item.query}
                  </span>
                </RankingMenus>
              </td>
              <td align="left" className="py-2 text-center text-brand-bright">
                {item.clicks}
              </td>
              <td align="right" className="py-2 text-purple-500">
                {item.impressions}
              </td>
              <td className="py-2 text-center">{item.position.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingInfo;
