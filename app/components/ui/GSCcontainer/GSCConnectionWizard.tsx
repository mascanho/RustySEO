"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShieldCheck,
  Key,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

interface GSCConnectionWizardProps {
  onComplete: () => void;
  onClose: () => void;
}

export default function GSCConnectionWizard({
  onComplete,
  onClose,
}: GSCConnectionWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    clientId: "",
    projectId: "",
    clientSecret: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<string[]>([]);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleConnect = async () => {
    if (!config.clientId || !config.clientSecret) {
      toast.error("Please enter Client ID and Client Secret");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Start local server to receive the code
      const port = await invoke<number>("start_gsc_auth_server");
      const redirectUri = `http://localhost:${port}`;

      // 2. Listen for the code from the backend
      const unlisten = await (
        await import("@tauri-apps/api/event")
      ).listen<string>("gsc-auth-code", async (event) => {
        const code = event.payload;
        try {
          // 3. Exchange code for token
          const tokenResponse = await invoke<string>("exchange_gsc_code", {
            code,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            redirectUri,
          });
          const tokenData = JSON.parse(tokenResponse);
          const token = tokenData.access_token;
          const refresh = tokenData.refresh_token;

          setAccessToken(token);
          if (refresh) setRefreshToken(refresh);

          fetchProperties(token);
          unlisten();
        } catch (error) {
          console.error("Exchange error:", error);
          toast.error("Failed to exchange code for token");
          setIsLoading(false);
          unlisten();
        }
      });

      // 4. Open Google Auth URL in system browser
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/webmasters.readonly&prompt=consent&access_type=offline`;

      const { open } = await import("@tauri-apps/plugin-shell");
      await open(authUrl);

      toast.info("Opening Google Login in your browser...");
    } catch (error) {
      console.error("OAuth error:", error);
      toast.error("Failed to start authentication process");
      setIsLoading(false);
    }
  };

  const fetchProperties = async (token: string) => {
    try {
      const response = await fetch(
        "https://www.googleapis.com/webmasters/v3/sites",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (data.siteEntry) {
        setProperties(data.siteEntry.map((s: any) => s.siteUrl));
        setStep(4);
      } else {
        toast.error("No Search Console properties found");
      }
    } catch (error) {
      console.error("Fetch properties error:", error);
      toast.error("Failed to fetch properties");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    console.log("Finalizing GSC connection...", {
      clientId: config.clientId,
      projectId: config.projectId,
      selectedProperty,
      hasToken: !!accessToken,
    });
    if (!selectedProperty) {
      toast.error("Please select a property");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Invoking set_google_search_console_credentials...");
      // Save credentials and tokens to backend
      await invoke("set_google_search_console_credentials", {
        credentials: {
          clientId: config.clientId,
          projectId: config.projectId,
          clientSecret: config.clientSecret,
          url: selectedProperty,
          propertyType: selectedProperty.startsWith("sc-domain:")
            ? "domain"
            : "site",
          range: "3 months",
          rows: "99999", // Backend will fetch maximum regardless
          token: accessToken,
          refresh_token: refreshToken,
        },
      });
      console.log("Credentials saved successfully");

      toast.success("Search Console connected successfully!");
      console.log("Calling onComplete...");
      onComplete();
    } catch (error) {
      console.error("Finalize error:", error);
      toast.error("Failed to save connection settings");
    } finally {
      setIsLoading(false);
    }
  };

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-lg mx-auto overflow-hidden bg-white dark:bg-brand-darker rounded-2xl shadow-2xl border border-gray-100 dark:border-brand-dark">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-brand-dark flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold dark:text-white">
              Connect Search Console
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Step {step} of 4
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-gray-100 dark:bg-brand-dark">
        <motion.div
          className="h-full bg-blue-600"
          initial={{ width: "25%" }}
          animate={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-8 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={step}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={1}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col h-full text-center"
            >
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-full">
                  <ShieldCheck className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold dark:text-white">
                    Unlock Deep Insights
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Connect your Google Search Console to see real-time
                    rankings, impressions, and clicks directly in RustySEO.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full pt-4">
                  <div className="p-3 bg-gray-50 dark:bg-brand-dark rounded-xl border border-gray-100 dark:border-brand-dark/50 text-left">
                    <Globe className="h-4 w-4 text-blue-500 mb-2" />
                    <p className="text-[10px] font-bold dark:text-white">
                      Global Reach
                    </p>
                    <p className="text-[9px] text-gray-500">
                      Track worldwide performance
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-brand-dark rounded-xl border border-gray-100 dark:border-brand-dark/50 text-left">
                    <Key className="h-4 w-4 text-purple-500 mb-2" />
                    <p className="text-[10px] font-bold dark:text-white">
                      Secure Access
                    </p>
                    <p className="text-[9px] text-gray-500">
                      Official Google API connection
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-8">
                <Button
                  onClick={handleNext}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl group"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={1}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col h-full"
            >
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold dark:text-white">
                    API Configuration
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter your Google Cloud Project details. Need help?
                    <a
                      href="#"
                      className="text-blue-600 ml-1 inline-flex items-center"
                    >
                      View Guide <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Client ID
                    </label>
                    <Input
                      value={config.clientId}
                      onChange={(e) =>
                        setConfig({ ...config, clientId: e.target.value })
                      }
                      placeholder="xxx-xxx.apps.googleusercontent.com"
                      className="bg-gray-50 dark:bg-brand-dark border-gray-200 dark:border-brand-dark py-6 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Project ID
                    </label>
                    <Input
                      value={config.projectId}
                      onChange={(e) =>
                        setConfig({ ...config, projectId: e.target.value })
                      }
                      placeholder="my-awesome-project"
                      className="bg-gray-50 dark:bg-brand-dark border-gray-200 dark:border-brand-dark py-6 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Client Secret
                    </label>
                    <Input
                      type="password"
                      value={config.clientSecret}
                      onChange={(e) =>
                        setConfig({ ...config, clientSecret: e.target.value })
                      }
                      placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                      className="bg-gray-50 dark:text-white  dark:bg-brand-dark border-gray-200 dark:border-brand-dark py-6"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-8">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="flex-1 py-6 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={1}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col h-full text-center"
            >
              <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-full animate-pulse">
                  <Key className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold dark:text-white">
                    Authorize Access
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    We'll now open a secure Google login window to authorize
                    RustySEO to read your Search Console data.
                  </p>
                </div>
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full bg-white dark:bg-white text-black hover:bg-gray-50 py-7 rounded-xl border border-gray-200 shadow-sm flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <img
                        src="https://www.google.com/favicon.ico"
                        className="h-5 w-5"
                        alt="Google"
                      />
                      <span className="font-bold">Connect with Google</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-2 pt-8">
                <p className="text-[10px] text-gray-400">
                  RustySEO only requests read-only access to your Search Console
                  data.
                </p>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg">
                  <p className="text-[10px] text-amber-800 dark:text-amber-200 flex items-center gap-1.5 justify-center">
                    <AlertCircle className="h-3 w-3" />
                    If the popup doesn't appear, please check if popups are
                    blocked in your settings.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              custom={1}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col h-full"
            >
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold dark:text-white">
                    Select Property
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose the website property you want to track in this
                    workspace.
                  </p>
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {properties.map((prop) => (
                    <button
                      key={prop}
                      onClick={() => setSelectedProperty(prop)}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        selectedProperty === prop
                          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 shadow-sm"
                          : "bg-gray-50 dark:bg-brand-dark border-gray-100 dark:border-brand-dark hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Globe
                          className={`h-4 w-4 ${selectedProperty === prop ? "text-blue-600" : "text-gray-400"}`}
                        />
                        <span
                          className={`text-xs font-medium ${selectedProperty === prop ? "text-blue-900 dark:text-blue-100" : "text-gray-700 dark:text-gray-300"}`}
                        >
                          {prop}
                        </span>
                      </div>
                      {selectedProperty === prop && (
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-8">
                <Button
                  onClick={handleFinalize}
                  disabled={isLoading || !selectedProperty}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl font-bold"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
