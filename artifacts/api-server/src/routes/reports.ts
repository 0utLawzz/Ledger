import { Router } from "express";
import { db, casesTable, clientsTable } from "@workspace/db";
import { eq, count, sum } from "drizzle-orm";
import { GetClientReportParams } from "@workspace/api-zod";

const router = Router();

router.get("/reports/summary", async (req, res) => {
  try {
    const [clientCount] = await db.select({ count: count() }).from(clientsTable);
    const [caseCount] = await db.select({ count: count() }).from(casesTable);

    const totals = await db.select({
      totalDue: sum(casesTable.due),
      totalReceived: sum(casesTable.received),
    }).from(casesTable);

    const stageRows = await db
      .select({ stage: casesTable.stage, count: count() })
      .from(casesTable)
      .groupBy(casesTable.stage)
      .orderBy(casesTable.stage);

    const totalDue = Number(totals[0]?.totalDue ?? 0);
    const totalReceived = Number(totals[0]?.totalReceived ?? 0);

    res.json({
      totalClients: clientCount.count,
      totalCases: caseCount.count,
      totalDue,
      totalReceived,
      totalBalance: totalDue - totalReceived,
      casesByStage: stageRows.map(r => ({ stage: r.stage, count: r.count })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get report summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/reports/client/:id", async (req, res) => {
  const parsed = GetClientReportParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  try {
    const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, parsed.data.id));
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    const cases = await db.select().from(casesTable).where(eq(casesTable.clientId, parsed.data.id));

    const totalDue = cases.reduce((s, c) => s + Number(c.due), 0);
    const totalReceived = cases.reduce((s, c) => s + Number(c.received), 0);

    res.json({
      client: { ...client, createdAt: client.createdAt.toISOString() },
      cases: cases.map(c => ({
        ...c,
        clientName: client.name,
        due: Number(c.due),
        received: Number(c.received),
        balance: Number(c.due) - Number(c.received),
        createdAt: c.createdAt.toISOString(),
      })),
      totalDue,
      totalReceived,
      totalBalance: totalDue - totalReceived,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get client report");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
