"use client";

import { useEffect, useState } from "react";
import ChangelogModal from "./ChangelogModal";
import { changelogData } from "./ChangelogData";

// Deliberately separate from the "app-version" key already used by
// app/layout.tsx's update-check effect (that one tracks the locally
// installed binary version for the "update available" toast, and gets
// overwritten on every mount — reusing it here would make this modal think
// the changelog had always been seen).
const CHANGELOG_STORAGE_KEY = "rustyseo-changelog-last-seen-version";

export default function ChangelogAnnouncer() {
  const [opened, setOpened] = useState(false);
  const latestVersion = changelogData[0]?.version;

  useEffect(() => {
    if (!latestVersion) return;
    const lastSeenVersion = localStorage.getItem(CHANGELOG_STORAGE_KEY);
    if (lastSeenVersion !== latestVersion) {
      setOpened(true);
    }
  }, [latestVersion]);

  const handleClose = () => {
    if (latestVersion) {
      localStorage.setItem(CHANGELOG_STORAGE_KEY, latestVersion);
    }
    setOpened(false);
  };

  if (!latestVersion) return null;

  return <ChangelogModal opened={opened} onClose={handleClose} />;
}
