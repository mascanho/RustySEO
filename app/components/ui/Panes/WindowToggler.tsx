import useStore from "@/store/Panes";
import React from "react";
import { FaToggleOn, FaToggleOff } from "react-icons/fa";

const WindowSelector = () => {
  const { Visible, toggleComponent }: any = useStore();

  const components = [
    { id: "widgets", label: "Widgets" },
    { id: "head", label: "Head" },
    { id: "charts", label: "Charts" },
    { id: "serp", label: "SERP" },
    { id: "opengraph", label: "Open Graph" },
    { id: "headings", label: "Headings" },
    { id: "links", label: "Links" },
    { id: "images", label: "Images" },
    { id: "networkRequests", label: "Network Requests" },
    { id: "scripts", label: "Scripts" },
    { id: "tbw", label: "TBW" },
    { id: "renderBlocking", label: "Render Blocking" },
    { id: "schema", label: "Schema" },
  ];

  console.log(Visible);

  return (
    <div className="text-xs pt-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 gap-x-8 pb-4 px-4">
        {components.map((component: any) => (
          <div key={component.id} className="rounded-lg">
            <button
              className={`flex items-center justify-between w-full px-4 py-2 rounded-md transition-colors duration-300 ${
                Visible[component.id]
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => toggleComponent(component.id)}
            >
              <span>{component.label}</span>
              {Visible[component.id] ? <FaToggleOn /> : <FaToggleOff />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WindowSelector;
