"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { socket } from "../socket";

export interface Message {
  id: string;
  text: string;
  timestamp: Date;
  user: string;
  userId: string;
}

export interface OnlineUser {
  username: string;
  id: string;
}

interface TypingUser {
  username: string;
  userId: string;
}

interface SystemMessage {
  id: string;
  type: "join" | "leave";
  username: string;
  timestamp: Date;
}

export type ChatItem = Message | SystemMessage;

interface ChatContextType {
  messages: ChatItem[];
  username: string;
  isConnected: boolean;
  onlineUsers: OnlineUser[];
  typingUsers: TypingUser[];
  setUsername: (name: string) => void;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
  emitTyping: () => void;
  emitStopTyping: () => void;
}

function isSystemMessage(item: ChatItem): item is SystemMessage {
  return "type" in item;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [username, setUsernameState] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  // Load persisted messages
  useEffect(() => {
    const saved = localStorage.getItem("chat-messages-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const withDates = parsed.map((msg: ChatItem) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(withDates);
      } catch {
        /* ignore */
      }
    }
    const savedUser = localStorage.getItem("chat-username");
    if (savedUser) setUsernameState(savedUser);
  }, []);

  // Persist messages
  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.map((m) => ({
        ...m,
        timestamp: (m.timestamp as Date).toISOString(),
      }));
      localStorage.setItem("chat-messages-v2", JSON.stringify(toSave));
    }
  }, [messages]);

  const setUsername = useCallback((name: string) => {
    setUsernameState(name);
    localStorage.setItem("chat-username", name);
    socket.emit("userJoin", name);
  }, []);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      // Re-announce if we already have a username (reconnect case)
      const savedUser = localStorage.getItem("chat-username");
      if (savedUser) {
        setUsernameState(savedUser);
        socket.emit("userJoin", savedUser);
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setOnlineUsers([]);
    });

    socket.on("receiveMessage", (message: Message) => {
      setMessages((prev) => {
        const exists = prev.some((m) => !isSystemMessage(m) && (m as Message).id === message.id);
        if (exists) return prev;
        return [...prev, { ...message, timestamp: new Date(message.timestamp) }];
      });
    });

    socket.on("userJoined", ({ user, users }: { user: OnlineUser; users: OnlineUser[] }) => {
      setOnlineUsers(users);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-join-${Date.now()}-${user.id}`,
          type: "join",
          username: user.username,
          timestamp: new Date(),
        } as SystemMessage,
      ]);
    });

    socket.on("userLeft", ({ user, users }: { user: OnlineUser; users: OnlineUser[] }) => {
      setOnlineUsers(users);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-leave-${Date.now()}-${user.id}`,
          type: "leave",
          username: user.username,
          timestamp: new Date(),
        } as SystemMessage,
      ]);
    });

    socket.on("userTyping", (data: TypingUser) => {
      setTypingUsers((prev) => {
        if (prev.some((u) => u.userId === data.userId)) return prev;
        return [...prev, data];
      });
    });

    socket.on("userStopTyping", (data: TypingUser) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("receiveMessage");
      socket.off("userJoined");
      socket.off("userLeft");
      socket.off("userTyping");
      socket.off("userStopTyping");
    };
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !username.trim()) return;
      const message: Message = {
        id: `${socket.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: text.trim(),
        timestamp: new Date(),
        user: username,
        userId: socket.id ?? "",
      };
      socket.emit("sendMessage", message);
      // Add locally immediately (server only broadcasts to others)
      setMessages((prev) => [...prev, message]);
    },
    [username]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem("chat-messages-v2");
  }, []);

  const emitTyping = useCallback(() => {
    socket.emit("typing", { username, userId: socket.id });
  }, [username]);

  const emitStopTyping = useCallback(() => {
    socket.emit("stopTyping", { username, userId: socket.id });
  }, [username]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        username,
        isConnected,
        onlineUsers,
        typingUsers,
        setUsername,
        sendMessage,
        clearMessages,
        emitTyping,
        emitStopTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
}

export { isSystemMessage };
