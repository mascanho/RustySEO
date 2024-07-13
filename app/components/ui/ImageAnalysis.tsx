import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import React from "react";

const ImageAnalysis = ({ images }: { images: any[] }) => {
  return (
    <div className="relative shadow rounded-md overflow-hidden">
      <h2 className="bg-apple-spaceGray font-semibold text-white rounded-t-md w-full pt-1 text-center overflow-clip">
        Image Analysis
      </h2>

      <section
        className={`flex flex-col h-[30em] ${
          images.length !== 0 ? "bg-white" : "bg-white/40"
        } overflow-hidden`}
      >
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white bg-opacity-100 ">
              <tr className="border-b">
                <th className="text-xs w-1/5 border-r px-2 align-middle">
                  Image
                </th>
                <th className="text-xs w-2/5 px-2 border-r align-middle">
                  Alt Text
                </th>
                <th className="text-xs w-1/5 px-2 border-r align-middle">
                  Size
                </th>
                <th className="text-xs w-2/5 px-2 align-middle">Link</th>
              </tr>
            </thead>
            <tbody>
              {images.map((image: any, index: number) => (
                <tr className="border-b" key={index}>
                  <td className="px-2 py-1 text-center">
                    <a href={image?.link} className="block w-full h-full">
                      <img
                        src={image?.link}
                        alt={image?.alt_text}
                        className="m-auto w-16 h-12 object-contain"
                      />
                    </a>
                  </td>
                  <td className="px-2 py-1 text-xs">{image.alt_text}</td>
                  <td className="px-2 py-1 text-xs text-center">
                    {image.size_mb} KB
                  </td>
                  <td
                    onClick={() => openBrowserWindow(image.link)}
                    className="px-2 py-1 cursor-pointer text-sm text-blue-500 underline"
                  >
                    {image.link}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          className={`sticky bottom-0 text-xs text-center p-2 border-t rounded-b-md ${
            images.length === 0 ? "bg-white/40" : "bg-white"
          }`}
        >
          <span>Images Found:</span>{" "}
          <span className="text-apple-blue">{images.length}</span>
        </div>
      </section>
    </div>
  );
};

export default ImageAnalysis;
