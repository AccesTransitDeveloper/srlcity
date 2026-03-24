import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { profilesTable, phoneOtpsTable } from "@workspace/db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "pamir-connect-jwt-secret-2026";
const SALT_ROUNDS = 10;

function makeToken(profileId: string) {
  return jwt.sign({ sub: profileId }, JWT_SECRET, { expiresIn: "30d" });
}

function sanitize(p: any) {
  const { passwordHash, ...rest } = p;
  return rest;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string) {
  return phone.replace(/[\s\-\(\)]/g, "");
}

router.post("/auth/register", async (req, res) => {
  try {
    const { email, password, name, institution, city, bio } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password и имя обязательны" });
    }
    const existing = await db.select().from(profilesTable).where(eq(profilesTable.email, email.toLowerCase().trim()));
    if (existing.length > 0) {
      return res.status(409).json({ error: "Этот email уже зарегистрирован" });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [profile] = await db
      .insert(profilesTable)
      .values({ email: email.toLowerCase().trim(), passwordHash, name: name.trim(), institution, city, bio })
      .returning();
    const token = makeToken(profile.id);
    res.status(201).json({ token, user: sanitize(profile) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email и пароль обязательны" });
    }
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.email, email.toLowerCase().trim()));
    if (!profile || !profile.passwordHash) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }
    const valid = await bcrypt.compare(password, profile.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }
    const token = makeToken(profile.id);
    res.json({ token, user: sanitize(profile) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/auth/me", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as { sub: string };
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.id, payload.sub));
    if (!profile) return res.status(404).json({ error: "User not found" });
    res.json(sanitize(profile));
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.post("/auth/phone/request", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: "Номер телефона обязателен" });
    const normalized = normalizePhone(phone);
    if (normalized.length < 7) return res.status(400).json({ error: "Неверный формат номера" });

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.delete(phoneOtpsTable).where(eq(phoneOtpsTable.phone, normalized));
    await db.insert(phoneOtpsTable).values({ phone: normalized, code, expiresAt });

    const existing = await db.select().from(profilesTable).where(eq(profilesTable.phone, normalized));
    const isNew = existing.length === 0;

    res.json({ code, isNew, message: `Код: ${code}` });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/auth/phone/verify", async (req, res) => {
  try {
    const { phone, code, name } = req.body;
    if (!phone || !code) return res.status(400).json({ error: "Телефон и код обязательны" });
    const normalized = normalizePhone(phone);

    const [otp] = await db
      .select()
      .from(phoneOtpsTable)
      .where(
        and(
          eq(phoneOtpsTable.phone, normalized),
          eq(phoneOtpsTable.code, code),
          gt(phoneOtpsTable.expiresAt, new Date())
        )
      );

    if (!otp) return res.status(401).json({ error: "Неверный или устаревший код" });

    await db.delete(phoneOtpsTable).where(eq(phoneOtpsTable.phone, normalized));

    let existing = await db.select().from(profilesTable).where(eq(profilesTable.phone, normalized));
    let profile: any;

    if (existing.length > 0) {
      profile = existing[0];
    } else {
      const displayName = (name || "").trim();
      if (!displayName) return res.status(400).json({ error: "Введите ваше имя", needName: true });
      const [created] = await db
        .insert(profilesTable)
        .values({ phone: normalized, name: displayName })
        .returning();
      profile = created;
    }

    const token = makeToken(profile.id);
    res.json({ token, user: sanitize(profile), isNew: existing.length === 0 });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
