import { useState, useEffect, useRef } from "react";
import { Plus, Car, MapPin, Calendar, Phone, Users, ArrowRight, X, Loader2, Camera, MessageCircle, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

function getAvatar(p: any) {
  return p?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p?.name || "driver"}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

const CITIES = [
  "Москва", "Санкт-Петербург", "Хорог", "Мургаб", "Ишкашим", "Рушан", "Ванч",
  "Душанбе", "Худжанд", "Куляб", "Пенджикент", "Бишкек", "Алматы", "Ош",
];

interface RideFormData {
  fromCity: string;
  toCity: string;
  price: string;
  currency: string;
  departureDate: string;
  seatsAvailable: string;
  carMake: string;
  carModel: string;
  carNumber: string;
  carPhotoUrl: string;
  contactPhone: string;
  notes: string;
}

const CreateRideModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: (r: any) => void }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<RideFormData>({
    fromCity: "", toCity: "", price: "", currency: "RUB",
    departureDate: "", seatsAvailable: "3",
    carMake: "", carModel: "", carNumber: "",
    carPhotoUrl: "", contactPhone: "", notes: "",
  });

  const set = (field: keyof RideFormData, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await api.upload(file);
      set("carPhotoUrl", url);
    } catch {
      setError("Ошибка загрузки фото");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromCity || !form.toCity || !form.price || !form.departureDate || !form.carMake || !form.carNumber || !form.contactPhone) {
      setError("Заполните все обязательные поля");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const ride = await api.rides.create({
        driverId: user!.id,
        fromCity: form.fromCity,
        toCity: form.toCity,
        price: Number(form.price),
        currency: form.currency,
        departureDate: new Date(form.departureDate).toISOString(),
        seatsAvailable: Number(form.seatsAvailable) || 3,
        carMake: form.carMake,
        carModel: form.carModel,
        carNumber: form.carNumber,
        carPhotoUrl: form.carPhotoUrl || undefined,
        contactPhone: form.contactPhone,
        notes: form.notes,
      });
      onCreated(ride);
      onClose();
    } catch (err: any) {
      setError(err.message || "Ошибка создания маршрута");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-t-2xl bg-card shadow-xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-card px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-foreground">Добавить маршрут</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Маршрут</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Откуда *</label>
                <input
                  list="cities-from"
                  value={form.fromCity}
                  onChange={e => set("fromCity", e.target.value)}
                  placeholder="Город отправления"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <datalist id="cities-from">{CITIES.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Куда *</label>
                <input
                  list="cities-to"
                  value={form.toCity}
                  onChange={e => set("toCity", e.target.value)}
                  placeholder="Город назначения"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <datalist id="cities-to">{CITIES.map(c => <option key={c} value={c} />)}</datalist>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Дата и время выезда *</label>
              <input
                type="datetime-local"
                value={form.departureDate}
                onChange={e => set("departureDate", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Цена *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => set("price", e.target.value)}
                    placeholder="1500"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <select value={form.currency} onChange={e => set("currency", e.target.value)} className="rounded-lg border border-border bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="RUB">₽</option>
                    <option value="TJS">сом.</option>
                    <option value="USD">$</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Мест</label>
                <select value={form.seatsAvailable} onChange={e => set("seatsAvailable", e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Автомобиль</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Марка *</label>
                <input value={form.carMake} onChange={e => set("carMake", e.target.value)} placeholder="Toyota" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Модель</label>
                <input value={form.carModel} onChange={e => set("carModel", e.target.value)} placeholder="Camry" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Гос. номер *</label>
              <input
                value={form.carNumber}
                onChange={e => set("carNumber", e.target.value.toUpperCase())}
                placeholder="А 123 ВС 77"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Фото автомобиля</label>
              {form.carPhotoUrl ? (
                <div className="relative inline-block">
                  <img src={form.carPhotoUrl} alt="Авто" className="h-24 w-full object-cover rounded-lg" />
                  <button type="button" onClick={() => set("carPhotoUrl", "")} className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-border py-6 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex flex-col items-center gap-2"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                  <span>{uploading ? "Загрузка..." : "Добавить фото"}</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }} />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Контакты</p>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Телефон *</label>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={e => set("contactPhone", e.target.value)}
                placeholder="+7 999 123 45 67"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Примечание</label>
              <textarea
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Остановки, условия, груз..."
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
          </div>

          {error && <p className="text-xs text-destructive font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full rounded-xl bg-primary py-3 font-display font-semibold text-primary-foreground disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Публикация...</> : "Опубликовать маршрут"}
          </button>
        </form>
      </div>
    </div>
  );
};

const RideCard = ({ ride, isOwn, onCancel, onChat }: { ride: any; isOwn: boolean; onCancel?: (id: string) => void; onChat: (driverId: string) => void }) => {
  const { user } = useAuth();
  const isCancelled = ride.status === "cancelled";

  return (
    <div className={`rounded-xl border bg-card overflow-hidden shadow-sm ${isCancelled ? "opacity-60 border-border" : "border-border"}`}>
      {ride.carPhotoUrl && (
        <img src={ride.carPhotoUrl} alt={ride.carMake} className="h-36 w-full object-cover bg-muted" loading="lazy" />
      )}
      <div className="p-4">
        {isCancelled && (
          <span className="inline-block mb-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Отменён</span>
        )}

        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-display font-bold text-sm text-foreground">{ride.fromCity}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-display font-bold text-sm text-foreground">{ride.toCity}</span>
          <span className="ml-auto font-display font-bold text-base text-primary">
            {ride.price.toLocaleString("ru-RU")} {ride.currency === "RUB" ? "₽" : ride.currency === "TJS" ? "сом." : "$"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{formatDate(ride.departureDate)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{ride.seatsAvailable} мест</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Car className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{ride.carMake} {ride.carModel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <span className="rounded bg-secondary px-1.5 py-0.5">{ride.carNumber}</span>
          </div>
        </div>

        {ride.notes && (
          <p className="text-xs text-muted-foreground mb-3 bg-secondary rounded-lg px-3 py-2">{ride.notes}</p>
        )}

        <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src={getAvatar(ride.driver)} alt={ride.driver?.name} className="h-8 w-8 rounded-full bg-muted object-cover flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-display font-semibold text-xs text-foreground truncate">{ride.driver?.name}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{ride.contactPhone}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isOwn && !isCancelled && onCancel && (
              <button
                onClick={() => onCancel(ride.id)}
                className="rounded-lg bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Отменить
              </button>
            )}
            {!isOwn && !isCancelled && (
              <button
                onClick={() => onChat(ride.driver?.id)}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Написать
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RidesPage = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [rides, setRides] = useState<any[]>([]);
  const [myRides, setMyRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [showCreate, setShowCreate] = useState(false);

  const loadRides = async () => {
    try {
      const [all, mine] = await Promise.all([
        api.rides.list({ status: "active" }),
        user ? api.rides.list({ driverId: user.id }) : Promise.resolve([]),
      ]);
      setRides(all);
      setMyRides(mine);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRides();
  }, [user?.id]);

  const handleCreated = (ride: any) => {
    setMyRides(r => [ride, ...r]);
    setRides(r => [ride, ...r]);
    setTab("mine");
  };

  const handleCancel = async (rideId: string) => {
    if (!user) return;
    try {
      const updated = await api.rides.cancel(rideId, user.id);
      setMyRides(r => r.map(ride => ride.id === rideId ? updated : ride));
      setRides(r => r.filter(ride => ride.id !== rideId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleChat = async (driverId: string) => {
    if (!user || !driverId) return;
    try {
      await api.threads.create({ user1Id: user.id, user2Id: driverId });
      navigate("/messages");
    } catch (e) {
      console.error(e);
      navigate("/messages");
    }
  };

  const displayed = tab === "all" ? rides : myRides;

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Попутчики</h1>
            <p className="text-xs text-muted-foreground">Маршруты и поездки</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Маршрут
          </button>
        </div>

        <div className="flex rounded-xl bg-secondary p-1">
          <button
            onClick={() => setTab("all")}
            className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-all ${tab === "all" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
          >
            Все маршруты
          </button>
          <button
            onClick={() => setTab("mine")}
            className={`flex-1 rounded-lg py-1.5 text-sm font-semibold transition-all ${tab === "mine" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
          >
            Мои маршруты
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Car className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-foreground">
            {tab === "all" ? "Маршрутов пока нет" : "Вы не добавили маршрутов"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === "all" ? "Будьте первым — добавьте свой маршрут" : "Нажмите «Маршрут», чтобы добавить поездку"}
          </p>
          <button onClick={() => setShowCreate(true)} className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
            Добавить маршрут
          </button>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {displayed.map(ride => (
            <RideCard
              key={ride.id}
              ride={ride}
              isOwn={ride.driver?.id === user?.id}
              onCancel={handleCancel}
              onChat={handleChat}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateRideModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
    </div>
  );
};

export default RidesPage;
