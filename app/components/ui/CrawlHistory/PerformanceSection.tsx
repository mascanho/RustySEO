import { FaDesktop } from "react-icons/fa";
import { FaMobileAlt } from "react-icons/fa";

const PerformanceSection = ({ dbdata }: any) => {
  console.log(dbdata, "dbdata");

  return (
    <section className="rounded-md mt-4 overflow-hidden shadow border">
      <div className="h-[60rem] overflow-scroll">
        <table className="table_history w-full shadow">
          <thead>
            <tr>
              <th>Date</th>
              <th>Device</th>
              <th align="left">URL</th>
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
              <td align="left">{data?.url}</td>
              <td
                className={`${data?.performance <= 50 ? "text-red-600" : "text-green-600"}`}
              >
                {data?.performance}
              </td>
              <td
                className={`${data?.performance <= 50 ? "text-red-600" : "text-green-600"}`}
              >
                {data?.fcp}
              </td>
              <td>{data?.lcp}</td>
              <td>{data?.tti}</td>
              <td>{data?.cls}</td>
              <td>{data?.tbt}</td>
              <td>{data?.dom_size}</td>
            </tr>
          ))}
        </table>
      </div>
    </section>
  );
};

export default PerformanceSection;
