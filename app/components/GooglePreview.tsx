"use client";
import useStore from "@/store/Panes";
import { useEffect, useState } from "react";
import { ImGoogle2 } from "react-icons/im";

const GooglePreview = ({
  pageTitle,
  pageDescription,
  favicon_url,
}: {
  favicon_url: string[];
  pageTitle: any;
  url: string;
  pageDescription: any;
}) => {
  // get the domain name only from the url
  const [url, setUrl] = useState("");
  const { Visible } = useStore();

  useEffect(() => {
    // Fetch the URL from the session storage
    const urlStored = sessionStorage?.getItem("url") || "";

    if (urlStored) {
      setUrl(urlStored);
    }
  }, [pageTitle]);

  const capitalizeFirstLetter = (str: any) =>
    str.charAt(0).toUpperCase() + str.slice(1);
  const domainWithoutLastPart =
    url &&
    url
      .replace(/^https?:\/\//, "") // Remove http:// or https://
      .replace(/^www\./, "") // Remove www.
      .split(/[/?#]/)[0] // Split by /, ?, or # and take the first part
      .split(".") // Split by dots
      .slice(0, -1) // Remove the last part
      .join(".") // Rejoin the remaining parts
      .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize the first letter

  const capitalizedDomain = capitalizeFirstLetter(domainWithoutLastPart);

  return (
    <div
      className={`${Visible.serp ? "block" : "hidden"}  naked_table shadow overflow-hidden rounded-md ${pageTitle.length === 0 ? "bg-white/40" : "bg-white"}`}
    >
      <h2 className="flex items-center">
        <ImGoogle2 className="mr-1.5" />
        SERP Preview
      </h2>

      <section
        className={`px-8 h-full  pb-24 min-h-28 flex items-center  w-full rounded-md overflow-auto`}
      >
        <div className="w-full">
          <div className="flex items-center mb-2 ">
            {favicon_url[0] && (
              <div className="h-fit p-1.5 bg-white rounded-full border -mr-2 ">
                <img
                  src={favicon_url[0]}
                  alt="favicon"
                  className="rounded-full min-w-10 w-fullw-full max-w-10 max-h-10 object-contain"
                />
              </div>
            )}
            {favicon_url[0] && (
              <div className="ml-4">
                <a
                  className="text-blue-800 dark:text-white"
                  style={{
                    textDecoration: "none",
                    fontSize: "18px",
                  }}
                >
                  {domainWithoutLastPart}
                </a>
                <div
                  style={{
                    color: "green",
                    fontSize: "12px",
                  }}
                >
                  {url}
                </div>
              </div>
            )}
          </div>
          <a
            className="mt-10 text-blue-500 dark:text-blue-400"
            style={{
              textDecoration: "none",
              fontSize: "18px",
            }}
          >
            {pageTitle.length > 60
              ? pageTitle.substring(0, 57) + "..."
              : pageTitle}
          </a>
          <div style={{ fontSize: "14px" }} className="dark:text-white/60 mt-1">
            {pageDescription.length > 60
              ? pageDescription.substring(0, 57) + "..."
              : pageDescription}
          </div>
        </div>{" "}
      </section>
    </div>
  );
};

export default GooglePreview;
