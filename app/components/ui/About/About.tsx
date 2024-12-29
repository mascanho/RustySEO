// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { IoReload } from "react-icons/io5";

const About: React.FC = () => {
  const [localVersion, setLocalVersion] = useState();
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // check localstorage for appVersion
    const appVersion = localStorage.getItem("app-version");
    setLocalVersion(appVersion);
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      const versions = await invoke("version_check_command");

      const latestVersion = versions.github;
      const localVersion = versions.local;

      setUpdateAvailable(latestVersion !== localVersion);
    } catch (error) {
      console.error("Failed to check for updates:", error);
    }
    setIsChecking(false);
  };

  return (
    <div className="about-section  dark:text-white space-y-4 pl-4 pr-3 text-xs pb-5 ">
      <div>
        <img
          src={"/icon.png"}
          alt="Software Logo"
          className="w-32 h-auto m-auto dark:block hidden animate-pulse"
        />
        <img
          src={"/icon-light.png"}
          alt="Software Logo"
          className="w-32 h-auto m-auto dark:hidden block animate-pulse"
        />
      </div>

      <div className="text-center flex-col items-center justify-center">
        <div className="flex items-center justify-center space-x-2">
          <span>Version: </span>
          <h2 className="text-lg font-bold">{localVersion}</h2>
          <button onClick={checkForUpdates} className="text-xs cursor-pointer">
            <IoReload className="text-[9px] text-brand-bright" />
          </button>
        </div>

        <div className=" h-4">
          {isChecking && (
            <span className="dark:text-red-400 text-red-500">
              Checking for updates...
            </span>
          )}
          {updateAvailable && (
            <div className="flex items-center justify-center gap-1">
              <span>🔴 Update available</span>
              <a
                href="https://github.com/mascanho/RustySEO/releases/latest"
                target="_blank"
                className="hover:opacity-80 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 cursor-pointer"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="border-dashed border-brand-bright border-4 p-3">
        <section className="space-y-3">
          <p className="leading-relaxed">
            This software is experimental, expect it to break. It started as a
            passion project that has evolved into a somewhat functional
            SEO/Marketing toolkit. The goal is to keep improving it and to add
            more features.
          </p>
          <p>Any feedback is greatly appreciated.</p>
        </section>

        <p className="pt-2">
          You can find us on{" "}
          <a
            href="https://github.com/mascanho/RustySEO"
            target="_blank"
            className="underline dark:text-white"
          >
            Github
          </a>{" "}
          and{" "}
          <a
            href="mailto:530rusty@gmail.com"
            className="underline dark:text-white"
          >
            Email
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default About;
