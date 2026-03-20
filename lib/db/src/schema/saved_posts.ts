import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const savedPostsTable = pgTable("saved_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  articleUrl: text("article_url").notNull(),
  articleTitle: text("article_title").notNull(),
  articleSource: text("article_source").notNull(),
  articleDate: text("article_date").notNull(),
  articleDescription: text("article_description"),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

export const insertSavedPostSchema = createInsertSchema(savedPostsTable).omit({
  id: true,
  savedAt: true,
});
export type InsertSavedPost = z.infer<typeof insertSavedPostSchema>;
export type SavedPost = typeof savedPostsTable.$inferSelect;
