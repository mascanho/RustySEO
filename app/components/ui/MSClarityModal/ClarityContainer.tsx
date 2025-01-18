import ClartyDashboard from "./MSCLarityTab";

const ClarityContainer = () => {
  return (
    <div className="flex flex-col">
      <ClartyDashboard />
      <div data-tauri-drag-region className="h-28 w-28 border">
        hello
      </div>
    </div>
  );
};

export default ClarityContainer;
