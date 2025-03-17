import BottomContainer from "./BottomContainer";
import TopContainer from "./TopContainer";

function SidebarContainer() {
  return (
    <div
      className={`pt-[5.1rem] w-full flex-1  bg-white dark:bg-brand-darker h-full border-t border-l  flex flex-col dark:text-white justify-between dark:border-brand-dark  `}
    >
      <div className="h-auto">
        <TopContainer />
      </div>
      <div className="flex-1 flex flex-col dark:bg-gray-900 bg-slate-100  ">
        <BottomContainer />
      </div>
    </div>
  );
}

export default SidebarContainer;
