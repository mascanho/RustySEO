import { invoke } from "@tauri-apps/api/tauri";
import AnalyticsTable from "./AnalyticsTable";

const Analytics = ({}) => {
  const handleGetGoogleAnalytics = async () => {
    try {
      await invoke("get_google_analytics_command");
    } catch (error) {
      console.error("Error fetching Google Analytics data:", error);
    }
  };
  return (
    <div className="overflow-hidden h-[10rem)] w-full ">
      <AnalyticsTable handleGetGoogleAnalytics={handleGetGoogleAnalytics} />
    </div>
  );
};

export default Analytics;
