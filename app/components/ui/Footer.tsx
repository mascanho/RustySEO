import React from "react";

const date = new Date();
const year = date.getFullYear();

const Footer = ({ url, loading }: { url: string; loading: boolean }) => {
  return (
    <div className="w-full text-sm justify-between bg-apple-silver shadow fixed ml-0 left-0 bottom-0 z-50 border-t-2 flex items-center py-1 rounded-b-md overflow-hidden">
      <div className="flex items-center ml-2 space-x-1">
        {!loading && url && (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="mt-[5px]">{url}</span>
          </>
        )}
      </div>
      <span className="pt-1">{`© ${year} - RustySEO`}</span>
    </div>
  );
};

export default Footer;
