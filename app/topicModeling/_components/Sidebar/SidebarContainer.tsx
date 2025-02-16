import BottomContainer from "./BottomContainer";
import TopContainer from "./TopContainer";

function SidebarContainer() {
  return (
    <div
      className={`mt-[5.2rem]  bg-white dark:bg-brand-darker h-full border-t border border-t-red-500 flex flex-col dark:text-white justify-between`}
    >
      <div className="h-full">{/* <TopContainer /> */}</div>
      <div className="h-full">
        <BottomContainer />
      </div>
    </div>
  );
}

export default SidebarContainer;
