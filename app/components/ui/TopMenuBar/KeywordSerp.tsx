import { useState } from "react";
import KeywordSearch from "./KeywordSearpSearch";

const KeywordSerp = ({ children }) => {
  const [visibility, setVisibility] = useState(true);

  return (
    <section className={`${visibility ? "block" : "hidden"} absolute top-20`}>
      <KeywordSearch />
    </section>
  );
};

export default KeywordSerp;
