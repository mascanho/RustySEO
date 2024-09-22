import { useState } from "react";
import { motion } from "framer-motion";
import KeywordSearch from "./KeywordSearpSearch";

const KeywordSerp = () => {
  const [visibility, setVisibility] = useState(true);

  return (
    <motion.section
      drag
      className={`${visibility ? "block relative" : "hidden"} absolute bottom-1 z-[50] h-fit`}
    >
      <KeywordSearch />
    </motion.section>
  );
};

export default KeywordSerp;
