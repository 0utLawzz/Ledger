import { Router } from "express";
import { db, clientStageRatesTable, clientsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetClientRatesParams, UpdateClientRatesParams } from "@workspace/api-zod";
import { z } from "zod";

const router = Router();

const StageRateInputItem = z.object({
  stage: z.number().int().min(1).max(4),
  rate: z.number().min(0),
  label: z.string().optional(),
});

type StageRateRow = typeof clientStageRatesTable.$inferSelect;

function fmt(r: StageRateRow) {
  return { ...r, rate: Number(r.rate) };
}

router.get("/clients/:id/rates", async (req, res) => {
  const parsed = GetClientRatesParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const [client] = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.id, parsed.data.id));
    if (!client) { res.status(404).json({ error: "Client not found" }); return; }
    const rates = await db.select().from(clientStageRatesTable).where(eq(clientStageRatesTable.clientId, parsed.data.id)).orderBy(clientStageRatesTable.stage);
    res.json(rates.map(fmt));
  } catch (err) {
    req.log.error({ err }, "Failed to get client rates");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/clients/:id/rates", async (req, res) => {
  const paramsParsed = UpdateClientRatesParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const bodyParsed = z.array(StageRateInputItem).safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid request body" }); return; }
  const clientId = paramsParsed.data.id;
  try {
    const [client] = await db.select({ id: clientsTable.id }).from(clientsTable).where(eq(clientsTable.id, clientId));
    if (!client) { res.status(404).json({ error: "Client not found" }); return; }

    await db.delete(clientStageRatesTable).where(eq(clientStageRatesTable.clientId, clientId));

    if (bodyParsed.data.length > 0) {
      await db.insert(clientStageRatesTable).values(
        bodyParsed.data.map(r => ({
          clientId,
          stage: r.stage,
          rate: String(r.rate),
          label: r.label ?? null,
        }))
      );
    }

    const rates = await db.select().from(clientStageRatesTable).where(eq(clientStageRatesTable.clientId, clientId)).orderBy(clientStageRatesTable.stage);
    res.json(rates.map(fmt));
  } catch (err) {
    req.log.error({ err }, "Failed to update client rates");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
