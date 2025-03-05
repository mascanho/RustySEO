// @ts-nocheck
import React, { useState } from "react";

const ResponseHeaders = ({ data, height }) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log(height, "from the height");

  if (!data?.[0]?.headers) {
    return (
      <div
        className={`h-[${height}px] w-full flex items-center justify-center`}
      >
        <span className="text-xs mt-24 text-black/50 dark:text-white/50">
          No URL selected
        </span>
      </div>
    );
  }

  const headers = data[0].headers;

  return (
    <div>
      <div className="px-4">
        {error && <div className="text-red-600 mb-4 text-xs">{error}</div>}

        <div className="bg-white dark:bg-brand-darker dark:text-white  rounded pb-3">
          <h3 className="m-0 text-xs font-semibold text-xs dark:text-white/50 mb-1">
            Response Headers
          </h3>
          <div>
            {headers.map((header, index) => (
              <div
                key={index}
                className="grid grid-cols-[300px_1fr] gap-2 py-1 border-b border-gray-200 last:border-b-0 dark:border-white/30 text-xs"
              >
                <span className="font-mono font-semibold text-xs text-black dark:text-white break-all">
                  {header[0]}
                </span>
                <span className="font-mono text-xs break-all">{header[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseHeaders;
