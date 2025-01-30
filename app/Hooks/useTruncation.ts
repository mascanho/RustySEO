type Truncation = {
  str: string;
  maxLength: number;
};

const useTruncation = ({ str, maxLength }: Truncation) => {
  if (str.length > maxLength) {
    return str.substring(0, maxLength) + "...";
  }
  return str;
};

export default useTruncation;
