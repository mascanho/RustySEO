import { Tabs } from "@mantine/core";

const BottomContainer = () => {
  return (
    <div className="border-t">
      <Tabs defaultValue="first" className="overflow-auto">
        <Tabs.List justify="center" className="dark:text-white text-xs">
          <Tabs.Tab value="first">Domain</Tabs.Tab>
          <Tabs.Tab value="third">Improvements</Tabs.Tab>
          <Tabs.Tab value="fourth">Task</Tabs.Tab>
          <Tabs.Tab value="fifth">boo</Tabs.Tab>
        </Tabs.List>
      </Tabs>
    </div>
  );
};

export default BottomContainer;
