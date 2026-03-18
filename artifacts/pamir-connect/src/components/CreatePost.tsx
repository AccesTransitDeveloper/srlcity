import { useState } from "react";
import { ImagePlus, Send } from "lucide-react";

interface CreatePostProps {
  avatar: string;
  onPost: (content: string) => void;
}

const CreatePost = ({ avatar, onPost }: CreatePostProps) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;
    onPost(text);
    setText("");
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <img src={avatar} alt="" className="h-9 w-9 rounded-full bg-muted object-cover" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Что нового?"
          rows={2}
          className="flex-1 resize-none bg-transparent text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <button className="text-muted-foreground hover:text-primary transition-colors">
          <ImagePlus className="h-5 w-5" />
        </button>
        <button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          <Send className="h-3.5 w-3.5" />
          Опубликовать
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
