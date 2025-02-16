const useFilterTableURL = (arr: { url: string }[], url: string) => {
  if (!arr || arr.length === 0) return [];
  return arr.filter((item) => item.url === url);
};

export default useFilterTableURL;
