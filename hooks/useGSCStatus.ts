// @ts-nocheck
import { useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import useGSCStatusStore from "@/store/GSCStatusStore";

export const useGSCStatus = () => {
  const {
    credentials,
    isConfigured,
    isLoading,
    lastChecked,
    error,
    setLoading,
    updateStatus,
    clearStatus,
  } = useGSCStatusStore();

  // Function to check GSC status
  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      const gscCredentials = await api.readGscCredentials();

      updateStatus(gscCredentials);

      return {
        success: true,
        credentials: gscCredentials,
        isConfigured: !!(
          gscCredentials?.client_id &&
          gscCredentials?.project_id &&
          gscCredentials?.client_secret
        ),
      };
    } catch (err) {
      const errorMessage = err?.message || "Failed to check GSC status";
      updateStatus(null, errorMessage);

      return {
        success: false,
        error: errorMessage,
        isConfigured: false,
      };
    }
  }, [setLoading, updateStatus]);

  // Function to test GSC connection by attempting to fetch data
  const testConnection = useCallback(
    async (testUrl?: string) => {
      if (!isConfigured) {
        return {
          success: false,
          error: "GSC is not configured",
        };
      }

      try {
        setLoading(true);

        // Use a test URL or default
        const url = testUrl || "example.com";

        await api.matchGscUrl(url);

        return {
          success: true,
          message: "GSC connection successful",
        };
      } catch (err) {
        const errorMessage = err?.message || "GSC connection failed";
        updateStatus(credentials, errorMessage);

        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [isConfigured, setLoading, credentials, updateStatus],
  );

  // Check status only once on mount
  useEffect(() => {
    checkStatus();
  }, []); // Empty dependency array - runs only once on mount

  // Get status summary
  const getStatusSummary = useCallback(() => {
    if (isLoading) return "Checking GSC status...";
    if (error) return `GSC Error: ${error}`;
    if (isConfigured) return "GSC: Connected";
    return "GSC: Not configured";
  }, [isLoading, error, isConfigured]);

  // Get status color for UI
  const getStatusColor = useCallback(() => {
    if (isLoading) return "yellow";
    if (error) return "red";
    if (isConfigured) return "green";
    return "gray";
  }, [isLoading, error, isConfigured]);

  return {
    // State
    credentials,
    isConfigured,
    isLoading,
    lastChecked,
    error,

    // Actions
    checkStatus,
    testConnection,
    clearStatus,

    // Utilities
    getStatusSummary,
    getStatusColor,

    // Computed values
    hasClientId: !!credentials?.client_id,
    hasProjectId: !!credentials?.project_id,
    hasClientSecret: !!credentials?.client_secret,
    lastCheckedFormatted: lastChecked
      ? new Date(lastChecked).toLocaleString()
      : null,
  };
};

export default useGSCStatus;
