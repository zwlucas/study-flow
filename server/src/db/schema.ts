import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID string
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
});

export const flowSessions = sqliteTable(
  "flow_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    duration: integer("duration").notNull(), // in minutes
    status: text("status").notNull(), // 'completed', 'cancelled', 'in_progress'
    tags: text("tags"), // JSON array stringified
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table: any) => ({
    userIdIdx: index("flow_user_id_idx").on(table.userId),
    statusIdx: index("flow_status_idx").on(table.status),
    createdIdx: index("flow_created_idx").on(table.createdAt),
  })
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed'
    dueDate: text("due_date"), // ISO string
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table: any) => ({
    userIdIdx: index("task_user_id_idx").on(table.userId),
    dueDateIdx: index("task_due_date_idx").on(table.dueDate),
  })
);

export const roadmapNodes = sqliteTable(
  "roadmap_nodes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sub: text("sub").notNull(),
    status: text("status").notNull(), 
    statusClass: text("status_class").notNull(),
    progress: integer("progress").notNull(), // percentage or decimal represented
    icon: text("icon").notNull(), 
    iconWrap: text("icon_wrap").notNull(),
    meta: text("meta").notNull(),
    current: integer("current", { mode: "boolean" }), 
    blocked: integer("blocked", { mode: "boolean" }),
    positionX: integer("position_x").notNull(),
    positionY: integer("position_y").notNull(),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table: any) => ({
    userIdIdx: index("roadmap_node_user_id_idx").on(table.userId),
  })
);

export const roadmapEdges = sqliteTable(
  "roadmap_edges",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceId: text("source_id").notNull(),
    targetId: text("target_id").notNull(),
    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
  },
  (table: any) => ({
    userIdIdx: index("roadmap_edge_user_id_idx").on(table.userId),
  })
);
