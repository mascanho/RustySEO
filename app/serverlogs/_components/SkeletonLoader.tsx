export const SkeletonLoader = () => (
  <div className="space-y-2 py-0 w-full">
    <div className="flex items-center justify-between"></div>
    {[...Array(6)].map((_, index) => (
      <div
        key={index}
        className="flex items-center justify-between px-4 py-2 border-b dark:border-gray-700"
      >
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);
