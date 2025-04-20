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

const steps = [
  {
    id: 1,
    title: "Welcome to RustySEO,",
    description:
      "A comprehensive Marketing Toolkit designed for SEO and GEO professionals — your all-in-one solution for every need.",
    icon: Rocket,
    imageSrc: "icon.png",
  },
  {
    id: 2,
    title: "Set up your profile",
    description:
      "Customize your experience and help others get to know you better.",
    icon: Shield,
    imageSrc: "https://github.com/mascanho/RustySEO/raw/main/assets/hero.png",
  },
  {
    id: 3,
    title: "Explore key features",
    description:
      "Discover the powerful tools and features that will help you succeed.",
    icon: Zap,
    imageSrc: "https://github.com/mascanho/RustySEO/raw/main/assets/hero.png",
  },
  {
    id: 4,
    title: "You  re all set!",
    description:
      "Congratulations! You are ready to start using our platform to its full potential.",
    icon: CheckCircle,
    imageSrc: "https://github.com/mascanho/RustySEO/raw/main/assets/hero.png",
  },
  {
    id: 5,
    title: "You re all set!",
    description:
      "Congratulations! You are ready to start using our platform to its full potential.",
    icon: CheckCircle,
    imageSrc: "https://github.com/mascanho/RustySEO/raw/main/assets/hero.png",
  },
  {
    id: 6,
    title: "You re all set!",
    description:
      "Congratulations! You are ready to start using our platform to its full potential.",
    icon: CheckCircle,
    imageSrc: "https://github.com/mascanho/RustySEO/raw/main/assets/hero.png",
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
    <div className="fixed inset-0 flex items-center justify-center -z-10">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl p-4">
        <section className="w-full h-[450px] border-0 shadow-lg bg-white dark:bg-slate-900 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-gradient-to-r relative flex h-10 from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl font-bold p-1.5 pl-4 text-white dark:text-white z-0">
              Onboarding
            </CardTitle>
            <X
              className="absolute right-4 top-2 cursor-pointer"
              onClick={handleClose}
            />
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

            <div className="h-[200px]">
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
                              const IconComponent = steps[currentStep - 1].icon;
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
                        <p className="text-sm text-gray-500">
                          {currentStep === 1
                            ? "Let s get started with a few simple steps."
                            : currentStep === 2
                              ? "Your profile helps us personalize your experience."
                              : currentStep === 3
                                ? "Discover what makes our platform unique."
                                : "You rre ready to explore everything we have to offer."}
                        </p>
                      </div>
                      <div className="flex-1 flex justify-center items-center h-full">
                        <div
                          className={`${currentStep === 1 ? "w-40" : " w-96"} h-auto relative rounded-lg overflow-hidden`}
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
  );
}
