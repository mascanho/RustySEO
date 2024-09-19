import { useState } from "react";
import KeywordSearch from "./KeywordSearpSearch";

const KeywordSerp = () => {
  const [visibility, setVisibility] = useState(true);

  return (
    <section
      className={`${visibility ? "block relative" : "hidden"} relative bottom-1 h-screen`}
    >
      <KeywordSearch />
    </section>
  );
};

export default KeywordSerp;
