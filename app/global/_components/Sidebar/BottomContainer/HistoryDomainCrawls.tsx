import React from "react";

const HistoryDomainCrawls = () => {
  const [expandedRows, setExpandedRows] = React.useState<number[]>([]);
  const crawlHistory = [
    {
      date: "2023-10-01",
      pagesCrawled: 120,
      errors: 5,
      website: "example1.com",
      details: "Detail 1",
      newLinksFound: 30,
      avgResponseTime: "200ms",
    },
    {
      date: "2023-10-02",
      pagesCrawled: 150,
      errors: 3,
      website: "example2.com",
      details: "Detail 2",
      newLinksFound: 45,
      avgResponseTime: "180ms",
    },
    {
      date: "2023-10-03",
      pagesCrawled: 130,
      errors: 4,
      website: "example3.com",
      details: "Detail 3",
      newLinksFound: 50,
      avgResponseTime: "220ms",
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
        <div className="text-xs bg-blue-100 to-white">
          <div className="flex justify-center space-x-20 px-2 py-1 ">
            <div>Date</div>
            <div>URLs</div>
            <div className="text-left">Errors</div>
          </div>
        </div>
        <div>
          {crawlHistory?.map((entry, index) => (
            <React.Fragment key={index}>
              <div
                onClick={() => handleRowClick(index)}
                className={`cursor-pointer px-2 flex py-1 justify-between ${index % 2 === 0 ? "bg-gray-100" : "bg-gray-200"}`}
              >
                <div>{entry.date}</div>
                <div>{entry.pagesCrawled}</div>
                <div>{entry.errors}</div>
              </div>
              {expandedRows.includes(index) && (
                <div className="bg-brand-bright/20 text-black px-2 py-2">
                  <div className="text-left">
                    <p>
                      <strong>Website:</strong> {entry.website}
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
