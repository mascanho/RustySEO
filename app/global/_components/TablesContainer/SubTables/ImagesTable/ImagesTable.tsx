// @ts-nocheck
import { useEffect, useState } from "react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

const ImagesTable = () => {
  const { selectedTableURL } = useGlobalCrawlStore();
  const [selectedImage, setSelectedImage] = useState<
    [string, string, number, string] | null
  >(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  useEffect(() => {
    setSelectedImage(null);
    setSelectedRowIndex(null);
  }, [selectedTableURL]);

  // Fallback if no images are found
  if (!selectedTableURL?.[0]?.images?.Ok) {
    return (
      <div className="text-base text-black/50 dark:text-white/50 h-full flex justify-center items-center  m-auto w-full dark:text-white/50">
        <span>No images found</span>
      </div>
    );
  }

  // Handle table row click
  const handleRowClick = (
    image: [string, string, number, string],
    index: number,
  ) => {
    if (selectedRowIndex === index) {
      // Deselect the row if it's already selected
      setSelectedRowIndex(null);
      setSelectedImage(null);
    } else {
      // Select the new row
      setSelectedRowIndex(index);
      setSelectedImage(image);
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Table Section */}
      <section className="flex-1 overflow-hidden w-full">
        <div className="max-h-[30vh] overflow-y-auto imagesSubTable ">
          <table className="w-full border-collapse border border-gray-200 text-xs table-fixed">
            <thead>
              <tr className="sticky top-0 bg-white">
                <th className="border border-gray-200 py-0 px-2 w-10">ID</th>
                <th className="border border-gray-200 py-0 px-2 w-40">
                  Anchor
                </th>
                <th className="border border-gray-200 py-0 px-2 w-80">Link</th>
                <th className="border border-gray-200 py-0 px-2 w-20">
                  Size (KB)
                </th>
              </tr>
            </thead>
            <tbody>
              {selectedTableURL[0].images.Ok.map(
                (image: [string, string, number, string], index: number) => (
                  <tr
                    key={index}
                    className={`cursor-pointer  ${
                      selectedRowIndex === index
                        ? "bg-brand-bright text-white"
                        : ""
                    }`}
                    onClick={() => handleRowClick(image, index)}
                  >
                    <td className="border border-gray-200 px-2 truncate">
                      {index + 1}
                    </td>{" "}
                    {/* ID */}
                    <td className="border border-gray-200 px-2 truncate">
                      {image[1]}
                    </td>{" "}
                    {/* Anchor Text */}
                    <td className="border border-gray-200 px-2 truncate">
                      <span>{image[0]}</span>
                    </td>{" "}
                    {/* Image Link */}
                    <td className="border border-gray-200 px-2 truncate">
                      {image[2]} KB
                    </td>{" "}
                    {/* Image Size */}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Image Display Section */}
      <section className="flex-1 max-w-md dark:border-l-brand-dark border-l">
        <div className="sticky top-0 h-full flex items-center justify-center">
          {selectedImage ? (
            <div className="flex flex-col items-center h-full mx-2 rounded">
              <img
                src={selectedImage[0]} // URL of the image
                alt={selectedImage[1]} // Alt text for the image
                className="rounded-lg object-contain h-[300px] w-auto shadow-md"
              />
            </div>
          ) : (
            <div className="text-center text-gray-500 text-xs">
              Click on a table row to display an image.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ImagesTable;
