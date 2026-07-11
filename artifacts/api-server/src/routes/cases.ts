import { Router } from "express";
import { db, casesTable, clientsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateCaseBody, UpdateCaseBody, GetCaseParams, UpdateCaseParams, DeleteCaseParams, ListCasesQueryParams } from "@workspace/api-zod";

const router = Router();

function formatCase(c: typeof casesTable.$inferSelect, clientName?: string | null) {
  return {
    ...c,
    clientName: clientName ?? null,
    due: Number(c.due),
    received: Number(c.received),
    balance: Number(c.due) - Number(c.received),
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/cases", async (req, res) => {
  const parsed = ListCasesQueryParams.safeParse({
    clientId: req.query.clientId !== undefined ? Number(req.query.clientId) : undefined,
    stage: req.query.stage !== undefined ? Number(req.query.stage) : undefined,
  });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  try {
    const conditions = [];
    if (parsed.data.clientId != null) {
      conditions.push(eq(casesTable.clientId, parsed.data.clientId));
    }
    if (parsed.data.stage != null) {
      conditions.push(eq(casesTable.stage, parsed.data.stage));
    }

    const rows = await db
      .select({
        case: casesTable,
        clientName: clientsTable.name,
      })
      .from(casesTable)
      .leftJoin(clientsTable, eq(casesTable.clientId, clientsTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(casesTable.createdAt);

    res.json(rows.map(r => formatCase(r.case, r.clientName)));
  } catch (err) {
    req.log.error({ err }, "Failed to list cases");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cases", async (req, res) => {
  const parsed = CreateCaseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const { due, received, ...rest } = parsed.data;
    const [newCase] = await db.insert(casesTable).values({
      ...rest,
      due: String(due),
      received: String(received),
    }).returning();

    const [client] = await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, newCase.clientId));
    res.status(201).json(formatCase(newCase, client?.name));
  } catch (err) {
    req.log.error({ err }, "Failed to create case");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/cases/:id", async (req, res) => {
  const parsed = GetCaseParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [row] = await db
      .select({ case: casesTable, clientName: clientsTable.name })
      .from(casesTable)
      .leftJoin(clientsTable, eq(casesTable.clientId, clientsTable.id))
      .where(eq(casesTable.id, parsed.data.id));

    if (!row) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    res.json(formatCase(row.case, row.clientName));
  } catch (err) {
    req.log.error({ err }, "Failed to get case");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/cases/:id", async (req, res) => {
  const paramsParsed = UpdateCaseParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const bodyParsed = UpdateCaseBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  try {
    const { due, received, ...rest } = bodyParsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (due !== undefined) updateData.due = String(due);
    if (received !== undefined) updateData.received = String(received);

    const [updatedCase] = await db.update(casesTable)
      .set(updateData)
      .where(eq(casesTable.id, paramsParsed.data.id))
      .returning();

    if (!updatedCase) {
      res.status(404).json({ error: "Case not found" });
      return;
    }
    const [client] = await db.select({ name: clientsTable.name }).from(clientsTable).where(eq(clientsTable.id, updatedCase.clientId));
    res.json(formatCase(updatedCase, client?.name));
  } catch (err) {
    req.log.error({ err }, "Failed to update case");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cases/:id", async (req, res) => {
  const parsed = DeleteCaseParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    await db.delete(casesTable).where(eq(casesTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete case");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
