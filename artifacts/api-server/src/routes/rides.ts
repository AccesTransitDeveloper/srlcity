import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ridesTable, profilesTable } from "@workspace/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";

const router: IRouter = Router();

function sanitizeProfile(p: any) {
  if (!p) return null;
  const { passwordHash, email, ...rest } = p;
  return rest;
}

async function enrichRide(ride: typeof ridesTable.$inferSelect) {
  const [driver] = await db.select().from(profilesTable).where(eq(profilesTable.id, ride.driverId));
  return {
    ...ride,
    driver: sanitizeProfile(driver),
  };
}

router.get("/rides", async (req, res) => {
  try {
    const driverId = req.query.driverId as string | undefined;
    const status = (req.query.status as string) || "active";

    let rows;
    if (driverId) {
      rows = await db
        .select()
        .from(ridesTable)
        .where(eq(ridesTable.driverId, driverId))
        .orderBy(desc(ridesTable.createdAt));
    } else {
      rows = await db
        .select()
        .from(ridesTable)
        .where(eq(ridesTable.status, status))
        .orderBy(desc(ridesTable.departureDate));
    }

    const enriched = await Promise.all(rows.map(enrichRide));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post("/rides", async (req, res) => {
  try {
    const {
      driverId, fromCity, toCity, price, currency, departureDate,
      seatsAvailable, carMake, carModel, carNumber, carPhotoUrl,
      contactPhone, notes,
    } = req.body;

    if (!driverId || !fromCity || !toCity || !price || !departureDate || !carMake || !carNumber || !contactPhone) {
      return res.status(400).json({ error: "Заполните все обязательные поля" });
    }

    const [ride] = await db.insert(ridesTable).values({
      driverId,
      fromCity: fromCity.trim(),
      toCity: toCity.trim(),
      price: Number(price),
      currency: currency || "RUB",
      departureDate: new Date(departureDate),
      seatsAvailable: Number(seatsAvailable) || 3,
      carMake: carMake.trim(),
      carModel: (carModel || "").trim(),
      carNumber: carNumber.trim().toUpperCase(),
      carPhotoUrl: carPhotoUrl || null,
      contactPhone: contactPhone.trim(),
      notes: (notes || "").trim(),
    }).returning();

    const enriched = await enrichRide(ride);
    res.status(201).json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get("/rides/:id", async (req, res) => {
  try {
    const [ride] = await db.select().from(ridesTable).where(eq(ridesTable.id, req.params.id));
    if (!ride) return res.status(404).json({ error: "Маршрут не найден" });
    const enriched = await enrichRide(ride);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch("/rides/:id/cancel", async (req, res) => {
  try {
    const { driverId } = req.body;
    const [ride] = await db
      .update(ridesTable)
      .set({ status: "cancelled" })
      .where(and(eq(ridesTable.id, req.params.id), eq(ridesTable.driverId, driverId)))
      .returning();
    if (!ride) return res.status(404).json({ error: "Маршрут не найден" });
    const enriched = await enrichRide(ride);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.delete("/rides/:id", async (req, res) => {
  try {
    const { driverId } = req.body;
    await db.delete(ridesTable).where(and(eq(ridesTable.id, req.params.id), eq(ridesTable.driverId, driverId)));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
