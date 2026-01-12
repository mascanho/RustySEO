"use client";

import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import AnalyticsTable from "./AnalyticsTable";
import { Button } from "@/components/ui/button";
import { Modal } from "@mantine/core";
import { motion, AnimatePresence } from "framer-motion";
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
  const { isConfigured, isLoading, refresh, credentials } = useGA4StatusStore();

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
      <div className="flex flex-col justify-center max-w-2xl mx-auto px-6 flex-1 h-full">
        <AnimatePresence mode="wait">
          {!isWizardOpen ? (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center"
            >
              <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-3xl mb-8">
                <BarChart3 className="h-16 w-16 text-orange-600 dark:text-orange-400" />
              </div>
              <h1 className="text-3xl font-bold mb-4 dark:text-white">
                Connect Google Analytics 4
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                Unlock powerful insights about your website traffic and user
                behavior. Connect your GA4 property to see sessions, bounce
                rates, and engagement metrics directly in RustySEO.
              </p>
              <Button
                onClick={() => setIsWizardOpen(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 rounded-2xl text-lg font-bold shadow-lg shadow-orange-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] group"
              >
                Connect Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="wizard"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full flex justify-center"
            >
              <GA4ConnectionWizard
                onComplete={() => {
                  setIsWizardOpen(false);
                  refresh();
                }}
                onClose={() => setIsWizardOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-2 space-y-2 overflow-hidden">
      <div className="flex items-center justify-between mb-2 flex-shrink-0 px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
            <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold dark:text-white leading-none">
              Google Analytics 4
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-none">
              {isConfigured
                ? credentials?.property_id
                  ? `Connected to ${credentials.property_id}`
                  : "Connected"
                : "Not connected"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsWizardOpen(true)}
            variant="ghost"
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20 h-7 text-xs font-bold px-2 rounded-md"
          >
            Settings
          </Button>
        </div>
      </div>

      <div className="flex-1 w-full overflow-hidden rounded-xl border dark:border-brand-dark bg-white dark:bg-brand-darker">
        <AnalyticsTable />
      </div>

      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-brand-darker/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg">
            <GA4ConnectionWizard
              onComplete={() => {
                setIsWizardOpen(false);
                refresh();
              }}
              onClose={() => setIsWizardOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
