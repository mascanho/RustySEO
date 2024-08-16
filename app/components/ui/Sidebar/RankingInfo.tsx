import React, { useState, useEffect } from "react";

const RankingInfo = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<any | null>(null);

  const data = [
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

  useEffect(() => {
    if (data && data.length > 0) {
      setSelectedDate(data[0].date);
      setSelectedData(data[0]);
    }
  }, [data]);

  useEffect(() => {
    if (data && selectedDate) {
      const newSelectedData = data.find(
        (item: any) => item.date === selectedDate,
      );
      if (newSelectedData) {
        setSelectedData(newSelectedData);
      }
    }
  }, [selectedDate, data]);

  const InfoItem = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <div className="bg-blue-50 p-2 rounded">
      <div className="text-xs text-blue-600 font-medium">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );

  if (!data || data.length === 0 || !selectedData) {
    return <div>No data available</div>;
  }

  return (
    <div className="w-full bg-white rounded-lg overflow-hidden">
      <div className="p-4">
        <select
          value={selectedDate || ""}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full p-2 text-sm text-gray-700 bg-white rounded"
        >
          {data.map((item: any) => (
            <option key={item.date} value={item.date}>
              {item.date}
            </option>
          ))}
        </select>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoItem
            label="Clicks"
            value={selectedData.clicks.toLocaleString()}
          />
          <InfoItem
            label="Impressions"
            value={selectedData.impressions.toLocaleString()}
          />
          <InfoItem label="CTR" value={`${selectedData.ctr.toFixed(2)}%`} />
          <InfoItem label="Position" value={selectedData.position.toFixed(1)} />
          <InfoItem
            label="Queries"
            value={selectedData.queries.toLocaleString()}
          />
        </div>
      </div>
    </div>
  );
};

export default RankingInfo;
