"use client";
import { ImGoogle2 } from "react-icons/im";

const GooglePreview = ({
  pageTitle,
  pageDescription,
  url,
  favicon_url,
}: {
  favicon_url: string[];
  pageTitle: any;
  url: string;
  pageDescription: any;
}) => {
  // get the domain name only from the url

  const capitalizeFirstLetter = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const domainWithoutLastPart = url
    .replace(/^https?:\/\//, "") // Remove http:// or https://
    .replace(/^www\./, "") // Remove www.
    .split(/[/?#]/)[0] // Split by /, ?, or # and take the first part
    .split(".") // Split by dots
    .slice(0, -1) // Remove the last part
    .join(".") // Rejoin the remaining parts
    .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize the first letter

  const capitalizedDomain = capitalizeFirstLetter(domainWithoutLastPart);

  console.log(capitalizedDomain);

  return (
    <div
      className={`naked_table shadow overflow-hidden rounded-md ${pageTitle.length === 0 ? "bg-white/40" : "bg-white"}`}
    >
      <h2 className="flex items-center">
        <ImGoogle2 className="mr-1.5" />
        SERP Preview
      </h2>

      <section
        className={`px-8 h-full  pb-24 min-h-28 flex items-center  w-full rounded-md overflow-auto`}
      >
        <div>
          <div className="flex items-center mb-2">
            <div className="w-fit h-fit p-1 bg-white rounded-full -mr-2">
              <img
                src={favicon_url[0]}
                alt="favicon"
                className="rounded-full w-8 h-8 object-cover"
              />
            </div>
            <div className="ml-4">
              <a
                className="text-black dark:text-white"
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
          </div>
          <a
            className="mt-20"
            style={{
              textDecoration: "none",
              color: "#1a0dab",
              fontSize: "18px",
            }}
          >
            {pageTitle}
          </a>
          <div style={{ color: "#4d5156", fontSize: "14px" }}>
            {pageDescription}
          </div>
        </div>{" "}
      </section>
    </div>
  );
};

export default GooglePreview;
