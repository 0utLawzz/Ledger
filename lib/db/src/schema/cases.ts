import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";

export const casesTable = pgTable("cases", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  caseNo: text("case_no").notNull(),
  date: text("date").notNull(),
  stage: integer("stage").notNull().default(1),
  tmNumber: text("tm_number"),
  detail: text("detail"),
  due: numeric("due", { precision: 12, scale: 2 }).notNull().default("0"),
  received: numeric("received", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCaseSchema = createInsertSchema(casesTable).omit({ id: true, createdAt: true });
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof casesTable.$inferSelect;
