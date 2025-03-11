import { FixesData } from "./FixesData";
import { useState } from "react";

const FixesContainer = () => {
  // Dummy global state value for now
  const globalFix = "Missing Meta Descriptions";

  const filteredFixes = FixesData?.filter((fix) => fix?.title === globalFix);

  return (
    <section>
      <div className="w-full text-black flex justify-center items-center space-y-6 pt-14 flex-col">
        <span className="text-xs text-black font-bold dark:text-white underline">
          {globalFix}
        </span>

        {filteredFixes?.length > 0 && (
          <>
            <span className="text-xs text-black dark:text-white px-6 pt-4  ">
              {filteredFixes[0].description}
            </span>
            <div className="flex  gap-2 pt-6">
              {filteredFixes[0].links.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  Reference {index + 1}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FixesContainer;
