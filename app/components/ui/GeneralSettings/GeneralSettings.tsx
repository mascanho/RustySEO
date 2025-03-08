"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Shield,
  HardDrive,
  Save,
  RotateCcw,
  Settings,
  Database,
  Search,
  FileText,
  Link,
  BarChart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function GlobalSettings() {
  const [activeSection, setActiveSection] = useState("spider");
  const [expandedSections, setExpandedSections] = useState({
    spider: true,
    extraction: false,
    storage: false,
    export: false,
    api: false,
    system: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section as keyof typeof expandedSections],
    });
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full flex-col bg-gray-50 font-sans">
        {/* Top Bar */}
        <div className="flex h-12 items-center bg-white px-4 shadow-sm border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-800">
            Screaming Frog SEO Spider - Configuration
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-72 bg-white border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">
                Configuration
              </h2>
            </div>

            <div className="overflow-y-auto py-2 text-sm">
              {[
                {
                  id: "spider",
                  icon: Search,
                  subs: ["basic", "advanced", "limits"],
                },
                { id: "extraction", icon: FileText, subs: ["data", "custom"] },
                { id: "storage", icon: Database, subs: ["local", "cloud"] },
                { id: "export", icon: BarChart, subs: ["formats", "schedule"] },
                { id: "api", icon: Link, subs: ["access", "limits"] },
                {
                  id: "system",
                  icon: Settings,
                  subs: ["performance", "memory", "interface"],
                },
              ].map((section) => (
                <div key={section.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50 ${
                          activeSection === section.id
                            ? "bg-gray-100 text-blue-600 border-r-2 border-blue-600"
                            : "text-gray-700"
                        }`}
                        onClick={() => {
                          setActiveSection(section.id);
                          toggleSection(section.id);
                        }}
                      >
                        {expandedSections[
                          section.id as keyof typeof expandedSections
                        ] ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        <section.icon className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          {section.id.charAt(0).toUpperCase() +
                            section.id.slice(1)}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Configure {section.id} settings</p>
                    </TooltipContent>
                  </Tooltip>

                  {expandedSections[
                    section.id as keyof typeof expandedSections
                  ] && (
                    <div className="ml-6 border-l border-gray-200 pl-3">
                      {section.subs.map((sub) => (
                        <div
                          key={sub}
                          className={`py-1.5 px-2 cursor-pointer hover:bg-gray-50 ${
                            activeSection === `${section.id}-${sub}`
                              ? "bg-gray-100 text-blue-600"
                              : "text-gray-700"
                          }`}
                          onClick={() =>
                            setActiveSection(`${section.id}-${sub}`)
                          }
                        >
                          {sub.charAt(0).toUpperCase() + sub.slice(1)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto bg-white p-6">
            {/* Spider Sections */}
            {activeSection === "spider" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Spider Configuration
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Configure how the SEO Spider crawls websites.
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {["basic", "advanced", "limits"].map((sub) => (
                    <div
                      key={sub}
                      className="border border-gray-200 bg-white p-4 rounded-md shadow-sm"
                    >
                      <h3 className="mb-2 flex items-center font-semibold text-gray-800">
                        {sub === "basic" && <Search className="mr-2 h-4 w-4" />}
                        {sub === "advanced" && (
                          <Shield className="mr-2 h-4 w-4" />
                        )}
                        {sub === "limits" && (
                          <HardDrive className="mr-2 h-4 w-4" />
                        )}
                        {sub.charAt(0).toUpperCase() + sub.slice(1)}
                      </h3>
                      <p className="mb-3 text-sm text-gray-600">
                        {sub === "basic" &&
                          "Basic crawl settings and user agent."}
                        {sub === "advanced" &&
                          "Robots.txt, authentication, and proxies."}
                        {sub === "limits" && "Crawl limits, depth, and speed."}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveSection(`spider-${sub}`)}
                      >
                        Configure
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "spider-basic" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Spider - Basic
                </h2>
                <div className="space-y-6">
                  <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                    <h3 className="mb-3 font-semibold text-gray-800">
                      Crawl Settings
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        {
                          id: "follow-internal",
                          label: "Follow Internal Links",
                          defaultChecked: true,
                        },
                        {
                          id: "follow-external",
                          label: "Follow External Links",
                        },
                        {
                          id: "follow-subdomains",
                          label: "Follow Subdomains",
                          defaultChecked: true,
                        },
                        {
                          id: "check-images",
                          label: "Check Images",
                          defaultChecked: true,
                        },
                        {
                          id: "check-css",
                          label: "Check CSS",
                          defaultChecked: true,
                        },
                        {
                          id: "check-js",
                          label: "Check JavaScript",
                          defaultChecked: true,
                        },
                      ].map((item) => (
                        <div key={item.id} className="flex items-start gap-2">
                          <Checkbox
                            id={item.id}
                            defaultChecked={item.defaultChecked}
                          />
                          <Label
                            htmlFor={item.id}
                            className="font-medium text-gray-700"
                          >
                            {item.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                    <h3 className="mb-3 font-semibold text-gray-800">
                      User Agent
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="user-agent"
                          className="mb-1 block font-medium text-gray-700"
                        >
                          User Agent
                        </Label>
                        <Select defaultValue="chrome">
                          <SelectTrigger id="user-agent" className="w-64">
                            <SelectValue placeholder="Select user agent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chrome">
                              Chrome (Windows)
                            </SelectItem>
                            <SelectItem value="firefox">
                              Firefox (Windows)
                            </SelectItem>
                            <SelectItem value="safari">
                              Safari (macOS)
                            </SelectItem>
                            <SelectItem value="mobile">
                              Mobile (Android)
                            </SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label
                          htmlFor="custom-agent"
                          className="mb-1 block font-medium text-gray-700"
                        >
                          Custom User Agent
                        </Label>
                        <Input
                          id="custom-agent"
                          className="w-64"
                          placeholder="Enter custom user agent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "spider-advanced" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Spider - Advanced
                </h2>
                <div className="space-y-6">
                  <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                    <h3 className="mb-3 font-semibold text-gray-800">
                      Robots.txt
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <Checkbox id="respect-robots" defaultChecked />
                        <Label
                          htmlFor="respect-robots"
                          className="font-medium text-gray-700"
                        >
                          Respect robots.txt
                        </Label>
                      </div>
                      <div>
                        <Label
                          htmlFor="custom-robots"
                          className="mb-1 block font-medium text-gray-700"
                        >
                          Custom robots.txt
                        </Label>
                        <Input
                          id="custom-robots"
                          className="w-full"
                          placeholder="Enter custom robots.txt"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                    <h3 className="mb-3 font-semibold text-gray-800">
                      Proxy Settings
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-2">
                        <Checkbox id="use-proxy" />
                        <Label
                          htmlFor="use-proxy"
                          className="font-medium text-gray-700"
                        >
                          Use Proxy
                        </Label>
                      </div>
                      <div>
                        <Label
                          htmlFor="proxy-host"
                          className="mb-1 block font-medium text-gray-700"
                        >
                          Proxy Host
                        </Label>
                        <Input
                          id="proxy-host"
                          className="w-64"
                          placeholder="Proxy host"
                        />
                      </div>
                      <div>
                        <Label
                          htmlFor="proxy-port"
                          className="mb-1 block font-medium text-gray-700"
                        >
                          Proxy Port
                        </Label>
                        <Input
                          id="proxy-port"
                          type="number"
                          className="w-24"
                          placeholder="Port"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "spider-limits" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Spider - Limits
                </h2>
                <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Crawl Limits
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-start gap-2">
                        <Checkbox id="limit-pages" />
                        <Label
                          htmlFor="limit-pages"
                          className="font-medium text-gray-700"
                        >
                          Limit Pages
                        </Label>
                      </div>
                      <Slider
                        defaultValue={[500]}
                        max={10000}
                        step={100}
                        className="mt-2 w-64"
                      />
                    </div>
                    <div>
                      <div className="flex items-start gap-2">
                        <Checkbox id="limit-depth" />
                        <Label
                          htmlFor="limit-depth"
                          className="font-medium text-gray-700"
                        >
                          Limit Crawl Depth
                        </Label>
                      </div>
                      <Slider
                        defaultValue={[10]}
                        max={50}
                        step={1}
                        className="mt-2 w-64"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="crawl-speed"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        Crawl Speed (requests/second)
                      </Label>
                      <Slider
                        defaultValue={[5]}
                        max={20}
                        step={1}
                        className="w-64"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Extraction Sections */}
            {activeSection === "extraction" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Extraction Configuration
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Configure data extraction settings.
                </p>
              </div>
            )}
            {activeSection === "extraction-data" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Extraction - Data
                </h2>
                <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Extracted Elements
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {["title", "meta", "h1", "images", "links"].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <Checkbox id={`extract-${item}`} defaultChecked />
                        <Label
                          htmlFor={`extract-${item}`}
                          className="font-medium text-gray-700"
                        >
                          {item.charAt(0).toUpperCase() + item.slice(1)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeSection === "extraction-custom" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Extraction - Custom
                </h2>
                <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Custom Extraction Rules
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="css-selector"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        CSS Selector
                      </Label>
                      <Input
                        id="css-selector"
                        className="w-full"
                        placeholder=".custom-class"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="xpath"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        XPath
                      </Label>
                      <Input
                        id="xpath"
                        className="w-full"
                        placeholder="//div[@id='content']"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Storage Sections */}
            {activeSection === "storage" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Storage Configuration
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Configure storage options.
                </p>
              </div>
            )}
            {activeSection === "storage-local" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Storage - Local
                </h2>
                <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Local Storage
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="storage-path"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        Storage Path
                      </Label>
                      <Input
                        id="storage-path"
                        className="w-full"
                        defaultValue="C:/ScreamingFrog"
                      />
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox id="auto-save" defaultChecked />
                      <Label
                        htmlFor="auto-save"
                        className="font-medium text-gray-700"
                      >
                        Auto-save Progress
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeSection === "storage-cloud" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Storage - Cloud
                </h2>
                <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Cloud Storage
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="cloud-provider"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        Cloud Provider
                      </Label>
                      <Select>
                        <SelectTrigger id="cloud-provider" className="w-64">
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aws">AWS S3</SelectItem>
                          <SelectItem value="gcp">Google Cloud</SelectItem>
                          <SelectItem value="azure">Azure Blob</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label
                        htmlFor="cloud-bucket"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        Bucket Name
                      </Label>
                      <Input
                        id="cloud-bucket"
                        className="w-64"
                        placeholder="Enter bucket name"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Export Sections */}
            {activeSection === "export" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Export Configuration
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Configure export settings.
                </p>
              </div>
            )}
            {activeSection === "export-formats" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Export - Formats
                </h2>
                <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Export Formats
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {["csv", "excel", "google-sheets", "json"].map((format) => (
                      <div key={format} className="flex items-start gap-2">
                        <Checkbox
                          id={`export-${format}`}
                          defaultChecked={format === "csv"}
                        />
                        <Label
                          htmlFor={`export-${format}`}
                          className="font-medium text-gray-700"
                        >
                          {format.toUpperCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeSection === "export-schedule" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  Export - Schedule
                </h2>
                <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Export Schedule
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <Checkbox id="schedule-export" />
                      <Label
                        htmlFor="schedule-export"
                        className="font-medium text-gray-700"
                      >
                        Enable Scheduled Exports
                      </Label>
                    </div>
                    <div>
                      <Label
                        htmlFor="schedule-time"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        Schedule Time
                      </Label>
                      <Input id="schedule-time" type="time" className="w-32" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Sections */}
            {activeSection === "api" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  API Configuration
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Configure API settings.
                </p>
              </div>
            )}
            {activeSection === "api-access" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  API - Access
                </h2>
                <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    API Access
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="api-key"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        API Key
                      </Label>
                      <Input
                        id="api-key"
                        className="w-full"
                        placeholder="Enter API key"
                      />
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox id="api-enabled" defaultChecked />
                      <Label
                        htmlFor="api-enabled"
                        className="font-medium text-gray-700"
                      >
                        Enable API Access
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeSection === "api-limits" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  API - Limits
                </h2>
                <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    API Rate Limits
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="api-rate"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        Requests per Minute
                      </Label>
                      <Slider
                        defaultValue={[100]}
                        max={1000}
                        step={10}
                        className="w-64"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* System Sections */}
            {activeSection === "system" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  System Configuration
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Configure system settings.
                </p>
              </div>
            )}
            {activeSection === "system-performance" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  System - Performance
                </h2>
                <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Performance Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="threads"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        Number of Threads
                      </Label>
                      <Slider
                        defaultValue={[4]}
                        max={16}
                        step={1}
                        className="w-64"
                      />
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox id="optimize" defaultChecked />
                      <Label
                        htmlFor="optimize"
                        className="font-medium text-gray-700"
                      >
                        Optimize for Speed
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeSection === "system-memory" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  System - Memory
                </h2>
                <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Memory Allocation
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="memory"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        Memory Allocation (MB)
                      </Label>
                      <Slider
                        defaultValue={[2048]}
                        max={16384}
                        step={256}
                        className="w-64"
                      />
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox id="low-memory" />
                      <Label
                        htmlFor="low-memory"
                        className="font-medium text-gray-700"
                      >
                        Low Memory Mode
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeSection === "system-interface" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  System - Interface
                </h2>
                <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
                  <h3 className="mb-3 font-semibold text-gray-800">
                    Interface Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="theme"
                        className="mb-1 block font-medium text-gray-700"
                      >
                        Theme
                      </Label>
                      <Select defaultValue="light">
                        <SelectTrigger id="theme" className="w-64">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-start gap-2">
                      <Checkbox id="tooltips" defaultChecked />
                      <Label
                        htmlFor="tooltips"
                        className="font-medium text-gray-700"
                      >
                        Show Tooltips
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex h-14 items-center justify-end border-t border-gray-200 bg-white px-4 shadow-sm">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
