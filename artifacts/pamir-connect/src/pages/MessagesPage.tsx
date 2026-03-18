import { useState, useEffect, useRef } from "react";
import { Search, ArrowLeft, Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatThread, Message } from "@/types";

function getAvatar(p: any) {
  return p?.avatarUrl || p?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p?.name}`;
}

function formatTime(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

const MessagesPage = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const data = await api.threads.list(user.id);
        setThreads(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const openThread = async (thread: ChatThread) => {
    setSelectedThread(thread);
    try {
      const msgs = await api.threads.messages(thread.id);
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      console.error(e);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedThread || !newMsg.trim() || sending) return;
    setSending(true);
    try {
      const msg = await api.threads.send(selectedThread.id, { senderId: user.id, text: newMsg.trim() });
      setMessages([...messages, msg]);
      setNewMsg("");
      setThreads(threads.map((t) =>
        t.id === selectedThread.id ? { ...t, lastMessage: msg.text, lastMessageTime: msg.createdAt } : t
      ));
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const filtered = threads.filter((t) =>
    t.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedThread) {
    return (
      <div className="mx-auto max-w-lg flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedThread(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img src={getAvatar(selectedThread.user)} alt="" className="h-8 w-8 rounded-full bg-muted object-cover" />
            <div>
              <p className="font-display font-semibold text-sm text-foreground">{selectedThread.user?.name}</p>
              <p className="text-xs text-muted-foreground">{selectedThread.user?.institution}</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.sender?.id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <img src={getAvatar(msg.sender)} alt="" className="h-7 w-7 rounded-full bg-muted object-cover mr-2 mt-1 flex-shrink-0" />
                )}
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-0.5 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border bg-card/95 backdrop-blur p-3">
          <div className="flex gap-2">
            <input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Написать сообщение..."
              className="flex-1 rounded-xl bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={sendMessage}
              disabled={!newMsg.trim() || sending}
              className="rounded-xl bg-primary p-2.5 text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <h1 className="font-display text-xl font-bold text-foreground mb-3">Сообщения</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full rounded-lg bg-secondary py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((thread) => (
            <button
              key={thread.id}
              onClick={() => openThread(thread)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
            >
              <div className="relative">
                <img src={getAvatar(thread.user)} alt={thread.user?.name} className="h-12 w-12 rounded-full bg-muted object-cover" />
                {thread.unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {thread.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-sm text-foreground truncate">{thread.user?.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{formatTime(thread.lastMessageTime)}</span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${thread.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {thread.lastMessage || "Нет сообщений"}
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && !loading && (
            <p className="text-center text-sm text-muted-foreground py-10">Нет чатов</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
