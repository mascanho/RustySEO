// @ts-nocheck
import useGSCStatusStore from "@/store/GSCStatusStore";
import { invoke } from "@tauri-apps/api/core";

async function FetchMatchGSC(url: any, credentials: any, GSCdata: any) {
  console.log(GSCdata, "GSCDATA");

  try {
    // const queryStrings = GSCdata.map((item) => item.query);

    const response = await invoke("match_gsc_query_command", {
      data: GSCdata || [],
      url: url,
    });

    console.log("GSC RAW DATA: ", GSCdata);
    console.log("Match response: ", response);

    return response;
  } catch (error) {
    console.error("Failed to fetch GSC matches:", error);

    // Return a fallback response
    return {
      url,
      matches: [],
      total_matches: 0,
      confidence_score: 0,
      error: error.message,
    };
  }
}

export default FetchMatchGSC;
