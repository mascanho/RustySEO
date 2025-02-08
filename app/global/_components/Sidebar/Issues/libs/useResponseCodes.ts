const useResponseCodes = (crawlData, code) => {
  const statusCodes = crawlData?.filter((item) => item?.status_code === code);
  return statusCodes;
};

export default useResponseCodes;
