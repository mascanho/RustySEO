import { useState } from "react";
import { motion } from "framer-motion";
import KeywordSearch from "./KeywordSearpSearch";

const KeywordSerp = () => {
  const [visibility, setVisibility] = useState(true);

  return (
    <motion.section
      drag
      className={`${visibility ? "block relative" : "hidden"} absolute bottom-1 z-[99999999] h-screen`}
    >
      <KeywordSearch />
    </motion.section>
  );
};

export default KeywordSerp;
