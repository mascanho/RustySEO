// @ts-nocheck
import openBrowserWindow from "@/app/Hooks/OpenBrowserWindow";
import { toast } from "sonner";

function handleURLClick(url, click) {
  click.preventDefault();
  click.stopPropagation();
  console.log(url, click);

  const domain = localStorage.getItem("domain");

  // IF THE USER CLICKED ONCE ON THE SAME URL, open URL
  if (click.button === 0) {
    openBrowserWindow(`https://${domain}${url}`);
  }
}

// HANDLES COPYING STUFF ON THE TABLE LIKE THE RUSER AGENT, URL OR REFERER
function handleCopyClick(text, click, name) {
  click.preventDefault();
  click.stopPropagation();

  const domain = localStorage.getItem("domain");

  const textToCopy = domain ? "https://" + domain + text : text;

  if (name === "User Agent") {
    navigator.clipboard.writeText(text);
  }

  if (name === "URL / PATH") {
    navigator.clipboard.writeText(textToCopy);
  }

  if (name === "Referer") {
    navigator.clipboard.writeText(text);
  }

  toast.success(`${name} copied to clipboard!`);
}

export { handleURLClick, handleCopyClick };
