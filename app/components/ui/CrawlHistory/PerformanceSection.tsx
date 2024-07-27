import { FaDesktop } from "react-icons/fa";
import { FaMobileAlt } from "react-icons/fa";

const PerformanceSection = ({ dbdata }: any) => {
  console.log(dbdata, "dbdata");

  return (
    <section className="rounded-md overflow-hidden mt-4 shadow border">
      <table className="table_history w-full shadow">
        <thead>
          <tr>
            <th>Date</th>
            <th>Device</th>
            <th>URL</th>
            <th>Performance</th>
            <th>FCP</th>
            <th>LCP</th>
            <th>TTI</th>
            <th>CLS</th>
            <th>TBT</th>
            <th>DOM</th>
          </tr>
        </thead>
        {Object?.values(dbdata)?.map((data: any, index: number) => (
          <tr className="w-full" key={index}>
            <td>{new Date(data?.date).toLocaleDateString()}</td>
            <td>{data?.strategy}</td>
            <td>{data?.url}</td>
            <td>{data?.performance}</td>
            <td>{data?.fcp}</td>
            <td>{data?.lcp}</td>
            <td>{data?.tti}</td>
            <td>{data?.cls}</td>
            <td>{data?.tbt}</td>
            <td>{data?.dom_size}</td>
          </tr>
        ))}
      </table>
    </section>
  );
};

export default PerformanceSection;
