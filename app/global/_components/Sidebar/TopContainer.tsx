import { Tabs } from "@mantine/core";
import GeneralTopSideBarContainer from "./General/GeneralTopSideBarContainer";
import IssuesContainer from "./Issues/IssuesContainer";

const TopContainer = () => {
  return (
    <div className="h-full">
      <Tabs defaultValue="first" className="overflow-auto">
        <Tabs.List justify="center" grow className="dark:text-white text-xs ">
          <Tabs.Tab value="first">General</Tabs.Tab>
          <Tabs.Tab value="issues">Issues</Tabs.Tab>
          <Tabs.Tab value="fourth">Struct</Tabs.Tab>
          <Tabs.Tab value="fifth">Crawls</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="first">
          <GeneralTopSideBarContainer />
        </Tabs.Panel>

        <Tabs.Panel value="issues">
          <IssuesContainer />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default TopContainer;
