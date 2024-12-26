import { invoke } from "@tauri-apps/api/core";
import AnalyticsTable from "./AnalyticsTable";

const Analytics = ({}) => {
  const handleGetGoogleAnalytics = async () => {
    try {
      await invoke("get_google_analytics_command").then((result) => {
        console.log(result, "analytics result");
      });
    } catch (error) {
      console.error("Error fetching Google Analytics data:", error);
    }
  };
  return (
    <div className="overflow-hidden h-[10rem)] w-full ">
      <AnalyticsTable />
    </div>
  );
};

export default Analytics;
