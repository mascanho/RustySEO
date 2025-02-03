import { Tabs } from "@mantine/core";
import GeneralTopSideBarContainer from "./General/GeneralTopSideBarContainer";

const TopContainer = () => {
  return (
    <div>
      <Tabs defaultValue="first" className="overflow-auto">
        <Tabs.List
          justify="center"
          className="dark:text-white text-xs font-bold"
        >
          <Tabs.Tab value="first">General</Tabs.Tab>
          <Tabs.Tab value="third">Issues</Tabs.Tab>
          <Tabs.Tab value="fourth">Structure</Tabs.Tab>
          <Tabs.Tab value="fifth">Crawls</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="first">
          <GeneralTopSideBarContainer />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default TopContainer;
