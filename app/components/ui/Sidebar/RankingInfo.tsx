import { invoke } from "@tauri-apps/api/tauri";
import React, { useState, useEffect } from "react";

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

  useEffect(() => {
    const handleUrlMatch = async (url: string) => {
      try {
        const result: MatchedDataItem[] = await invoke("call_gsc_match_url", {
          url,
        });
        console.log(result, "from the Ranking sidebar");

        const uniqueData = result.reduce((acc: MatchedDataItem[], current) => {
          const x = acc.find((item) => item.query === current.query);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

        setMatchedData(uniqueData);
      } catch (error) {
        console.error("Error fetching matched data:", error);
        setMatchedData(null);
      }
    };

    const url = sessionStorage.getItem("url");
    if (url) {
      handleUrlMatch(url);
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
    <div className="w-full ranking-table max-w-[23rem] rounded-lg h-[28rem] border-red-500 overflow-auto bg-white dark:bg-transparent shadow pr-2">
      <table className="w-full text-xs ">
        <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
          <tr>
            <th align="left" className="py-2 -ml-4 text-left">
              Queries
            </th>
            <th className="py-2 text-center">Clicks</th>
            <th className="py-2 text-right">Imp.</th>
            <th className="py-2 text-right">Pos.</th>
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
              <td className="py-2 pl-2 truncate text-[9px]">{item.query}</td>
              <td align="left" className="py-2 text-center">
                {item.clicks}
              </td>
              <td align="right" className="py-2">
                {item.impressions}
              </td>

              <td className="py-2 text-center">{item.position.toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingInfo;
