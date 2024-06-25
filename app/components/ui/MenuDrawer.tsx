"use client";
import { useState } from "react";
import { Drawer, Button, Group } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { MENUS } from "@/app/Data/Menus";
import { usePathname } from "next/navigation";

function MenuDrawer() {
  const [opened, setOpened] = useState(false);
  const mobile = useMediaQuery("(max-width: 768px)");

  const pathname = usePathname();

  console.log(pathname);

  let path = pathname;
  if (path === "/") {
    path = "Home";
  }

  if (path === "/sitemaps") {
    path = "Sitemaps";
  }

  return (
    <>
      <Drawer
        offset={mobile ? 0 : 8}
        radius="md"
        opened={opened}
        onClose={() => setOpened(false)}
        size={mobile ? "xs" : "13em"}
        className="overflow-hidden"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <div className="flex flex-col space-y-3">
          {MENUS.map((menu) => {
            return (
              <a
                key={menu.name}
                href={menu.link}
                className="navbarMain"
                onClick={() => setOpened(false)}
              >
                {menu.name}
              </a>
            );
          })}
        </div>
      </Drawer>

      <Group className="flex items-center justify-center pt-2">
        <button onClick={() => setOpened(true)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width={24}
            height={24}
            color={"#000000"}
            fill={"none"}
          >
            <path
              d="M15.0001 17C14.2006 17.6224 13.1504 18 12.0001 18C10.8499 18 9.79965 17.6224 9.00012 17"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M2.35151 13.2135C1.99849 10.9162 1.82198 9.76763 2.25629 8.74938C2.69059 7.73112 3.65415 7.03443 5.58126 5.64106L7.02111 4.6C9.41841 2.86667 10.6171 2 12.0001 2C13.3832 2 14.5818 2.86667 16.9791 4.6L18.419 5.64106C20.3461 7.03443 21.3097 7.73112 21.744 8.74938C22.1783 9.76763 22.0018 10.9162 21.6487 13.2135L21.3477 15.1724C20.8473 18.4289 20.597 20.0572 19.4291 21.0286C18.2612 22 16.5538 22 13.1389 22H10.8613C7.44646 22 5.73903 22 4.57112 21.0286C3.40321 20.0572 3.15299 18.4289 2.65255 15.1724L2.35151 13.2135Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="">{path}</span>
      </Group>
    </>
  );
}
export default MenuDrawer;
