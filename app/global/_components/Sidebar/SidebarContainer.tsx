import BottomContainer from "./BottomContainer";
import TopContainer from "./TopContainer";

function SidebarContainer() {
  return (
    <div
      className={`mt-[5rem] w-full flex-1  bg-white dark:bg-brand-darker h-full border-t border  flex flex-col dark:text-white justify-between`}
    >
      <div className="h-full">
        <TopContainer />
      </div>
      <div className="h-full">
        <BottomContainer />
      </div>
    </div>
  );
}

export default SidebarContainer;
