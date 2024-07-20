import React from "react";
import styles from "./stamp.module.css";

const StampEl = ({ indexation }: any) => {
  if (!indexation) {
    return null;
  }

  return (
    <div className={styles.stamp}>
      <span className={`${styles.isApproved} text-green-500`}>
        {indexation || "Not Index"}
      </span>
    </div>
  );
};

export default StampEl;
