import { Card, CardContent } from "@/components/ui/card";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";

import { BiKey } from "react-icons/bi";

// const dataEntries = [
//   {
//     keyword: "supply chain management",
//     Topic: "Optimizing Supply Chain Efficiency",
//     title: "Best Practices for Supply Chain Management", // Changed to title
//     PageDescription:
//       "Learn about strategies and tools for effective supply chain management.",
//     h1: "Mastering Supply Chain Management",
//     icon: <BiKey className="h-6 w-6 text-blue-600" />, // Smaller icon
//   },
//   {
//     keyword: "supply chain management",
//     Topic: "Optimizing Supply Chain Efficiency",
//     title: "Best Practices for Supply Chain Management", // Changed to title
//     PageDescription:
//       "Learn about strategies and tools for effective supply chain management.",
//     h1: "Mastering Supply Chain Management",
//     icon: <BiKey className="h-6 w-6 text-blue-600" />, // Smaller icon
//   },
//   {
//     keyword: "supply chain management",
//     Topic: "Optimizing Supply Chain Efficiency",
//     title: "Best Practices for Supply Chain Management", // Changed to title
//     PageDescription:
//       "Learn about strategies and tools for effective supply chain management.",
//     h1: "Mastering Supply Chain Management",
//     icon: <BiKey className="h-6 w-6 text-blue-600" />, // Smaller icon
//   },
//   {
//     keyword: "supply chain management",
//     Topic: "Optimizing Supply Chain Efficiency",
//     title: "Best Practices for Supply Chain Management", // Changed to title
//     PageDescription:
//       "Learn about strategies and tools for effective supply chain management.",
//     h1: "Mastering Supply Chain Management",
//     icon: <BiKey className="h-6 w-6 text-blue-600" />, // Smaller icon
//   },
//   {
//     keyword: "supply chain management",
//     Topic: "Optimizing Supply Chain Efficiency",
//     title: "Best Practices for Supply Chain Management", // Changed to title
//     PageDescription:
//       "Learn about strategies and tools for effective supply chain management.",
//     h1: "Mastering Supply Chain Management",
//     icon: <BiKey className="h-6 w-6 text-blue-600" />, // Smaller icon
//   },
// ];

export default function Component({ bodyElements }: any) {
  let [topics, setTopics] = useState<any[]>([]);
  const [topicsJson, setTopicsJson] = useState<any[]>([]);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);

  useEffect(() => {
    invoke("generate_ai_topics", { body: bodyElements[0] })
      .then((res: any) => {
        console.log(res);
        setTopics(res);
      })
      .finally(() => {
        setTopicsJson(topics);
      });
  }, [bodyElements]);

  useEffect(() => {
    if (topics.length > 0) {
      // Step 1: Remove the surrounding backticks
      topics = topics?.replace(/^```|```$/g, "");

      // Step 2: Remove any surrounding quotes (single or double)
      topics = topics?.replace(/^["']|["']$/g, "");

      let position = topics?.indexOf("{");

      if (position !== -1) {
        topics = topics?.substring(position);
        console.log(topics, "Fixed topics 1");
      }

      // Step 3: Add commas between objects
      topics = topics?.replace(/}\s*{/g, "},\n{");

      // Step 4: Wrap the string in square brackets to make it a valid JSON array
      topics = `[${topics}]`;

      try {
        // Step 5: Parse the JSON string into an array of objects
        const parsedTopics = JSON.parse(topics);
        setTopicsJson(parsedTopics);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        setTopicsJson([]);
      }

      console.log(topics, "Fixed topics 2");
    }
  }, [topics]);

  if (
    topicsJson.length === 0 ||
    topicsJson === null ||
    topicsJson === undefined
  ) {
    return (
      <div className="bg-gradient-to-br from-gray-100 to-gray-200   overflow-y-auto h-[28rem]">
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-2xl font-bold text-gray-800">
              No topics found
            </h1>
            <p className="text-sm text-gray-600">
              Please add some topics to the body elements.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200   overflow-y-auto h-[28rem]">
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
        {topicsJson?.map((entry, index) => (
          <div key={index}>
            <Card className=" hover:shadow-lg transition-shadow duration-300 rounded-none">
              <CardContent className="p-3 flex flex-col">
                <div className="flex items-center mb-2">
                  <BiKey className="h-6 w-6 text-blue-600" />
                  <span className="ml-2 text-xs  text-gray-500 bg-gray-200  px-2 py-0.5 rounded-full">
                    {entry?.keyword}
                  </span>
                </div>
                <h2 className="text-sm font-semibold mb-1.5 text-gray-800">
                  {entry?.title}
                </h2>
                <p className="text-xs text-gray-600 mb-2">
                  {entry?.PageDescription}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-start text-xs">
                    <span className="text-gray-500 mr-1 font-semibold">
                      Topic:
                    </span>
                    <span className="text-gray-700 font-medium">
                      {entry?.Topic}
                    </span>
                  </div>
                  <div className="flex justify-start text-xs">
                    <span className="text-gray-500 mr-1 font-semibold">
                      H1:
                    </span>
                    <span className="text-gray-700 font-medium">
                      {entry?.h1}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
