import useStore from "@/store/Panes";
import { useEffect, useState } from "react";
import { PiLinkSimpleBold } from "react-icons/pi";
const LinkAnalysis = ({
  links,
  visibleLinks,
}: {
  visibleLinks: any[];
  links: any;
}) => {
  const [linksTable, setLinksTable] = useState<any[]>(visibleLinks);
  const links404 = links.filter((link: any) => link?.status_code === 404);
  const { Visible } = useStore();
  const linksExternal = links.filter((link: any) => link?.is_external === true);
  const linksInternal = links.filter(
    (link: any) => link?.is_external === false,
  );
  const linksMissingAnchor = visibleLinks.filter((link: any) => !link[1]);

  console.log(links, "Links");
  console.log(visibleLinks, "Visible Links");

  useEffect(() => {
    setLinksTable(visibleLinks);
  }, [visibleLinks]);

  return (
    <section
      className={`links ${Visible.links ? "block" : "hidden"}  table_container  `}
    >
      <h2 className=" text-left text-sm pl-1 flex items-center pt-3 font-bold w-full ">
        <PiLinkSimpleBold className="mr-1.5" /> Link Analysis
      </h2>

      <div className="h-full overflow-hidden sticky top-0">
        <section
          className={`mx-auto flex flex-col  w-full ${visibleLinks.length === 0 ? "bg-white/40" : "bg-white"}`}
        >
          <div className="relative">
            <table className="w-full">
              <thead className="text-xs text-left py-2">
                <tr>
                  <th className="w-1/3">Anchor</th>
                  <th className="w-2/3">Link</th>
                </tr>
              </thead>
            </table>
            <div className="overflow-auto custom-scrollbar scroll-m-0 h-[23rem]">
              <table className="w-full">
                <tbody>
                  {linksTable.map((link: any, index: any) => (
                    <tr key={index} className="align-middle">
                      <td className="border-r border-b">
                        <span className="block py-1 px-3 w-[180px]">
                          {link[1] || link?.description}
                        </span>
                      </td>
                      <td className="border-b">
                        <a
                          href={link[0] || link?.url}
                          className="block py-1 px-3 text-sm text-blue-500"
                          aria-label={`Link to ${link[0]}`}
                        >
                          {link[0] || link?.url}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <footer className="pb-1 m-2 rounded-md text-xs flex justify-end text-black/50 space-x-3 pt-0.5">
          <p
            className="text-xs cursor-pointer"
            onClick={() => setLinksTable(visibleLinks)}
          >
            Total:{" "}
            <span className="px-1 py-0.5 bg-gray-400 text-white rounded-md">
              {visibleLinks.length}
            </span>
          </p>
          <p
            className="text-xs cursor-pointer"
            onClick={() => setLinksTable(linksInternal)}
          >
            Internal:{" "}
            <span className="px-1 py-0.5 bg-blue-400 text-white rounded-md">
              {linksInternal.length}
            </span>
          </p>
          <p
            className="text-xs cursor-pointer"
            onClick={() => setLinksTable(linksExternal)}
          >
            External:{" "}
            <span className="px-1 py-0.5 bg-blue-400 text-white rounded-md">
              {linksExternal.length}
            </span>
          </p>
          <p
            className="text-xs cursor-pointer"
            onClick={() => setLinksTable(linksMissingAnchor)}
          >
            Missing Anchor:{" "}
            <span className="px-1 py-0.5 bg-red-400 text-white rounded-md min-w-3">
              {visibleLinks.filter((link) => !link[1]).length}
            </span>
          </p>
          <p onClick={() => setLinksTable(links404)} className="cursor-pointer">
            404:{" "}
            <span className="px-1 py-0.5 bg-red-400 text-white rounded-md min-w-3">
              {links404.length}
            </span>
          </p>
        </footer>
      </div>
    </section>
  );
};

export default LinkAnalysis;
