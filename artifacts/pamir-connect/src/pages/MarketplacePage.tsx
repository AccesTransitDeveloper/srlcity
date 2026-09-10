import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, PackagePlus, ShoppingBag, Store, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { MarketplaceProduct } from "@/types";

const STORAGE_KEY = "pamir_marketplace_products";

function readProducts(): MarketplaceProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MarketplaceProduct[]) : [];
  } catch {
    return [];
  }
}

function saveProducts(products: MarketplaceProduct[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

const initialForm = {
  title: "",
  price: "",
  description: "",
  category: "",
  imageUrl: "",
};

const AddProductModal = ({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (product: MarketplaceProduct) => void;
}) => {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initialForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const uploaded = await api.upload(file);
      set("imageUrl", uploaded.url);
    } catch {
      setError("Ошибка загрузки изображения");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price.trim()) {
      setError("Заполните название и цену");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const product: MarketplaceProduct = {
        id: crypto.randomUUID(),
        title: form.title.trim(),
        price: form.price.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        imageUrl: form.imageUrl.trim() || null,
        sellerName: user?.name || "Пользователь",
        sellerId: user?.id,
        createdAt: new Date().toISOString(),
      };
      onCreated(product);
      onClose();
    } catch {
      setError("Не удалось сохранить товар");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base text-foreground">Добавить товар</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Фото товара</label>
            {form.imageUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-border">
                <img src={form.imageUrl} alt="preview" className="h-36 w-full object-cover" />
                <button type="button" onClick={() => set("imageUrl", "")} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-6 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                <span>{uploading ? "Загрузка..." : "Загрузить фото"}</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const input = e.currentTarget; const file = input.files?.[0]; input.value = ""; if (file) await handleUpload(file); }} />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Название *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Например, Nike Air Max" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Цена *</label>
              <input value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="2500 сом" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Категория</label>
              <input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Одежда" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Описание</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Состояние, размер, доставка..." className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
          </div>

          {error && <p className="text-xs font-medium text-destructive">{error}</p>}

          <button type="submit" disabled={saving || uploading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Сохраняю...</> : <><PackagePlus className="h-4 w-4" /> Добавить товар</>}
          </button>
        </form>
      </div>
    </div>
  );
};

const MarketplacePage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    setProducts(readProducts());
  }, []);

  useEffect(() => {
    saveProducts(products);
  }, [products]);

  const sorted = useMemo(() => [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [products]);

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Маркетплейс</h1>
            <p className="text-xs text-muted-foreground">Покупки и товары сообщества</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity">
            <ShoppingBag className="h-4 w-4" />
            Добавить
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
            <Store className="mx-auto h-10 w-10 text-primary/70" />
            <h2 className="mt-3 font-display text-base font-semibold text-foreground">Пока нет товаров</h2>
            <p className="mt-1 text-sm text-muted-foreground">Добавьте первый товар и он появится в ленте маркетплейса.</p>
            {user && (
              <button onClick={() => setShowAdd(true)} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Добавить товар
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sorted.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                {product.imageUrl && <img src={product.imageUrl} alt={product.title} className="h-44 w-full object-cover bg-muted" />}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-semibold text-foreground">{product.title}</h3>
                      {product.category && <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>}
                    </div>
                    <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary whitespace-nowrap">
                      {product.price}
                    </div>
                  </div>
                  {product.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{product.description}</p>}
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span>Продавец: {product.sellerName}</span>
                    <span>{new Date(product.createdAt).toLocaleDateString("ru-RU")}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showAdd && <AddProductModal onClose={() => setShowAdd(false)} onCreated={(product) => setProducts((current) => [product, ...current])} />}
    </div>
  );
};

export default MarketplacePage;