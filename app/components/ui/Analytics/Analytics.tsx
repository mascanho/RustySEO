"use client";

import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import AnalyticsTable from "./AnalyticsTable";
import { Button } from "@/components/ui/button";
import { Modal } from "@mantine/core";
import {
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import GA4ConnectionWizard from "../GA4container/GA4ConnectionWizard";
import useGA4StatusStore from "@/store/GA4StatusStore";

const Analytics = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const { isConfigured, isLoading, refresh } = useGA4StatusStore();

  useEffect(() => {
    refresh();
  }, []);

  const handleRefreshGA4 = async () => {
    console.log("Refreshing GA4 data...");
    try {
      // This would normally trigger a fetch from the backend
      // For now we just refresh the status
      await refresh();
    } catch (error) {
      console.error("Error refreshing GA4:", error);
    }
  };

  if (isLoading && !isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-gray-500">
          Checking Google Analytics connection...
        </p>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-6 flex-1 h-[90vh]">
        <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-3xl mb-8">
          <BarChart3 className="h-16 w-16 text-orange-600 dark:text-orange-400" />
        </div>
        <h1 className="text-3xl font-bold mb-4 dark:text-white">
          Connect Google Analytics 4
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          Unlock powerful insights about your website traffic and user behavior.
          Connect your GA4 property to see sessions, bounce rates, and
          engagement metrics directly in RustySEO.
        </p>
        <Button
          onClick={() => setIsWizardOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 rounded-2xl text-lg font-bold shadow-lg shadow-orange-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] group"
        >
          Connect Now
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>

        <Modal
          opened={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          withCloseButton={false}
          size="lg"
          padding={0}
          centered
          overlayProps={{ backgroundOpacity: 0.01, blur: 0 }}
          styles={{
            content: {
              backgroundColor: "transparent",
              boxShadow: "none",
              border: "none",
            },
            body: { padding: 0, backgroundColor: "transparent" },
            inner: { padding: 0 },
          }}
        >
          <GA4ConnectionWizard
            onComplete={() => {
              setIsWizardOpen(false);
              refresh();
            }}
            onClose={() => setIsWizardOpen(false)}
          />
        </Modal>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-2 space-y-2 overflow-hidden">
      <div className="flex items-center justify-between px-2 shrink-0">
        <div>
          <h1 className="text-xl font-bold dark:text-white">
            Analytics Overview
          </h1>
          <p className="text-xs text-gray-500">
            Real-time data from Google Analytics 4
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshGA4} className="gap-2 h-8 text-xs">
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      <div className="flex-1 w-full overflow-hidden rounded-xl border dark:border-brand-dark bg-white dark:bg-brand-darker">
        <AnalyticsTable />
      </div>

      <Modal
        opened={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        withCloseButton={false}
        size="lg"
        padding={0}
        centered
        overlayProps={{ backgroundOpacity: 0.01, blur: 0 }}
        styles={{
          content: {
            backgroundColor: "transparent",
            boxShadow: "none",
            border: "none",
          },
          body: { padding: 0, backgroundColor: "transparent" },
          inner: { padding: 0 },
        }}
      >
        <GA4ConnectionWizard
          onComplete={() => {
            setIsWizardOpen(false);
            refresh();
          }}
          onClose={() => setIsWizardOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Analytics;
