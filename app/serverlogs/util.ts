// @ts-nocheck

export function getOS() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;

  if (/windows phone/i.test(userAgent)) return "Windows Phone";
  if (/android/i.test(userAgent)) return "Android";
  if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) return "iOS";
  if (/win/i.test(userAgent)) return "Windows";
  if (/mac/i.test(userAgent)) return "MacOS";
  if (/linux/i.test(userAgent)) return "Linux";

  return "Unknown";
}
