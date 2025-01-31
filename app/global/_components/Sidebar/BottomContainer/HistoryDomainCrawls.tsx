const HistoryDomainCrawls = () => {
  const crawlHistory = [
    { date: "2023-10-01", pagesCrawled: 120, errors: 5 },
    { date: "2023-10-02", pagesCrawled: 150, errors: 3 },
    { date: "2023-10-03", pagesCrawled: 130, errors: 4 },
  ];

  return (
    <div>
      <table className="text-center">
        <thead className="text-xs">
          <tr>
            <th>Date</th>
            <th>Pages Crawled</th>
            <th className="text-left">Errors</th>
          </tr>
        </thead>
        <tbody>
          {crawlHistory?.map((entry, index) => (
            <tr key={index}>
              <td>{entry.date}</td>
              <td>{entry.pagesCrawled}</td>
              <td>{entry.errors}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryDomainCrawls;
