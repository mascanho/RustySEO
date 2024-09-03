import { Card, CardContent } from "@/components/ui/card";

import { BiKey } from "react-icons/bi";

const dataEntries = [
  {
    keyword: "supply chain management",
    Topic: "Optimizing Supply Chain Efficiency",
    title: "Best Practices for Supply Chain Management", // Changed to title
    PageDescription:
      "Learn about strategies and tools for effective supply chain management.",
    h1: "Mastering Supply Chain Management",
    icon: <BiKey className="h-6 w-6 text-blue-600" />, // Smaller icon
  },
  {
    keyword: "supply chain management",
    Topic: "Optimizing Supply Chain Efficiency",
    title: "Best Practices for Supply Chain Management", // Changed to title
    PageDescription:
      "Learn about strategies and tools for effective supply chain management.",
    h1: "Mastering Supply Chain Management",
    icon: <BiKey className="h-6 w-6 text-blue-600" />, // Smaller icon
  },
  {
    keyword: "supply chain management",
    Topic: "Optimizing Supply Chain Efficiency",
    title: "Best Practices for Supply Chain Management", // Changed to title
    PageDescription:
      "Learn about strategies and tools for effective supply chain management.",
    h1: "Mastering Supply Chain Management",
    icon: <BiKey className="h-6 w-6 text-blue-600" />, // Smaller icon
  },
  {
    keyword: "supply chain management",
    Topic: "Optimizing Supply Chain Efficiency",
    title: "Best Practices for Supply Chain Management", // Changed to title
    PageDescription:
      "Learn about strategies and tools for effective supply chain management.",
    h1: "Mastering Supply Chain Management",
    icon: <BiKey className="h-6 w-6 text-blue-600" />, // Smaller icon
  },
  {
    keyword: "supply chain management",
    Topic: "Optimizing Supply Chain Efficiency",
    title: "Best Practices for Supply Chain Management", // Changed to title
    PageDescription:
      "Learn about strategies and tools for effective supply chain management.",
    h1: "Mastering Supply Chain Management",
    icon: <BiKey className="h-6 w-6 text-blue-600" />, // Smaller icon
  },
];

export default function Component() {
  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200   overflow-y-auto h-[28rem]">
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1">
        {dataEntries.map((entry, index) => (
          <div key={index}>
            <Card className=" hover:shadow-lg transition-shadow duration-300 rounded-none">
              <CardContent className="p-3 flex flex-col">
                <div className="flex items-center mb-2">
                  {entry.icon}
                  <span className="ml-2 text-xs  text-gray-500 bg-gray-200  px-2 py-0.5 rounded-full">
                    {entry.keyword}
                  </span>
                </div>
                <h2 className="text-sm font-semibold mb-1.5 text-gray-800">
                  {entry.title}
                </h2>
                <p className="text-xs text-gray-600 mb-2">
                  {entry.PageDescription}
                </p>
                <div className="space-y-1">
                  <div className="flex justify-start text-xs">
                    <span className="text-gray-500 mr-1 font-semibold">
                      Topic:
                    </span>
                    <span className="text-gray-700 font-medium">
                      {entry.Topic}
                    </span>
                  </div>
                  <div className="flex justify-start text-xs">
                    <span className="text-gray-500 mr-1 font-semibold">
                      H1:
                    </span>
                    <span className="text-gray-700 font-medium">
                      {entry.h1}
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
