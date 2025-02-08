// @ts-nocheck

const useFindDuplicateTitles = (arr, key) => {
  const map = new Map();

  arr.forEach((item) => {
    const value = item?.title?.[0]?.title; // Use the correct variable name: `item`

    if (map.has(value)) {
      map.get(value).push(item); // Add to existing array if key exists
    } else {
      map.set(value, [item]); // Create a new array if key doesn't exist
    }
  });

  // Filter out entries with more than one occurrence
  const duplicates = Array.from(map.values()).filter(
    (group) => group.length > 1,
  );

  return duplicates.flat(); // Flatten the array of arrays into a single array
};

export default useFindDuplicateTitles;
