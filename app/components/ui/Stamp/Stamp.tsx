import React from "react";
import styles from "./stamp.module.css";

const StampEl = ({ indexation, hidden }: any) => {
  if (!indexation) {
    return null;
  }

  return (
    <div className={`${styles.stamp}`}>
      <span
        className={`${styles.isApproved} ${hidden ? "hidden" : ""} ${indexation[0] === "Indexable" ? "text-green-500 dark:text-green-500" : "text-red-500"}`}
      >
        {indexation || "Not Index"}
      </span>
    </div>
  );
};

export default StampEl;
