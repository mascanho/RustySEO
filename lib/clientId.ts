// Shared per-browser pseudo-identity, first introduced for the community
// chat (see Chatbar.tsx) and reused anywhere else the app needs to tag
// Supabase rows with "who sent this" without requiring a real account —
// just a UUID persisted in localStorage on first use.
const CLIENT_ID_KEY = "rustyseo_chat_client_id";

export const getClientId = () => {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
};
