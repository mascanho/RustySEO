// @ts-nocheck
const findDuplicateTitles = (arr) => {
  const titleMap = new Map(); // Map to track titles and their occurrences

  // Helper function to normalize titles
  const normalizeTitle = (title) => {
    return title?.trim().toLowerCase(); // Trim whitespace and convert to lowercase
  };

  // Step 1: Iterate through the array and populate the map
  arr.forEach((item) => {
    const title = normalizeTitle(item?.title?.[0]?.title); // Access and normalize the nested title
    if (title) {
      if (titleMap.has(title)) {
        titleMap.get(title).push(item); // Add to existing group if title exists
      } else {
        titleMap.set(title, [item]); // Create a new group if title doesn't exist
      }
    }
  });

  // Step 2: Filter out titles that have more than one occurrence
  const duplicates = Array.from(titleMap.values()).filter(
    (group) => group.length > 1,
  );

  // Step 3: Flatten the array of groups into a single array
  return duplicates.flat();
};
export default findDuplicateTitles;
