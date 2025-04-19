// @ts-nocheck
"use client";

import { useState } from "react";
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
    title: "Welcome to our platform",
    description:
      "We're excited to have you on board. Let's get you set up in just a few steps.",
    icon: Rocket,
    imageSrc: "https://github.com/mascanho/RustySEO/raw/main/assets/hero.png",
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
    title: "You're all set!",
    description:
      "Congratulations! You're ready to start using our platform to its full potential.",
    icon: CheckCircle,
    imageSrc: "https://github.com/mascanho/RustySEO/raw/main/assets/hero.png",
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
      // Trigger confetti effect when completing the onboarding
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#8B5CF6", "#3B82F6", "#A78BFA"],
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

  return (
    <div className="absolute max-h-10 -z-50 -top-2 left-1/2 transform -translate-x-1/2 translate-y-[10rem] p-4  from-blue-50 to-purple-50 rounded-xl">
      <section className="w-full md:w-[900px] border-0 shadow-lg bg-white">
        <CardHeader className="bg-gradient-to-r relative flex h-10 from-blue-600 to-purple-600 text-white rounded-t-lg p-0">
          <CardTitle className="text-2xl font-bold p-1 pl-6 text-white">
            Onboarding
          </CardTitle>
          <X className="absolute right-4 top-1" />
        </CardHeader>
        <CardContent className="p-6">
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

          <div className="h-[400px]">
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
                              <IconComponent className="h-8 w-8 text-blue-600" />
                            );
                          })()}
                      </div>
                      <h3 className="text-2xl font-bold mb-3">
                        {steps[currentStep - 1]?.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {steps[currentStep - 1]?.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {currentStep === 1
                          ? "Let's get started with a few simple steps."
                          : currentStep === 2
                            ? "Your profile helps us personalize your experience."
                            : currentStep === 3
                              ? "Discover what makes our platform unique."
                              : "You're ready to explore everything we have to offer."}
                      </p>
                    </div>
                    <div className="flex-1 flex justify-center items-center h-full">
                      <div className="w-full h-[250px] relative rounded-lg overflow-hidden shadow-md">
                        <img
                          src={
                            steps[currentStep - 1]?.imageSrc ||
                            "/images/welcome-illustration.png"
                          }
                          alt={`Illustration for ${steps[currentStep - 1]?.title}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                          priority
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8">
                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                      <div className="mb-4 p-4 rounded-full bg-gradient-to-r from-blue-100 to-purple-100">
                        <CheckCircle className="h-10 w-10 text-purple-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">All Done!</h3>
                      <p className="text-gray-600 mb-4">
                        You've completed the onboarding process.
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleReset}
                          className="mt-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                          Start Over
                        </Button>
                        <Button
                          onClick={handleReset}
                          className="mt-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                          Start Over
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 flex justify-center items-center h-full">
                      <div className="w-full h-[250px] relative rounded-lg overflow-hidden shadow-md">
                        <img
                          src="/images/complete-illustration.png"
                          alt="Onboarding completed"
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 400px"
                          priority
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
          <CardFooter className="flex justify-between border-t p-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 flex items-center gap-1"
            >
              {currentStep === steps.length ? "Complete" : "Next"}{" "}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </section>
    </div>
  );
}
