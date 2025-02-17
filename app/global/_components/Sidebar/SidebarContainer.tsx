import BottomContainer from "./BottomContainer";
import TopContainer from "./TopContainer";

function SidebarContainer() {
  return (
    <div
      className={`mt-[5rem] w-full flex-1  bg-white dark:bg-brand-darker h-full border-t border-l  flex flex-col dark:text-white justify-between dark:border-brand-dark  `}
    >
      <div className="h-full">
        <TopContainer />
      </div>
      <div className="h-full flex-1 dark:bg-gray-900 bg-slate-100 ">
        <BottomContainer />
      </div>
    </div>
  );
}

export default SidebarContainer;
