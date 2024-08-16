import React, { useState } from "react";

const PopUpTable = ({ data }: any) => {
  const dummyData = [
    {
      date: "2024-08-01",
      clicks: 1245,
      impressions: 25678,
      ctr: 4.85,
      position: 12.3,
      queries: 587,
    },
    {
      date: "2024-08-02",
      clicks: 1378,
      impressions: 27456,
      ctr: 5.02,
      position: 11.8,
      queries: 612,
    },
    {
      date: "2024-08-03",
      clicks: 1156,
      impressions: 23987,
      ctr: 4.82,
      position: 12.5,
      queries: 549,
    },
    {
      date: "2024-08-04",
      clicks: 1489,
      impressions: 29765,
      ctr: 5.0,
      position: 11.6,
      queries: 635,
    },
    {
      date: "2024-08-05",
      clicks: 1312,
      impressions: 26543,
      ctr: 4.94,
      position: 12.1,
      queries: 598,
    },
    {
      date: "2024-08-06",
      clicks: 1423,
      impressions: 28976,
      ctr: 4.91,
      position: 11.9,
      queries: 621,
    },
    {
      date: "2024-08-07",
      clicks: 1267,
      impressions: 25234,
      ctr: 5.02,
      position: 12.2,
      queries: 573,
    },
    {
      date: "2024-08-08",
      clicks: 1534,
      impressions: 30123,
      ctr: 5.09,
      position: 11.5,
      queries: 649,
    },
    {
      date: "2024-08-09",
      clicks: 1398,
      impressions: 27865,
      ctr: 5.02,
      position: 11.7,
      queries: 608,
    },
    {
      date: "2024-08-10",
      clicks: 1289,
      impressions: 26098,
      ctr: 4.94,
      position: 12.0,
      queries: 582,
    },
  ];

  console.log(data, "From GSC bla bla bla");

  return (
    <section className="overflow-x-auto bg-white dark:bg-brand-darker p-0 rounded-lg text-xs">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-200 dark:bg-gray-700">
            <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
              Clicks
            </th>
            <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
              Impressions
            </th>
            <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
              CTR
            </th>
            <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-300">
              Position
            </th>
          </tr>
        </thead>
        <tbody>
          {dummyData.map((row: any, index: any) => (
            <tr
              key={index}
              className="border-b border-gray-200 dark:border-gray-700"
            >
              <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                {row.clicks.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                {row.impressions.toLocaleString()}
              </td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                {row.ctr.toFixed(2)}%
              </td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-300">
                {row.position.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* <footer className="mt-4 flex justify-between items-center"></footer> */}
    </section>
  );
};

export default PopUpTable;
