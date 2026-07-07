import { useEffect, useState } from "react";

// Tracks the `dark` class on <html>, the same signal every other chart in
// the app reacts to (see OverviewChart.tsx). Centralised here so each
// visualisation doesn't reimplement its own MutationObserver.
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  return isDark;
}
