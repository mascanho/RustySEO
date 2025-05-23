import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import useStore from "@/store/Panes";
import useOnPageSeo from "@/store/storeOnPageSeo";
import React, { useEffect, useState } from "react";
import { BsImage } from "react-icons/bs";

const ImageAnalysis = ({ images }: { images: any[] }) => {
  const imagesWithAltText = images.filter((image) => image.alt_text);
  const imagesWithoutAltText = images.filter((image) => !image.alt_text);
  const { Visible } = useStore();
  const setImagesStore = useOnPageSeo((state) => state.setSeoImages);
  const [filteredImages, setFilteredImages] = useState<any[]>(images);

  useEffect(() => {
    setImagesStore(imagesWithoutAltText);
    setFilteredImages(images);
  }, [images]);

  return (
    <section
      className={`images table_container ${Visible.images ? "block" : "hidden"}`}
    >
      <h2 className="text-base text-left flex items-center pl-1 pt-3 font-bold w-full text-black/60">
        <BsImage className="mr-1.5" /> Image Analysis
      </h2>

      <div className="h-full overflow-hidden sticky top-0">
        <section
          className={`mx-auto flex flex-col w-full ${
            images.length === 0 ? "bg-white/40" : "bg-white"
          }`}
        >
          <div className="relative">
            <div className="overflow-auto custom-scrollbar h-[25.3rem]">
              <table className="w-full dark:bg-brand-darker">
                <tbody>
                  {(filteredImages || []).map((image: any, index: number) => (
                    <tr key={index} className="align-middle">
                      <td className="border-r border-b px-2 py-1 text-center">
                        <a
                          href={image?.link}
                          className="block w-full h-full"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={image?.link}
                            alt={image?.alt_text || "No alt text provided"}
                            className="m-auto w-40 min-w-[100px] h-14 object-contain"
                          />
                        </a>
                      </td>
                      <td className="min-w-[90px] border-r border-b px-4 py-1 text-xs">
                        {image.alt_text || ""}
                      </td>
                      <td className="border-r border-b px-2 py-1 text-xs min-w-[70px] text-center">
                        {image.size_mb} KB
                      </td>
                      <td
                        onClick={() => openBrowserWindow(image.link)}
                        className="border-b px-2 py-1 cursor-pointer text-sm text-blue-500 min-w-[200px]"
                      >
                        <span className="w-2">{image.link}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <div className="m-2 pt-2 rounded-md text-xs flex justify-end text-black/50 space-x-4">
          <p
            onClick={() => setFilteredImages(images)}
            className="text-xs cursor-pointer"
          >
            Images Found:{" "}
            <span className="px-1 py-0.5 bg-gray-400 text-white rounded-md">
              {images.length}
            </span>
          </p>
          <p>
            With Alt Text:{" "}
            <span className="px-1 py-0.5 bg-green-400 text-white rounded-md">
              {imagesWithAltText.length}
            </span>
          </p>
          <p
            className="cursor-pointer"
            onClick={() => setFilteredImages(imagesWithoutAltText)}
          >
            Missing Alt Text:{" "}
            <span className="px-1 py-0.5 bg-red-400 text-white rounded-md">
              {imagesWithoutAltText.length}
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ImageAnalysis;
