// Shared presentation helpers for both changelog surfaces: the "What's New"
// modal (ChangelogModal.tsx) and the Help -> Changelog side panel
// (Changelog.tsx). Kept in one place so the two stay visually consistent.

export const getTypeColor = (type: string) => {
  switch (type) {
    case "feature":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "fix":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    case "breaking":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    default:
      return "bg-orange-100 text-gray-800 dark:bg-orange-900 dark:text-gray-300";
  }
};

export const getTypeLabel = (type: string) => {
  switch (type) {
    case "feature":
      return "New";
    case "fix":
      return "Fix";
    case "breaking":
      return "Breaking";
    default:
      return "Update";
  }
};

export const getChangeDotColor = (type: string) => {
  switch (type) {
    case "feature":
      return "bg-green-500";
    case "fix":
      return "bg-blue-500";
    case "breaking":
      return "bg-red-500";
    default:
      return "bg-orange-500";
  }
};

// Most changelog lines follow "Area: what changed" (e.g. "Deep Crawler:
// Schema detection export") — split that off so the area can render as a
// small label instead of just running into the sentence.
const CATEGORY_PATTERN = /^([^:]{2,20}):\s*(.+)$/;
export const parseChange = (change: string) => {
  const match = change.match(CATEGORY_PATTERN);
  return match
    ? { category: match[1], text: match[2] }
    : { category: null, text: change };
};

// Renders "**text**" segments (used for flags like "**Experimental**" in the
// changelog data) as an emphasized inline span instead of literal asterisks.
export const renderChangeText = (text: string) => {
  const parts = text.split(/(\*\*.+?\*\*)/g);
  return parts.map((part, i) => {
    const match = part.match(/^\*\*(.+)\*\*$/);
    return match ? (
      <span key={i} className="font-semibold text-amber-600 dark:text-amber-400">
        {match[1]}
      </span>
    ) : (
      <span key={i}>{part}</span>
    );
  });
};
