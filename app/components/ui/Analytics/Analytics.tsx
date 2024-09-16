import { invoke } from "@tauri-apps/api/tauri";

const Analytics = ({}) => {
  const handleGetGoogleAnalytics = async () => {
    try {
      await invoke("get_google_analytics_command");
    } catch (error) {
      console.error("Error fetching Google Analytics data:", error);
    }
  };
  return (
    <div className="mt-28">
      <button
        onClick={handleGetGoogleAnalytics}
        className="mt-32 text-white bg-brand-bright rounded-md px-4 py-2 font-semibold dark:bg-brand-dark dark:text-white"
      >
        Fetch Ga4 data
      </button>
    </div>
  );
};

export default Analytics;
