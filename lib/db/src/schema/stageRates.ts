import { pgTable, serial, integer, numeric, text } from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";

export const clientStageRatesTable = pgTable("client_stage_rates", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  stage: integer("stage").notNull(),
  rate: numeric("rate", { precision: 12, scale: 2 }).notNull().default("0"),
  label: text("label"),
});
