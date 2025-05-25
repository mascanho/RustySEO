export const SkeletonLoader = () => (
  <div className="space-y-2 py-0 w-full">
    <div className="flex items-center justify-between"></div>
    {[...Array(7)].map((_, index) => (
      <div
        key={index}
        className="flex items-center justify-between px-4 py-2 pt-0 border-b dark:border-gray-700"
      >
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 pulse"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 pulse"></div>
        </div>

        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3 pulse"></div>
      </div>
    ))}
  </div>
);
