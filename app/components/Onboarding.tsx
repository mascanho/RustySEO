// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Shield,
  X,
  Zap,
  FileCode,
  Layers,
  ScrollText,
  PlugZap,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import confetti from "canvas-confetti";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

const steps = [
  {
    id: 1,
    title: "Welcome to RustySEO.",
    description:
      "Your complete marketing solution — built for SEO and GEO professionals who want it all, in one smart toolkit.",
    icon: Rocket,
    imageSrc: "icon.png",
  },
  {
    id: 2,
    title: "Shallow Crawl (single page)",
    description:
      "Granular page analysis with AI-driven insights and performance recommendations. Identify and resolve issues with precision.",
    icon: FileCode,
    imageSrc: "shallow.png",
  },
  {
    id: 3,
    title: "Deep Crawl (bulk)",
    description:
      "Crawl your entire website and get actionable insights. RustySEO detects errors and delivers smart solutions. Discover your website\'s deepest secrets.",
    icon: Layers,
    imageSrc: "deep.png",
  },
  {
    id: 4,
    title: "Log Analyser",
    description:
      "A powerful feature that enables you to analyze your server logs (Apache/Nginx) and gain actionable insights. Discover crawler timings, visit frequencies, and content taxonomies.",
    icon: ScrollText,
    imageSrc: "log.png",
  },
  {
    id: 5,
    title: "Connectors & Integrations",
    description:
      "Extend RustySEO\'s capabilities by integrating with your favorite tools — PageSpeed Insights, Google Search Console, Google Analytics, Microsoft Clarity, Power BI, and more.",
    icon: PlugZap,
    imageSrc: "integrations.png",
  },
  {
    id: 6,
    title: "Keyword Tracking & Content Exploration",
    description:
      "Track your keywords, identify patterns and receive new content ideas and recommendations as you optimise your pages with contextual awareness.",
    icon: Key,
    imageSrc: "tracking.png",
  },
  {
    id: 7,
    title: "And more...",
    description:
      "RustySEO offers a wide range of advanced features and integrations. Help us improve by contributing and giving us feedback.",
    icon: CheckCircle,
    imageSrc: "more.png",
  },
];

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const onboardingCompleted = localStorage.getItem("onboarding") === "true";

    if (!onboardingCompleted) {
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 1);

      return () => clearTimeout(timer);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem("onboarding", "true");
    setShowOnboarding(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);

      onComplete();
      completeOnboarding();
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#8B5CF6", "#3B82F6", "#A78BFA"],
        zIndex: 9999,
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setCompleted(false);
  };

  const handleClose = () => {
    completeOnboarding();
  };

  if (!showOnboarding) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999999999999] bg-black/50 !transform-none">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <section className="w-full h-[450px] border-0 shadow-lg bg-white dark:bg-slate-900 rounded-lg overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r relative flex h-10 from-blue-600 to-purple-600 text-white">
              <CardTitle className="text-2xl font-bold p-1.5 pl-4 text-white dark:text-white z-0">
                Onboarding
              </CardTitle>
              {/* <X */}
              {/*   className="absolute right-4 top-2 cursor-pointer" */}
              {/*   onClick={handleClose} */}
              {/* /> */}
            </div>

            <CardContent className="p-6 flex-1 overflow-auto z-0">
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  {steps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex-1 h-1 rounded-full mx-1 ${
                        step.id <= currentStep
                          ? "bg-gradient-to-r from-blue-500 to-purple-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Start</span>
                  <span>Finish</span>
                </div>
              </div>

              <div className="h-[250px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col md:flex-row items-center justify-center gap-8"
                  >
                    {!completed ? (
                      <>
                        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                          <div className="mb-4 p-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
                            {steps[currentStep - 1] &&
                              (() => {
                                const IconComponent =
                                  steps[currentStep - 1].icon;
                                return (
                                  <IconComponent className="h-4 w-4 text-blue-600" />
                                );
                              })()}
                          </div>
                          <h3 className="text-2xl font-bold mb-3 dark:text-white">
                            {steps[currentStep - 1]?.title}
                          </h3>
                          <p className="text-gray-600 mb-4">
                            {steps[currentStep - 1]?.description}
                          </p>
                          <section className="w-full flex items-center">
                            <p className="text-sm text-gray-500">
                              {currentStep === 1
                                ? "Let's get started with a few simple steps."
                                : currentStep === 2
                                  ? "Perfect for on-page, off-page, and technical SEO."
                                  : currentStep === 3
                                    ? "Great for bulk analysis and optimisation"
                                    : currentStep === 4
                                      ? "Perfect for crawl budget analysis"
                                      : currentStep === 5
                                        ? "A one-stop solution for all your SEO needs"
                                        : currentStep === 6
                                          ? "Great for content optimisation"
                                          : currentStep === 7
                                            ? "Enjoy it, and let us know what you think! Find us on "
                                            : "Keep all your data in one place"}{" "}
                            </p>
                            {currentStep === 7 && (
                              <a
                                href="https://github.com/mascanho/RustySEO"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block ml-2"
                              >
                                <GitHubLogoIcon className="h-5 w-5 text-gray-500" />
                              </a>
                            )}
                          </section>
                        </div>
                        <div className="flex-1 flex justify-center items-center h-full">
                          <div
                            className={`${currentStep === 1 ? "w-40" : " w-80"} h-auto relative rounded-lg overflow-hidden`}
                          >
                            <img
                              src={
                                steps[currentStep - 1]?.imageSrc ||
                                "https://github.com/mascanho/RustySEO/raw/main/assets/hero.png"
                              }
                              alt={`Illustration for ${steps[currentStep - 1]?.title}`}
                              className={`${currentStep === 1 ? "object-fit" : "object-cover"} w-full h-full`}
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8">
                        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                          <div className="mb-4 p-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
                            <CheckCircle className="h-5 w-5 text-purple-600" />
                          </div>
                          <h3 className="text-2xl font-bold mb-3">All Done!</h3>
                          <p className="text-gray-600 mb-4">
                            You ve completed the onboarding process.
                          </p>
                          <div className="flex space-x-2">
                            <Button
                              onClick={handleReset}
                              className="mt-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                            >
                              Start Over
                            </Button>
                            <Button
                              variant="outline"
                              className="mt-2"
                              onClick={handleClose}
                            >
                              Close
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1 flex justify-center items-center h-full">
                          <div className="w-full h-[250px] relative rounded-lg overflow-hidden shadow-md">
                            <img
                              src="https://github.com/mascanho/RustySEO/raw/main/assets/hero.png"
                              alt="Onboarding completed"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </CardContent>

            {!completed && (
              <CardFooter className="flex justify-between border-t dark:border-t-brand-dark p-3 px-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="flex items-center gap-1 dark:text-white dark:bg-brand-dark h-7"
                >
                  <ChevronLeft className="h-4 w-4 dark:text-white" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 flex items-center gap-1 dark:text-white  h-7"
                >
                  {currentStep === steps.length ? "Finish" : "Next"}{" "}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
