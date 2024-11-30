import { useState } from "react";
import { motion } from "framer-motion";
import KeywordSearch from "./KeywordSearpSearch";

const KeywordSerp = () => {
  const [visibility, setVisibility] = useState(true);

  return (
    <section
      // drag
      className={`${visibility ? "block relative" : "hidden"} absolute bottom-1 z-[50] h-fit`}
    >
      <KeywordSearch />
    </section>
  );
};

export default KeywordSerp;
