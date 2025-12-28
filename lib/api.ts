const API_BASE_URL = "http://localhost:8080/api";

export const api = {
  crawl: async (url: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/crawl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const json = await response.json();
      // Handler returns specific structure for crawl
      if (json.status === "error") {
        throw new Error(json.error);
      }
      return json.data;
    } catch (error) {
      console.error("Crawl API error:", error);
      throw error;
    }
  },

  getDbData: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/db_data`);
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      const json = await response.json();
      // Result serialization: { Ok: data } or { Err: msg }
      if (json.Err) {
        throw new Error(json.Err);
      }
      return json.Ok;
    } catch (error) {
        console.error("getDbData API error:", error);
        throw error;
    }
  },

  fetchPageSpeed: async (url: string, strategy: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/page_speed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, strategy }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const json = await response.json();
      if (json.Err) {
        throw new Error(json.Err);
      }
      return json.Ok;
    } catch (error) {
        console.error("fetchPageSpeed API error:", error);
        throw error;
    }
  },

  getSettings: async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/settings/all`);
        if (!response.ok) throw new Error(response.statusText);
        return await response.json();
    } catch (error) {
        console.error("getSettings API error:", error);
        throw error;
    }
  },

  // SEO Data
  readSeoData: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/seo_data`);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("readSeoData API error:", error);
      throw error;
    }
  },

  // Ollama Status
  checkOllama: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ollama_status`);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("checkOllama API error:", error);
      throw error;
    }
  },

  // Write Model
  writeModel: async (model: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/model`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("writeModel API error:", error);
      throw error;
    }
  },

  // GSC Credentials
  setGscCredentials: async (credentials: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/gsc/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("setGscCredentials API error:", error);
      throw error;
    }
  },

  // Call GSC
  callGoogleSearchConsole: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/gsc/call`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("callGoogleSearchConsole API error:", error);
      throw error;
    }
  },

  // Match GSC URL
  matchGscUrl: async (url: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/gsc/match_url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("matchGscUrl API error:", error);
      throw error;
    }
  },

  // Get GSC Data
  getGscData: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/gsc/data`);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("getGscData API error:", error);
      throw error;
    }
  },

  // Google Analytics
  getGoogleAnalytics: async (searchType: any[], dateRanges: any[]) => {
    try {
      const response = await fetch(`${API_BASE_URL}/analytics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search_type: searchType, date_ranges: dateRanges }),
      });
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("getGoogleAnalytics API error:", error);
      throw error;
    }
  },

  // Microsoft Clarity
  setMicrosoftClarityCredentials: async (endpoint: string, token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/clarity/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint, token }),
      });
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("setMicrosoftClarityCredentials API error:", error);
      throw error;
    }
  },

  getMicrosoftClarityCredentials: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clarity/credentials`);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("getMicrosoftClarityCredentials API error:", error);
      throw error;
    }
  },

  getMicrosoftClarityData: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clarity/data`);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("getMicrosoftClarityData API error:", error);
      throw error;
    }
  },

  // Keyword Tracking
  addKeywordTracking: async (data: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/keywords/tracking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("addKeywordTracking API error:", error);
      throw error;
    }
  },

  getTrackedKeywords: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/keywords/tracked`);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("getTrackedKeywords API error:", error);
      throw error;
    }
  },

  deleteKeyword: async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/keywords/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("deleteKeyword API error:", error);
      throw error;
    }
  },

  syncKeywordTables: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/keywords/sync`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("syncKeywordTables API error:", error);
      throw error;
    }
  },

  matchKeywordsWithGsc: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/keywords/match`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("matchKeywordsWithGsc API error:", error);
      throw error;
    }
  },

  getMatchedKeywords: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/keywords/matched`);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("getMatchedKeywords API error:", error);
      throw error;
    }
  },

  getKeywordsSummary: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/keywords/summary`);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("getKeywordsSummary API error:", error);
      throw error;
    }
  },

  // Configs
  openConfigs: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/configs/open`, {
        method: "POST",
      });
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("openConfigs API error:", error);
      throw error;
    }
  },

  // Version Check
  versionCheck: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/version/check`);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("versionCheck API error:", error);
      throw error;
    }
  },

  // URL Diff
  getUrlDiff: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/diff/url`);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("getUrlDiff API error:", error);
      throw error;
    }
  },

  // GSC Credentials
  readGscCredentials: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/credentials/gsc`);
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("readGscCredentials API error:", error);
      throw error;
    }
  },

  // Check Link Status
  checkLinkStatus: async (url: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/check_link_status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error(response.statusText);
      const json = await response.json();
      if (json.Err) throw new Error(json.Err);
      return json.Ok;
    } catch (error) {
      console.error("checkLinkStatus API error:", error);
      throw error;
    }
  }
};
