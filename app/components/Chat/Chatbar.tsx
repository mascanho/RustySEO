// @ts-nocheck
"use client";

import type React from "react";

import { useState, useEffect, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  X,
  MessageCircle,
  Ban,
  UserX,
  MessageSquarePlus,
  ArrowLeft,
  Globe,
  Lock,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useVisibilityStore } from "@/store/VisibilityStore";
import { useChatNotificationStore } from "@/store/ChatNotificationStore";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

type ChatMessage = {
  id: number;
  client_id: string;
  auth_id?: string | null;
  sender_name: string;
  content: string;
  created_at: string;
};

type DirectMessage = {
  id: number;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  content: string;
  created_at: string;
};

type ChatView = "public" | "dmList" | "dmThread";

const NICKNAME_KEY = "rustyseo_chat_nickname";
const CLIENT_ID_KEY = "rustyseo_chat_client_id";
const BLOCKED_KEY = "rustyseo_chat_blocked";
const DM_PEERS_KEY = "rustyseo_chat_dm_peers";
// Keep in sync with the `content` check constraint in supabase_chat_schema.sql
const MAX_MESSAGE_LENGTH = 500;
const AVATAR_COLORS = [
  "#3a86ff",
  "#38b000",
  "#9d4edd",
  "#fb8500",
  "#ef476f",
  "#06b6d4",
  "#f59e0b",
];

const getClientId = () => {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
};

const colorForName = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Low-opacity tint of the sender's color, used as the bubble background so
// each person reads as visually distinct without sacrificing legibility.
const bubbleTint = (color: string, isDark: boolean) =>
  `${color}${isDark ? "33" : "1a"}`;

