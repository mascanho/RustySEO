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
  }, [router]);

  const funnyErrors = [
    "Oops! Our hamsters powering the app needed a coffee break 🐹☕",
    "Sorry! Your request got lost in our digital maze 🏃",
    "Looks like our code took a wrong turn at Albuquerque",
    "The app gnomes are on strike today 🧙‍♂️",
    "Our app is experiencing technical difficulties (it&apos;s having an existential crisis)",
  ];

  const randomError =
    funnyErrors[Math.floor(Math.random() * funnyErrors.length)];

  return (
    <div className="flex flex-col items-center justify-center h-screen ">
      <div className="text-center p-8 rounded-lg space-y-6  -mt-64">
        <h1 className="text-6xl font-bold mb-4">⚠️ An error occured ⚠️</h1>
        <img
          src="/icon.png"
          alt="Error Icon"
          className="mx-auto mb-4 w-32 h-32"
        />
        <p className="text-2xl font-medium text-gray-600 mb-4">{randomError}</p>
        <p>Please restart the app</p>
      </div>
    </div>
  );
}
