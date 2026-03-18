import { useState, useEffect, useRef } from "react";
import { Search, ArrowLeft, Send, Loader2, Image, Video, X, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { ChatThread, Message } from "@/types";

function getAvatar(p: any) {
  return p?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p?.name || "user"}`;
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

function threadName(t: ChatThread) {
  if (t.isGroup) return t.group?.name || "Группа";
  return t.user?.name || "Чат";
}

function threadAvatar(t: ChatThread) {
  if (t.isGroup) {
    return t.group?.coverUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${t.group?.name}`;
  }
  return getAvatar(t.user);
}

const MediaPreview = ({ url, type, onRemove }: { url: string; type: string; onRemove: () => void }) => (
  <div className="relative inline-block">
    {type === "video" ? (
      <video src={url} className="h-24 w-24 rounded-lg object-cover" />
    ) : (
      <img src={url} alt="" className="h-24 w-24 rounded-lg object-cover" />
    )}
    <button onClick={onRemove} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white">
      <X className="h-3 w-3" />
    </button>
  </div>
);

const ChatView = ({ thread, onBack }: { thread: ChatThread; onBack: () => void }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.threads.messages(thread.id)
      .then(setMessages)
      .catch(console.error)
      .finally(() => setLoading(false));
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  }, [thread.id]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    const localUrl = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    setMediaPreview({ url: localUrl, type });
  };

  const sendMessage = async () => {
    if (!user || (!newMsg.trim() && !mediaFile) || sending) return;
    setSending(true);
    try {
      let mediaUrl: string | undefined;
      let mediaType: string | undefined;
      if (mediaFile) {
        setUploading(true);
        const result = await api.upload(mediaFile);
        mediaUrl = result.url;
        mediaType = result.mediaType;
        setUploading(false);
      }
      const msg = await api.threads.send(thread.id, {
        senderId: user.id,
        text: newMsg.trim(),
        mediaUrl,
        mediaType,
      });
      setMessages((m) => [...m, msg]);
      setNewMsg("");
      setMediaFile(null);
      setMediaPreview(null);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative">
            <img src={threadAvatar(thread)} alt="" className="h-9 w-9 rounded-full bg-muted object-cover" />
            {thread.isGroup && (
              <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                <Users className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
            )}
          </div>
          <div>
            <p className="font-display font-semibold text-sm text-foreground">{threadName(thread)}</p>
            <p className="text-xs text-muted-foreground">{thread.isGroup ? `${thread.group?.memberCount || ""} участников` : thread.user?.institution}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Нет сообщений. Начните общение!</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender?.id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <img src={getAvatar(msg.sender)} alt="" className="h-7 w-7 rounded-full bg-muted object-cover mr-2 mt-1 flex-shrink-0" />
                )}
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {!isMe && thread.isGroup && (
                    <span className="text-[10px] font-semibold text-primary ml-1">{msg.sender?.name}</span>
                  )}
                  <div className={`rounded-2xl px-3 py-2 ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card border border-border rounded-bl-sm"}`}>
                    {msg.mediaUrl && msg.mediaType === "video" ? (
                      <video src={msg.mediaUrl} controls className="max-w-full rounded-lg mb-1" style={{ maxHeight: 200 }} />
                    ) : msg.mediaUrl ? (
                      <img src={msg.mediaUrl} alt="" className="max-w-full rounded-lg mb-1 cursor-pointer" style={{ maxHeight: 200 }} onClick={() => window.open(msg.mediaUrl!, "_blank")} />
                    ) : null}
                    {msg.text && <p className="text-sm">{msg.text}</p>}
                    <p className={`text-[10px] mt-0.5 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border bg-card/95 backdrop-blur p-3">
        {mediaPreview && (
          <div className="mb-2 flex items-center gap-2">
            <MediaPreview url={mediaPreview.url} type={mediaPreview.type} onRemove={() => { setMediaFile(null); setMediaPreview(null); }} />
          </div>
        )}
        <div className="flex gap-2 items-end">
          <button onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 pb-2.5">
            <Image className="h-5 w-5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          <textarea
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Написать сообщение..."
            rows={1}
            className="flex-1 rounded-xl bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            style={{ maxHeight: 100, overflowY: "auto" }}
          />
          <button
            onClick={sendMessage}
            disabled={(!newMsg.trim() && !mediaFile) || sending}
            className="rounded-xl bg-primary p-2.5 text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity flex-shrink-0"
          >
            {sending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const MessagesPage = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    api.threads.list(user.id)
      .then(setThreads)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (selectedThread) {
    return <ChatView thread={selectedThread} onBack={() => setSelectedThread(null)} />;
  }

  const filtered = threads.filter((t) =>
    threadName(t).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <h1 className="font-display text-xl font-bold text-foreground mb-3">Сообщения</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..." className="w-full rounded-lg bg-secondary py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-muted-foreground text-sm">
            {threads.length === 0 ? "Нет чатов. Вступите в группу, чтобы общаться с её участниками!" : "Чаты не найдены"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((thread) => (
            <button key={thread.id} onClick={() => setSelectedThread(thread)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors">
              <div className="relative flex-shrink-0">
                <img src={threadAvatar(thread)} alt="" className="h-12 w-12 rounded-full bg-muted object-cover" />
                {thread.isGroup && (
                  <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Users className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                {thread.unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {thread.unread}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-sm text-foreground truncate">{threadName(thread)}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{formatTime(thread.lastMessageTime)}</span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${thread.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {thread.lastMessage || "Нет сообщений"}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
