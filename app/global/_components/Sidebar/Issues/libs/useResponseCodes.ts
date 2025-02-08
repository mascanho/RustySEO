const useResponseCodes = (arr, code) => {
  // Validate input
  if (!Array.isArray(arr)) {
    console.error("Expected an array, but received:", arr);
    return [];
  }

  // Log the input for debugging
  console.log("Input array:", arr);
  console.log("Filter code:", code);

  // Filter the array
  const filteredItems = arr.filter((item) => {
    // Ensure `item` is an object and has a `status_code` property
    if (typeof item === "object" && item !== null && "status_code" in item) {
      return item.status_code === code;
    }
    return false; // Exclude items without a `status_code`
  });

  // Log the filtered items for debugging
  console.log("Filtered items:", filteredItems);

  return filteredItems;
};

export default useResponseCodes;
