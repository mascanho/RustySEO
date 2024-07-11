import { Menu, Button, Text, rem, Drawer, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconSettings,
  IconSearch,
  IconPhoto,
  IconMessageCircle,
  IconTrash,
  IconArrowsLeftRight,
} from "@tabler/icons-react";
import { CgWebsite } from "react-icons/cg";
import Todo from "./Todo";
import TodoItems from "./TodoItems";
import { IoCreateOutline } from "react-icons/io5";
import { RiTodoLine } from "react-icons/ri";

function TodoMenu({ url }: { url: string }) {
  const [opened, { open, close }] = useDisclosure(false);
  const [openedModal, { open: openModal, close: closeModal }] =
    useDisclosure(false);

  return (
    <>
      <Modal
        opened={openedModal}
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        closeOnEscape
        closeOnClickOutside
        onClose={closeModal}
        title=""
        centered
      >
        <Todo url={url} close={close} />
      </Modal>

      <Drawer
        offset={8}
        radius="md"
        opened={opened}
        onClose={close}
        title=""
        size="sm"
        position="left"
        shadow="xl"
        closeOnEscape
        closeOnClickOutside
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
      >
        <TodoItems url={url} />
      </Drawer>

      <Menu shadow="md" width={180} zIndex={0}>
        <Menu.Target>
          <button className="flex items-center active:scale-95">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width={22}
              height={22}
              color={"#000000"}
              fill={"none"}
            >
              <path
                d="M12 8V16M16 12L8 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            <span className="ml-1 mt-1">Tasks</span>
          </button>
        </Menu.Target>

        <Menu.Dropdown className="relative -z-10">
          <div className="w-3 h-3 border-l border-t rotate-45 absolute left-20 -top-2 bg-white -z-10" />
          <Menu.Label>Tasks</Menu.Label>
          <Menu.Item
            className="flex items-center"
            leftSection={
              <IoCreateOutline
                style={{
                  width: rem(20),
                  paddingBottom: rem(1),
                  height: rem(20),
                }}
              />
            }
            onClick={openModal}
          >
            <span className="mt-10 text-sm m-auto"> Create Task</span>
          </Menu.Item>

          <Menu.Divider />

          <Menu.Label>Task List</Menu.Label>
          <Menu.Item
            onClick={open}
            leftSection={
              <RiTodoLine style={{ width: rem(20), height: rem(20) }} />
            }
          >
            View All
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </>
  );
}
export default TodoMenu;
