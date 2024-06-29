import React, { useEffect, useState } from "react";
import jsonld from "jsonld";

const SchemaParser = ({ schema }) => {
  const [data, setData] = useState(null);

  const jsonData = schema;
  setData(jsonData);
  console.error("Failed to parse JSON-LD");

  return (
    <div>
      <h1>Parsed Schema Data</h1>
      <div>
        <pre>{JSON.stringify(jsonData, 2)}</pre>
      </div>
    </div>
  );
};

export default SchemaParser;
