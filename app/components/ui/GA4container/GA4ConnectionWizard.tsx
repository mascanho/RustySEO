"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  ShieldCheck,
  Key,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

interface GA4ConnectionWizardProps {
  onComplete: () => void;
  onClose: () => void;
}

interface GA4Property {
  name: string; // resource name: properties/123
  displayName: string;
  property: string; // property id: 123
}

export default function GA4ConnectionWizard({
  onComplete,
  onClose,
}: GA4ConnectionWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    clientId: "",
    projectId: "",
    clientSecret: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<GA4Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<GA4Property | null>(
    null,
  );
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
      const port = await invoke<number>("start_gsc_auth_server"); // Reusing the same auth server logic
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
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=https://www.googleapis.com/auth/analytics.readonly&prompt=consent&access_type=offline`;

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
      const props = await invoke<any[]>("get_ga4_properties", { token });
      if (props && props.length > 0) {
        const formattedProps: GA4Property[] = props.map((p) => ({
          name: p.property, // resource name
          displayName: p.displayName,
          property: p.property.split("/")[1], // extract ID from properties/123
        }));
        setProperties(formattedProps);
        setStep(4);
      } else {
        toast.error("No GA4 properties found");
      }
    } catch (error) {
      console.error("Fetch properties error:", error);
      const errorMessage =
        typeof error === "string" ? error : "Failed to fetch properties";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedProperty) {
      toast.error("Please select a property");
      return;
    }

    setIsLoading(true);
    try {
      // Save credentials and tokens to backend
      await invoke("set_google_analytics_credentials", {
        credentials: {
          client_id: config.clientId,
          project_id: config.projectId,
          client_secret: config.clientSecret,
          property_id: selectedProperty.property,
          token: accessToken,
          refresh_token: refreshToken,
        },
      });

      toast.success("Google Analytics connected successfully!");
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
    <div className="flex flex-col h-[500px] w-full max-w-lg mx-auto overflow-hidden bg-white dark:bg-brand-darker rounded-2xl shadow-2xl border border-gray-100 dark:border-brand-dark">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-brand-dark flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
            <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold dark:text-white">Connect GA4</h2>
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
          className="h-full bg-orange-600"
          initial={{ width: "25%" }}
          animate={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-6 relative overflow-hidden">
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
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                  <PieChart className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold dark:text-white">
                    Analyze User Behavior
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                    Connect Google Analytics 4 to track sessions, bounce rates,
                    and user engagement.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full pt-2">
                  <div className="p-3 bg-gray-50 dark:bg-brand-dark rounded-xl border border-gray-100 dark:border-brand-dark/50 text-left">
                    <Globe className="h-4 w-4 text-blue-500 mb-2" />
                    <p className="text-[10px] font-bold dark:text-white">
                      User Insights
                    </p>
                    <p className="text-[9px] text-gray-500">
                      Understand your audience
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-brand-dark rounded-xl border border-gray-100 dark:border-brand-dark/50 text-left">
                    <Key className="h-4 w-4 text-purple-500 mb-2" />
                    <p className="text-[10px] font-bold dark:text-white">
                      Secure Auth
                    </p>
                    <p className="text-[9px] text-gray-500">
                      Official OAuth connection
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <Button
                  onClick={handleNext}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-xl group text-sm"
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
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-md font-bold dark:text-white">
                    API Configuration
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Enter your Google Cloud Project details for GA4.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      Client ID
                    </label>
                    <Input
                      value={config.clientId}
                      onChange={(e) =>
                        setConfig({ ...config, clientId: e.target.value })
                      }
                      placeholder="xxx-xxx.apps.googleusercontent.com"
                      className="bg-gray-50 dark:bg-brand-dark border-gray-200 dark:border-brand-dark h-9 text-xs dark:text-white dark:placeholder:text-white/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      Project ID
                    </label>
                    <Input
                      value={config.projectId}
                      onChange={(e) =>
                        setConfig({ ...config, projectId: e.target.value })
                      }
                      placeholder="my-awesome-project"
                      className="bg-gray-50 dark:bg-brand-dark border-gray-200 dark:border-brand-dark h-9 text-xs dark:text-white dark:placeholder:text-white/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                      Client Secret
                    </label>
                    <Input
                      type="password"
                      value={config.clientSecret}
                      onChange={(e) =>
                        setConfig({ ...config, clientSecret: e.target.value })
                      }
                      placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                      className="bg-gray-50 dark:bg-brand-dark border-gray-200 dark:border-brand-dark h-9 text-xs dark:text-white dark:placeholder:text-white/50"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="flex-1 py-5 rounded-xl text-xs dark:bg-slate-700 dark:text-white"
                >
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-[2] bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-xl text-xs dark:hover:bg-orange-600 dark:hover:text-white"
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
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-full animate-pulse">
                  <Key className="h-10 w-10 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold dark:text-white">
                    Authorize GA4 Access
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    We'll now open a secure Google login window.
                  </p>
                </div>
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full bg-white dark:bg-white text-black hover:bg-gray-50 py-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <img
                        src="https://www.google.com/favicon.ico"
                        className="h-4 w-4"
                        alt="Google"
                      />
                      <span className="font-bold text-sm">
                        Connect with Google
                      </span>
                    </>
                  )}
                </Button>
              </div>
              <div className="space-y-2 pt-4">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg">
                  <p className="text-[9px] text-amber-800 dark:text-amber-200 flex items-center gap-1.5 justify-center">
                    <AlertCircle className="h-3 w-3" />
                    If popup fails, check blocked popups.
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
              <div className="flex-1 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-md font-bold dark:text-white">
                    Select GA4 Property
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Choose the GA4 property you want to track.
                  </p>
                </div>
                <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {properties.map((prop) => (
                    <button
                      key={prop.property}
                      onClick={() => setSelectedProperty(prop)}
                      className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                        selectedProperty?.property === prop.property
                          ? "bg-orange-50 dark:bg-orange-900/30 border-orange-500 dark:border-orange-400 shadow-sm"
                          : "bg-gray-50 dark:bg-brand-dark border-gray-100 dark:border-brand-dark hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <BarChart3
                          className={`h-3.5 w-3.5 ${selectedProperty?.property === prop.property ? "text-orange-600" : "text-gray-400"}`}
                        />
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-bold ${selectedProperty?.property === prop.property ? "text-orange-900 dark:text-orange-100" : "text-gray-700 dark:text-gray-300"}`}
                          >
                            {prop.displayName}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            ID: {prop.property}
                          </span>
                        </div>
                      </div>
                      {selectedProperty?.property === prop.property && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-orange-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <Button
                  onClick={handleFinalize}
                  disabled={isLoading || !selectedProperty}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-5 rounded-xl font-bold text-sm"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
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
