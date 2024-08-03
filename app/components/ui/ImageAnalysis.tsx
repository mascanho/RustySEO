import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import React from "react";

const ImageAnalysis = ({ images }: { images: any[] }) => {
  const imagesWithAltText = images.filter((image) => image.alt_text);
  const imagesWithoutAltText = images.filter((image) => !image.alt_text);

  return (
    <section className="table_container" id="imagestable">
      <h2 className="text-base text-left pl-1 pt-3 font-bold w-full text-black/60">
        Image analysis
      </h2>

      <div className="h-full overflow-hidden sticky top-0">
        <section
          className={`mx-auto flex flex-col shadow w-full ${images.length === 0 ? "bg-white/40" : "bg-white"}`}
        >
          <div className="overflow-auto h-[32.9rem]">
            <table className="w-full">
              <thead className="text-xs text-left py-2 ">
                <tr>
                  <th className="py-4 border">Image</th>
                  <th>Alt Text</th>
                  <th>Size</th>
                  <th>Link</th>{" "}
                </tr>
              </thead>

              <tbody>
                {images.map((image: any, index: number) => (
                  <tr key={index} className="align-middle">
                    <td className="border-r border-b px-2 py-1 text-center">
                      <a href={image?.link} className="block w-full h-full">
                        <img
                          src={image?.link}
                          alt={image?.alt_text}
                          className="m-auto w-40 h-14 object-contain" // Adjusted size
                        />
                      </a>
                    </td>
                    <td className="border-r border-b px-4 py-1 text-xs">
                      {image.alt_text}
                    </td>
                    <td className="border-r border-b px-2 py-1 text-xs text-center">
                      {image.size_mb} KB
                    </td>
                    <td
                      onClick={() => openBrowserWindow(image.link)}
                      className="border-b px-2 py-1 cursor-pointer text-sm text-blue-500 underline"
                      style={{ width: "100px !important" }}
                    >
                      <span className="w-2">{image.link}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="pb-1 m-2 rounded-md text-xs flex justify-end text-black/50 space-x-4">
          <p className="text-xs">
            Images Found:{" "}
            <span className="px-1 py-0.5 bg-gray-400 text-white rounded-md">
              {images.length}
            </span>
          </p>
          <p>
            With Anchor Text:{" "}
            <span className="px-1 py-0.5 bg-green-400 text-white rounded-md">
              {imagesWithAltText.length}
            </span>
          </p>
          <p>
            Missing Anchor Text:{" "}
            <span className="px-1 py-0.5 bg-red-400 text-white rounded-md min-w-3">
              {imagesWithoutAltText.length}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ImageAnalysis;
