import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import React from "react";

const ImageAnalysis = ({
  imageLinks,
  url,
  altTexts,
}: {
  imageLinks: any[];
  url: string;
  altTexts: string[];
}) => {
  return (
    <div className="relative shadow rounded-md ">
      <h2 className="bg-apple-spaceGray font-semibold text-white p-1   rounded-t-md w-full pb-2 text-center -mb-1 overflow-clip">
        Image Analysis
      </h2>

      <section
        className={`flex flex-col h-[30em] ${imageLinks.length !== 0 ? "bg-white overflow-hidden" : "bg-white/40 overflow-hidden"}  overflow-hidden `}
      >
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white bg-opacity-100 overflow-hidden">
              <tr className="border-b">
                <th className="text-xs w-1/5 border-r px-2 items-center align-middle">
                  Image
                </th>
                <th className="text-xs w-2/5 px-2 border-r align-middle">
                  Alt Text
                </th>
                <th className="text-xs w-2/5 px-2 align-middle">Link</th>
              </tr>
            </thead>
            <tbody>
              {imageLinks.map((image: any, index) => (
                <tr className="crawl-item" key={index}>
                  <td className="px-2 py-1 text-center min-w-16">
                    <a href={image.link} className="block w-full h-full">
                      <img
                        src={image.link}
                        alt={image.alt_text}
                        className="m-auto w-16 h-12 object-contain"
                      />
                    </a>
                  </td>
                  <td className="px-2 py-1 text-xs">{image.alt_text}</td>
                  <td
                    onClick={() => {
                      openBrowserWindow(image.link);
                    }}
                    className="px-2 py-1 cursor-pointer text-sm"
                  >
                    {image.link}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className={`sticky bottom-0  text-center p-2 border-t ${altTexts.length === 0 ? "bg-white/40" : "bg-white"}`}
        >
          <span>Images Found:</span>{" "}
          <span className="text-apple-blue">{altTexts.length}</span>
        </div>
      </section>
    </div>
  );
};

export default ImageAnalysis;
