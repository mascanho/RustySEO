import React from "react";
import { CgWebsite } from "react-icons/cg";
import MenuEl from "./Menu";
import { useDisclosure } from "@mantine/hooks";
import { Drawer, Button } from "@mantine/core";

const SubBar = ({
  domainWithoutLastPart,
  url,
}: {
  domainWithoutLastPart: string;
  url: string;
}) => {
  const [opened, { open, close }] = useDisclosure(false);
  return (
    <>
      <Drawer
        offset={8}
        radius="md"
        opened={opened}
        onClose={close}
        title="Todo"
        size="sm"
        className="overflow-hidden"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        transitionProps={{
          transition: "scale-x",
          duration: 200,
          timingFunction: "ease",
        }}
        position="left"
        closeOnEscape
        trapFocus
        withCloseButton
        zIndex={1000}
        closeOnClickOutside
        closeButtonProps={{
          icon: <CgWebsite />,
        }}
      >
        {/* Drawer content */}
      </Drawer>

      <section className="w-full flex items-center space-x-2 justify-between -mt-2">
        <div className="flex items-center space-x-2">
          <div className="uppercase overflow-x-hidden py-1 font-semibold flex items-center space-x-2 border border-apple-spaceGray border-2 text-sm shadow px-3 rounded-full">
            <CgWebsite />
            <span>{domainWithoutLastPart || "RustySEO"}</span>
          </div>
          <span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={16}
              height={16}
              color={"#000000"}
              fill={"none"}
            >
              <path
                d="M20 12L4 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 17C15 17 20 13.3176 20 12C20 10.6824 15 7 15 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="flex items-center space-x-1">
            <span className="mt-1">{url}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span
            className="font-semibold pt-[3px] cursor-pointer"
            onClick={open}
          >
            + Create task
          </span>
          <MenuEl />
        </div>
      </section>
    </>
  );
};

export default SubBar;
