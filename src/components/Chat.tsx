"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat, isSystemMessage, Message } from "../contexts/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Send, Trash2, MessageSquare, LogIn, LogOut } from "lucide-react";

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name.charAt(0).toUpperCase();
}

// Deterministic color per username for avatar fallback
const AVATAR_COLORS = [
  "bg-red-100 text-red-700",
  "bg-orange-100 text-orange-700",
  "bg-amber-100 text-amber-700",
  "bg-green-100 text-green-700",
  "bg-teal-100 text-teal-700",
  "bg-blue-100 text-blue-700",
  "bg-indigo-100 text-indigo-700",
  "bg-purple-100 text-purple-700",
];

function avatarClass(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Join Screen ───────────────────────────────────────────────────────────────
function JoinScreen({ onJoin }: { onJoin: (name: string) => void }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const name = (fd.get("username") as string)?.trim();
    if (name) onJoin(name);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-primary p-3">
              <MessageSquare className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome to NexusChat</h1>
          <p className="text-sm text-muted-foreground">Enter your name to start chatting</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            id="username-input"
            name="username"
            placeholder="Your display name"
            autoComplete="off"
            autoFocus
            required
          />
          <Button id="join-btn" type="submit" className="w-full">
            Join Chat
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Main Chat ─────────────────────────────────────────────────────────────────
export default function Chat() {
  const {
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
  } = useChat();

  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleTyping = useCallback(
    (value: string) => {
      setNewMessage(value);
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        emitTyping();
      }
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        emitStopTyping();
      }, 1500);
    },
    [emitTyping, emitStopTyping]
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage("");
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    emitStopTyping();
  };

  if (!username) return <JoinScreen onJoin={setUsername} />;

  return (
    <div className="flex h-screen bg-background">
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-muted/30">
        {/* App title */}
        <div className="flex items-center gap-2 px-4 h-14 border-b">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">NexusChat</span>
        </div>

        {/* Online users */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Online — {onlineUsers.length}
            </p>
          </div>
          <ScrollArea className="flex-1 px-2">
            <div className="space-y-1 pb-4">
              {onlineUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className={`text-xs ${avatarClass(u.username)}`}>
                      {getInitials(u.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-sm">
                    {u.username}
                    {u.username === username && (
                      <span className="text-muted-foreground ml-1">(you)</span>
                    )}
                  </span>
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                </div>
              ))}
              {onlineUsers.length === 0 && (
                <p className="text-xs text-muted-foreground px-2 py-1">No users online</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <Separator />

        {/* Me */}
        <div className="flex items-center gap-2 px-4 py-3">
          <Avatar className="h-7 w-7">
            <AvatarFallback className={`text-xs ${avatarClass(username)}`}>
              {getInitials(username)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{username}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
              Connected
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main panel ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold"># general</span>
            <Badge variant="secondary" className="text-xs font-normal">
              {onlineUsers.length} online
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              id="clear-btn"
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-muted-foreground"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((item) => {
                // System message (join / leave)
                if (isSystemMessage(item)) {
                  return (
                    <div key={item.id} className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
                      {item.type === "join" ? (
                        <LogIn className="h-3 w-3 text-green-500" />
                      ) : (
                        <LogOut className="h-3 w-3 text-red-400" />
                      )}
                      <span>
                        <strong className="font-medium">{item.username}</strong>{" "}
                        {item.type === "join" ? "joined" : "left"} the chat
                      </span>
                      <span className="text-muted-foreground/60">{formatTime(item.timestamp)}</span>
                    </div>
                  );
                }

                // Chat message
                const msg = item as Message;
                const isMine = msg.user === username;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""} mb-1`}
                  >
                    {!isMine && (
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className={`text-xs ${avatarClass(msg.user)}`}>
                          {getInitials(msg.user)}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    <div className={`flex flex-col max-w-[65%] ${isMine ? "items-end" : "items-start"}`}>
                      {!isMine && (
                        <span className="text-xs text-muted-foreground mb-1 px-1">{msg.user}</span>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words ${
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm border"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 px-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 pl-9 py-1">
                <div className="flex items-center gap-1 bg-muted border rounded-full px-3 py-2">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`typing-dot h-1.5 w-1.5 rounded-full bg-muted-foreground/60 inline-block`}
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {typingUsers.map((u) => u.username).join(", ")}{" "}
                  {typingUsers.length === 1 ? "is" : "are"} typing…
                </span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-background px-4 py-3">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Input
              id="message-input"
              value={newMessage}
              onChange={(e) => handleTyping(e.target.value)}
              placeholder="Message #general…"
              autoComplete="off"
              className="flex-1"
            />
            <Button
              id="send-btn"
              type="submit"
              size="icon"
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
