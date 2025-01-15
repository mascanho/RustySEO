"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  statusCode,
  errorMessage,
}: {
  statusCode: number;
  errorMessage: string;
}) {
  const router = useRouter();

  useEffect(() => {
    router.push("/");
  }, []);

  const funnyErrors = [
    "Oops! Our hamsters powering the app needed a coffee break 🐹☕",
    "Sorry! Your request got lost in our digital maze 🏃",
    "Looks like our code took a wrong turn at Albuquerque 🤔",
    "The app gnomes are on strike today 🧙‍♂️",
    "Our app is experiencing technical difficulties (it's having an existential crisis) 🤖",
  ];

  const randomError =
    funnyErrors[Math.floor(Math.random() * funnyErrors.length)];

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-6xl font-bold mb-4">🤪 Whoopsie!</h1>
        <p className="text-2xl font-medium text-gray-600 mb-4">{randomError}</p>
        <p className="text-lg text-gray-500 italic">
          Technical mumbo-jumbo: {errorMessage}
        </p>
        <div className="mt-6 animate-bounce">
          <p className="text-sm text-gray-400">
            Don't worry, we're redirecting you somewhere safer...
          </p>
        </div>
      </div>
    </div>
  );
}
