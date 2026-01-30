// @ts-nocheck
import { useEffect, useState } from "react";
import useGlobalCrawlStore from "@/store/GlobalCrawlDataStore";

const ImagesTable = ({ height }: { height: number }) => {
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
      <div
        className="text-base text-black/50 dark:text-white/50 flex justify-center items-center m-auto w-full"
        style={{ height: `${height - 35}px` }}
      >
        <span className="text-xs">Select a URL from the HTML table</span>
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
    <div
      className="flex w-full"
      style={{ height: `${height - 35}px` }}
    >
      {/* Table Section */}
      <section className="flex-1 overflow-hidden w-full h-full">
        <div className="h-full overflow-y-auto imagesSubTable">
          <table className="w-full border-collapse border border-gray-200 text-xs table-fixed">
            <thead className="sticky top-0 z-10">
              <tr className="bg-white dark:bg-brand-dark">
                <th className="border border-gray-200 dark:border-gray-700 py-1 px-2 w-10">ID</th>
                <th className="border border-gray-200 dark:border-gray-700 py-1 px-2 w-40">
                  Alt Text
                </th>
                <th className="border border-gray-200 dark:border-gray-700 py-1 px-2 w-80">Link</th>
                <th className="border border-gray-200 dark:border-gray-700 py-1 px-2 w-20">
                  Size (KB)
                </th>
                <th className="border border-gray-200 dark:border-gray-700 py-1 px-2 w-20">
                  Status Code
                </th>
              </tr>
            </thead>

            {selectedTableURL[0].images?.Ok?.length === 0 && (
              <tbody className="w-full">
                <tr className="h-full">
                  <td
                    className="border border-gray-200 dark:border-gray-700 px-2 text-center"
                    colSpan={5}
                    style={{ verticalAlign: "middle" }}
                  >
                    No images found
                  </td>
                </tr>
              </tbody>
            )}

            <tbody>
              {selectedTableURL[0].images.Ok.map(
                (image: [string, string, number, string], index: number) => (
                  <tr
                    key={index}
                    className={`cursor-pointer border-b dark:border-brand-dark/50 ${selectedRowIndex === index
                        ? "bg-brand-bright text-white"
                        : index % 2 === 0
                          ? "bg-gray-50 dark:bg-brand-dark/20"
                          : "bg-white dark:bg-brand-darker"
                      } hover:opacity-80`}
                    onClick={() => handleRowClick(image, index)}
                  >
                    <td className="border-r border-gray-200 dark:border-gray-700 px-2 truncate text-center">
                      {index + 1}
                    </td>
                    <td
                      className="border-r border-gray-200 dark:border-gray-700 px-2 truncate"
                      title={image[1]}
                    >
                      {image[1]}
                    </td>
                    <td
                      className="border-r border-gray-200 dark:border-gray-700 px-2 truncate"
                      title={image[0]}
                    >
                      <span>{image[0]}</span>
                    </td>
                    <td className="border-r border-gray-200 dark:border-gray-700 px-2 truncate text-center">
                      {image[2]} KB
                    </td>
                    <td className="px-2 truncate text-center">
                      {image[4]}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Image Display Section */}
      <section className="flex-1 max-w-md dark:border-l-brand-dark border-l h-full overflow-hidden">
        <div className="h-full flex items-center justify-center p-2 bg-gray-50 dark:bg-brand-darker">
          {selectedImage ? (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <img
                src={selectedImage[0]}
                alt={selectedImage[1]}
                className="rounded-lg object-contain max-h-full max-w-full shadow-md"
              />
              <div className="mt-2 text-xs text-center max-w-full truncate px-2">
                {selectedImage[0]}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 text-xs">
              Click on a table row to display an image.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ImagesTable;