const ChatInput = memo(
  ({
    onSend,
    disabled,
    placeholder = "Message",
    accent = "blue",
  }: {
    onSend: (text: string) => void;
    disabled: boolean;
    placeholder?: string;
    accent?: "blue" | "purple";
  }) => {
    const [input, setInput] = useState("");
    const remaining = MAX_MESSAGE_LENGTH - input.length;
    const nearLimit = remaining <= 100;

    const handleSubmit = () => {
      const trimmed = input.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (trimmed === "" || disabled) return;
      onSend(trimmed);
      setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      }
    };

    return (
      <div
        className={`border-t px-3 py-2 ${
          accent === "purple"
            ? "border-purple-200 bg-purple-50/40 dark:border-purple-900/40 dark:bg-purple-950/10"
            : "border-gray-200 bg-white dark:border-[#333333] dark:bg-[#1a1a1a]"
        }`}
      >
        <div className="flex items-center space-x-2">
          <Input
            value={input}
            onChange={(e) =>
              setInput(e.target.value.slice(0, MAX_MESSAGE_LENGTH))
            }
            onKeyDown={handleKeyDown}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={placeholder}
            disabled={disabled}
            className={`h-8 flex-1 rounded-sm border-gray-300 bg-white text-sm text-gray-800 dark:border-[#444444] dark:bg-[#252525] dark:text-gray-200 ${
              accent === "purple"
                ? "focus-visible:ring-purple-500 dark:focus-visible:ring-purple-400"
                : "focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400"
            }`}
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={disabled || input.trim() === ""}
            className={`h-8 w-8 rounded-sm p-0 dark:bg-[#333333] dark:hover:bg-[#444444] ${
              accent === "purple"
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Send className="h-4 w-4 dark:text-sky-bright" />
          </Button>
        </div>
        {nearLimit && (
          <p
            className={`mt-1 text-right text-[10px] ${remaining <= 0 ? "text-red-500" : "text-gray-400"}`}
          >
            {remaining} characters left
          </p>
        )}
      </div>
    );
  },
);

ChatInput.displayName = "ChatInput";

const NicknamePrompt = ({ onSave }: { onSave: (name: string) => void }) => {
  const [name, setName] = useState("");

  const handleSave = () => {
    const trimmed = name.trim().slice(0, 40);
    if (trimmed === "") return;
    onSave(trimmed);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white px-6 text-center dark:bg-[#1a1a1a]">
      <MessageCircle className="h-8 w-8 text-blue-500" />
      <p className="text-xs text-gray-600 dark:text-gray-300">
        Pick a display name to join the RustySEO community chat.
      </p>
      <div className="flex w-full items-center space-x-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          maxLength={40}
          placeholder="Your name"
          className="h-8 flex-1 rounded-sm border-gray-300 bg-white text-sm text-gray-800 dark:border-[#444444] dark:bg-[#252525] dark:text-gray-200"
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={name.trim() === ""}
          className="h-8 rounded-sm bg-blue-600 px-3 hover:bg-blue-700 dark:bg-[#333333] dark:hover:bg-[#444444]"
        >
          Join
        </Button>
      </div>
    </div>
  );
};

export function ChatBar() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [nickname, setNickname] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [authId, setAuthId] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<Record<string, string>>({});
  const [showBlockedPanel, setShowBlockedPanel] = useState(false);

  // Private direct messages
  const [view, setView] = useState<ChatView>("public");
  const [dmPeers, setDmPeers] = useState<Record<string, string>>({});
  const [dmUnread, setDmUnread] = useState<Record<string, boolean>>({});
  const [activeDmPeer, setActiveDmPeer] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [dmMessages, setDmMessages] = useState<DirectMessage[]>([]);
  const [dmLoading, setDmLoading] = useState(false);
  const [dmSending, setDmSending] = useState(false);

  const { theme } = useTheme();
  const pathname = usePathname();
  const { visibility, hideChatbar } = useVisibilityStore();
  const { markUnread, markRead } = useChatNotificationStore();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const dmScrollAreaRef = useRef<HTMLDivElement>(null);
  const blockedUsersRef = useRef<Record<string, string>>({});
  const viewRef = useRef<ChatView>("public");
  const activeDmPeerRef = useRef<{ id: string; name: string } | null>(null);

  // Load identity + personal block list once on mount. Blocking is a local,
  // per-device filter (there's no auth/moderation backend) — it hides a
  // sender's messages only for the person who blocked them.
  useEffect(() => {
    setClientId(getClientId());
    setNickname(localStorage.getItem(NICKNAME_KEY));
    try {
      const raw = localStorage.getItem(BLOCKED_KEY);
      if (raw) setBlockedUsers(JSON.parse(raw));
      const rawPeers = localStorage.getItem(DM_PEERS_KEY);
      if (rawPeers) setDmPeers(JSON.parse(rawPeers));
    } catch (e) {
      console.error("Failed to read local chat data:", e);
    }
  }, []);

  // Private messages need a real, server-verified identity — not just a
  // self-reported client id — so the database can enforce that only the
  // sender and recipient can ever read a DM. Supabase's anonymous auth
  // gives every device a persistent, verified user id at no cost and with
  // no signup step for the user.
  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setAuthId(session.user.id);
        return;
      }
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error("Anonymous sign-in failed:", error);
        toast.error(
          "Direct messages unavailable: " +
            (error.message || "anonymous sign-in failed"),
        );
      } else if (data.user) {
        setAuthId(data.user.id);
      }
    };
    initAuth();
  }, []);

  // Keep ref mirrors of state that's read inside long-lived realtime
  // subscription callbacks, so those callbacks always see the latest
  // value instead of the one captured when the effect first ran.
  useEffect(() => {
    blockedUsersRef.current = blockedUsers;
  }, [blockedUsers]);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);
  useEffect(() => {
    activeDmPeerRef.current = activeDmPeer;
  }, [activeDmPeer]);

  // Clear the footer's unread indicator as soon as the panel is opened.
  useEffect(() => {
    if (visibility.chatbar) markRead();
  }, [visibility.chatbar, markRead]);

  // Fetch history + subscribe to realtime inserts once we have an identity
  useEffect(() => {
    if (!nickname) return;

    let active = true;

    const loadHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(200);

      if (!active) return;
      if (error) {
        console.error("Failed to load chat history:", error);
        toast.error("Failed to load chat history");
      } else {
        setMessages(data as ChatMessage[]);
      }
      setLoading(false);
    };

    loadHistory();

    const channel = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          setMessages((prev) => [...prev, incoming]);

          // Flag the footer icon for messages from other, non-blocked
          // senders while the panel is closed. Read visibility straight
          // from the store (not the `visibility` closure) so this always
          // sees the current value, not the one from when this effect ran.
          const chatbarOpen = useVisibilityStore.getState().visibility.chatbar;
          if (
            incoming.client_id !== clientId &&
            !blockedUsersRef.current[incoming.client_id] &&
            !chatbarOpen
          ) {
            markUnread();
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [nickname]);

  // Global inbox for private messages: one subscription for everything
  // addressed to me, regardless of which thread (if any) is open. Updates
  // the open thread live, otherwise flags that peer's entry as unread.
  useEffect(() => {
    if (!authId) return;

    const channel = supabase
      .channel(`dm:${authId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `recipient_id=eq.${authId}`,
        },
        (payload) => {
          const incoming = payload.new as DirectMessage;

          setDmPeers((prev) => {
            if (prev[incoming.sender_id]) return prev;
            const next = { ...prev, [incoming.sender_id]: incoming.sender_name };
            localStorage.setItem(DM_PEERS_KEY, JSON.stringify(next));
            return next;
          });

          const viewingThisThread =
            viewRef.current === "dmThread" &&
            activeDmPeerRef.current?.id === incoming.sender_id;

          if (viewingThisThread) {
            setDmMessages((prev) => [...prev, incoming]);
          } else {
            setDmUnread((prev) => ({ ...prev, [incoming.sender_id]: true }));
          }

          const chatbarOpen = useVisibilityStore.getState().visibility.chatbar;
          if (!chatbarOpen || !viewingThisThread) {
            markUnread();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authId]);

  // Fetch the two-person history whenever a DM thread is opened.
  useEffect(() => {
    if (!activeDmPeer || !authId) return;

    let active = true;
    setDmLoading(true);

    const loadThread = async () => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${authId},recipient_id.eq.${activeDmPeer.id}),and(sender_id.eq.${activeDmPeer.id},recipient_id.eq.${authId})`,
        )
        .order("created_at", { ascending: true })
        .limit(200);

      if (!active) return;
      if (error) {
        console.error("Failed to load direct messages:", error);
        toast.error("Failed to load conversation");
      } else {
        setDmMessages(data as DirectMessage[]);
      }
      setDmLoading(false);
    };

    loadThread();
    setDmUnread((prev) => ({ ...prev, [activeDmPeer.id]: false }));

    return () => {
      active = false;
    };
  }, [activeDmPeer, authId]);

  // Keep scrolled to bottom on new messages — scroll only the chat's own
  // viewport directly. Radix ScrollArea's viewport toggles its overflow
  // style dynamically, so scrollIntoView() can miss it and scroll an
  // ancestor (e.g. <main>) instead, visibly shifting the whole page.
  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]",
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const viewport = dmScrollAreaRef.current?.querySelector<HTMLDivElement>(
      "[data-radix-scroll-area-viewport]",
    );
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [dmMessages]);

  const handleSaveNickname = (name: string) => {
    localStorage.setItem(NICKNAME_KEY, name);
    setNickname(name);
  };

  const handleSendMessage = async (text: string) => {
    // Wait for the anonymous auth session before allowing a send — sending
    // early would save the message with auth_id: null, permanently making
    // that sender un-DM-able for that message (auth normally resolves in
    // well under a second, so this is rarely noticeable).
    if (!nickname || !authId || sending) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      client_id: clientId,
      auth_id: authId,
      sender_name: nickname,
      content: text,
    });
    if (error) {
      console.error("Failed to send message:", error);
      if (error.message?.includes("RATE_LIMIT")) {
        toast.error("You're sending messages too fast — slow down a bit.");
      } else {
        toast.error("Failed to send message");
      }
    }
    // Keep the input disabled briefly even after a successful send,
    // mirroring the server's minimum gap between messages from one sender —
    // avoids firing off a burst of attempts the DB would just reject anyway.
    setTimeout(() => setSending(false), 1500);
  };

  const handleSendDm = async (text: string) => {
    if (!nickname || !authId || !activeDmPeer || dmSending) return;
    setDmSending(true);
    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: authId,
        sender_name: nickname,
        recipient_id: activeDmPeer.id,
        content: text,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to send direct message:", error);
      if (error.message?.includes("RATE_LIMIT")) {
        toast.error("You're sending messages too fast — slow down a bit.");
      } else {
        toast.error("Failed to send message");
      }
    } else if (data) {
      // The realtime subscription only fires for the recipient, so add our
      // own outgoing message to the thread directly.
      setDmMessages((prev) => [...prev, data as DirectMessage]);
    }
    setTimeout(() => setDmSending(false), 1500);
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleBlockUser = (id: string, name: string) => {
    if (id === clientId) return;
    setBlockedUsers((prev) => {
      const next = { ...prev, [id]: name };
      localStorage.setItem(BLOCKED_KEY, JSON.stringify(next));
      return next;
    });
    toast.success(`Blocked ${name}`);
  };

  const handleUnblockUser = (id: string) => {
    setBlockedUsers((prev) => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem(BLOCKED_KEY, JSON.stringify(next));
      return next;
    });
  };

  const openDmWith = (id: string, name: string) => {
    if (!id || id === authId) return;
    setDmPeers((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: name };
      localStorage.setItem(DM_PEERS_KEY, JSON.stringify(next));
      return next;
    });
    setActiveDmPeer({ id, name });
    setView("dmThread");
  };

  const blockedCount = Object.keys(blockedUsers).length;
  const dmUnreadCount = Object.values(dmUnread).filter(Boolean).length;
  const visibleMessages = messages.filter((m) => !blockedUsers[m.client_id]);

  return (
    <div
      className={`flex flex-col overflow-hidden border border-l-2 font-mono shadow-xl transition ease-in delay-75 z-[999999] absolute right-0
  ${visibility.chatbar ? "w-[30.4rem]" : "w-0"}
  border-gray-200 text-gray-800 dark:border-gray-800 dark:bg-[#1a1a1a] dark:text-gray-200
  ${pathname === "/" && "top-0 h-[calc(100vh-8.6rem)]"}
${pathname === "/global" && "top-[5.1rem] h-[calc(100vh-8.6rem)]"}
${pathname === "/serverlogs" && "top-[4.2rem] h-[calc(100vh-6.6rem)]"}
`}
    >
      {/* Header */}
      <div
        className={`relative border-b px-3 py-2 transition-colors ${
          view === "public"
            ? "border-gray-200 bg-white dark:border-[#333333] dark:bg-[#1a1a1a]"
            : "border-purple-200 bg-purple-50 dark:border-purple-900/40 dark:bg-purple-950/20"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-1">
            {view === "dmThread" ? (
              <button
                onClick={() => {
                  setView("dmList");
                  setActiveDmPeer(null);
                }}
                className="flex h-6 w-6 shrink-0 items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                title="Back to conversations"
              >
                <ArrowLeft size={14} />
              </button>
            ) : (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                {view === "public" ? (
                  <Globe size={13} className="text-blue-500" />
                ) : (
                  <Lock size={13} className="text-purple-500" />
                )}
              </div>
            )}
            <h2 className="truncate text-sm font-medium">
              {view === "public" && "SEO CHAT"}
              {view === "dmList" && "DIRECT MESSAGES"}
              {view === "dmThread" && activeDmPeer?.name}
            </h2>
          </div>
          <div className="flex shrink-0 items-center space-x-2">
            {nickname && (
              <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:inline">
                {nickname}
              </span>
            )}
            {nickname && view === "public" && (
              <button
                onClick={() => setShowBlockedPanel((v) => !v)}
                title="Blocked users"
                className="relative flex h-6 w-6 items-center justify-center rounded-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-[#2d2d2d] dark:hover:text-gray-200"
              >
                <Ban size={14} />
                {blockedCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {blockedCount}
                  </span>
                )}
              </button>
            )}
            <X
              size={16}
              className="text-gray-400 hover:text-purple-500 cursor-pointer"
              onClick={() => hideChatbar()}
            />
          </div>
        </div>

        {showBlockedPanel && (
          <div className="absolute right-3 top-full z-10 mt-1 w-56 rounded-sm border border-gray-200 bg-white p-2 shadow-lg dark:border-[#333333] dark:bg-[#1f1f1f]">
            <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-300">
              Blocked users
            </p>
            {blockedCount === 0 ? (
              <p className="text-xs text-gray-400">Nobody's blocked.</p>
            ) : (
              <ul className="space-y-1">
                {Object.entries(blockedUsers).map(([id, name]) => (
                  <li
                    key={id}
                    className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-200"
                  >
                    <span className="truncate">{name}</span>
                    <button
                      onClick={() => handleUnblockUser(id)}
                      className="ml-2 shrink-0 text-blue-600 hover:underline dark:text-sky-400"
                    >
                      Unblock
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Mode tabs — always visible once joined, so it's never ambiguous
          whether you're looking at the public room or a private thread. */}
      {nickname && (
        <div className="flex border-b border-gray-200 bg-white text-xs font-medium dark:border-[#333333] dark:bg-[#1a1a1a]">
          <button
            onClick={() => {
              setView("public");
              setActiveDmPeer(null);
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 transition-colors ${
              view === "public"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Globe size={13} />
            Public
          </button>
          <button
            onClick={() => setView(view === "public" ? "dmList" : view)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 transition-colors ${
              view !== "public"
                ? "border-purple-500 text-purple-600 dark:text-purple-400"
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            <Lock size={13} />
            Direct
            {dmUnreadCount > 0 && (
              <span className="absolute right-[28%] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {dmUnreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {!nickname ? (
        <NicknamePrompt onSave={handleSaveNickname} />
      ) : view === "dmList" ? (
        <ScrollArea className="flex-1 bg-purple-50/40 px-3 py-2 dark:bg-purple-950/10">
          {Object.keys(dmPeers).length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 text-center">
              <Lock className="h-6 w-6 text-purple-300 dark:text-purple-800" />
              <p className="text-xs text-gray-400">
                No conversations yet. Hover a message in the public chat and
                tap the DM icon to start one.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {Object.entries(dmPeers).map(([id, name]) => {
                const color = colorForName(name);
                return (
                  <li key={id}>
                    <button
                      onClick={() => openDmWith(id, name)}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left hover:bg-purple-100/60 dark:hover:bg-purple-900/20"
                    >
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="flex-1 truncate text-xs text-gray-800 dark:text-gray-200">
                        {name}
                      </span>
                      {dmUnread[id] && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      ) : view === "dmThread" ? (
        <>
          <ScrollArea
            ref={dmScrollAreaRef}
            className="flex-1 bg-purple-50/40 px-3 py-2 dark:bg-purple-950/10"
          >
            <div className="space-y-3">
              {dmLoading && (
                <p className="text-center text-xs text-gray-400">
                  Loading conversation…
                </p>
              )}
              {!dmLoading && dmMessages.length === 0 && (
                <p className="text-center text-xs text-gray-400">
                  No messages yet. Say hello privately!
                </p>
              )}
              {dmMessages.map((message) => {
                const isCurrentUser = message.sender_id === authId;
                const color = colorForName(message.sender_name);

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className="min-w-0 max-w-[85%]">
                      <div
                        className={`min-w-0 rounded-md px-3 py-2 ${
                          isCurrentUser
                            ? "bg-blue-600 text-white dark:bg-[#2a4365]"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                        style={
                          isCurrentUser
                            ? undefined
                            : {
                                backgroundColor: bubbleTint(
                                  color,
                                  theme === "dark",
                                ),
                                borderLeft: `3px solid ${color}`,
                              }
                        }
                      >
                        <p className="whitespace-pre-wrap break-words text-xs [overflow-wrap:anywhere]">
                          {message.content}
                        </p>
                      </div>
                      <div
                        className={`mt-1 flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                      >
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <ChatInput
            onSend={handleSendDm}
            disabled={dmSending}
            placeholder={`Message ${activeDmPeer?.name ?? ""}`}
            accent="purple"
          />
        </>
      ) : (
        <>
          {/* Messages */}
          <ScrollArea
            ref={scrollAreaRef}
            className="flex-1 bg-white px-3 py-2 dark:bg-[#1a1a1a]"
          >
            <div
              className={`space-y-3 ${visibility.chatbar ? "opacity-100" : "opacity-0 transition-opacity ease-in delay-75"}`}
            >
              {loading && (
                <p className="text-center text-xs text-gray-400">
                  Loading messages…
                </p>
              )}
              {!loading && visibleMessages.length === 0 && (
                <p className="text-center text-xs text-gray-400">
                  {messages.length === 0
                    ? "No messages yet. Say hello!"
                    : "All messages here are from blocked users."}
                </p>
              )}
              {visibleMessages.map((message) => {
                const isCurrentUser = message.client_id === clientId;
                const color = colorForName(message.sender_name);

                return (
                  <div
                    key={message.id}
                    className={`group flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div className="min-w-0 max-w-[85%]">
                      <div className="flex min-w-0 items-start space-x-2">
                        {!isCurrentUser && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                title={`${message.sender_name} — options`}
                                className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-offset-1 transition-shadow hover:ring-2"
                                style={{
                                  backgroundColor: color,
                                  "--tw-ring-color": color,
                                }}
                              >
                                {message.sender_name.charAt(0).toUpperCase()}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="z-[1000000] w-44"
                            >
                              <DropdownMenuItem
                                onClick={() =>
                                  handleBlockUser(
                                    message.client_id,
                                    message.sender_name,
                                  )
                                }
                                className="text-red-500 focus:text-red-500"
                              >
                                <UserX className="mr-2 h-3.5 w-3.5" />
                                Block {message.sender_name}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <div className="min-w-0">
                          {!isCurrentUser && (
                            <div className="mb-1 flex items-baseline space-x-2">
                              <span
                                className="text-xs font-medium"
                                style={{ color }}
                              >
                                {message.sender_name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(message.created_at)}
                              </span>
                              {message.auth_id && (
                                <button
                                  onClick={() =>
                                    openDmWith(
                                      message.auth_id as string,
                                      message.sender_name,
                                    )
                                  }
                                  title={`Message ${message.sender_name} privately`}
                                  className="inline-flex shrink-0 text-gray-400 opacity-0 transition-opacity hover:text-blue-500 group-hover:opacity-100"
                                >
                                  <MessageSquarePlus size={12} />
                                </button>
                              )}
                            </div>
                          )}
                          <div className="flex min-w-0 items-end space-x-2">
                            <div
                              className={`min-w-0 rounded-md px-3 py-2 ${
                                isCurrentUser
                                  ? "bg-blue-600 text-white dark:bg-[#2a4365]"
                                  : "text-gray-800 dark:text-gray-200"
                              }`}
                              style={
                                isCurrentUser
                                  ? undefined
                                  : {
                                      backgroundColor: bubbleTint(
                                        color,
                                        theme === "dark",
                                      ),
                                      borderLeft: `3px solid ${color}`,
                                    }
                              }
                            >
                              <p className="whitespace-pre-wrap break-words text-xs [overflow-wrap:anywhere]">
                                {message.content}
                              </p>
                            </div>
                          </div>
                          {isCurrentUser && (
                            <div className="mt-1 flex justify-end">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatTime(message.created_at)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <ChatInput
            onSend={handleSendMessage}
            disabled={sending || !authId}
          />
        </>
      )}
    </div>
  );
}
