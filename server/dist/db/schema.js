"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roadmapEdges = exports.roadmapNodes = exports.tasks = exports.flowSessions = exports.users = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.users = (0, sqlite_core_1.sqliteTable)("users", {
    id: (0, sqlite_core_1.text)("id").primaryKey(), // UUID string
    email: (0, sqlite_core_1.text)("email").notNull().unique(),
    passwordHash: (0, sqlite_core_1.text)("password_hash").notNull(),
    createdAt: (0, sqlite_core_1.text)("created_at")
        .default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`)
        .notNull(),
});
exports.flowSessions = (0, sqlite_core_1.sqliteTable)("flow_sessions", {
    id: (0, sqlite_core_1.text)("id").primaryKey(),
    userId: (0, sqlite_core_1.text)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    title: (0, sqlite_core_1.text)("title").notNull(),
    duration: (0, sqlite_core_1.integer)("duration").notNull(), // in minutes
    status: (0, sqlite_core_1.text)("status").notNull(), // 'completed', 'cancelled', 'in_progress'
    tags: (0, sqlite_core_1.text)("tags"), // JSON array stringified
    createdAt: (0, sqlite_core_1.text)("created_at")
        .default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`)
        .notNull(),
}, (table) => ({
    userIdIdx: (0, sqlite_core_1.index)("flow_user_id_idx").on(table.userId),
    statusIdx: (0, sqlite_core_1.index)("flow_status_idx").on(table.status),
    createdIdx: (0, sqlite_core_1.index)("flow_created_idx").on(table.createdAt),
}));
exports.tasks = (0, sqlite_core_1.sqliteTable)("tasks", {
    id: (0, sqlite_core_1.text)("id").primaryKey(),
    userId: (0, sqlite_core_1.text)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    title: (0, sqlite_core_1.text)("title").notNull(),
    description: (0, sqlite_core_1.text)("description"),
    status: (0, sqlite_core_1.text)("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed'
    dueDate: (0, sqlite_core_1.text)("due_date"), // ISO string
    createdAt: (0, sqlite_core_1.text)("created_at")
        .default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`)
        .notNull(),
}, (table) => ({
    userIdIdx: (0, sqlite_core_1.index)("task_user_id_idx").on(table.userId),
    dueDateIdx: (0, sqlite_core_1.index)("task_due_date_idx").on(table.dueDate),
}));
exports.roadmapNodes = (0, sqlite_core_1.sqliteTable)("roadmap_nodes", {
    id: (0, sqlite_core_1.text)("id").primaryKey(),
    userId: (0, sqlite_core_1.text)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    title: (0, sqlite_core_1.text)("title").notNull(),
    sub: (0, sqlite_core_1.text)("sub").notNull(),
    status: (0, sqlite_core_1.text)("status").notNull(),
    statusClass: (0, sqlite_core_1.text)("status_class").notNull(),
    progress: (0, sqlite_core_1.integer)("progress").notNull(), // percentage or decimal represented
    icon: (0, sqlite_core_1.text)("icon").notNull(),
    iconWrap: (0, sqlite_core_1.text)("icon_wrap").notNull(),
    meta: (0, sqlite_core_1.text)("meta").notNull(),
    current: (0, sqlite_core_1.integer)("current", { mode: "boolean" }),
    blocked: (0, sqlite_core_1.integer)("blocked", { mode: "boolean" }),
    positionX: (0, sqlite_core_1.integer)("position_x").notNull(),
    positionY: (0, sqlite_core_1.integer)("position_y").notNull(),
    createdAt: (0, sqlite_core_1.text)("created_at")
        .default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`)
        .notNull(),
}, (table) => ({
    userIdIdx: (0, sqlite_core_1.index)("roadmap_node_user_id_idx").on(table.userId),
}));
exports.roadmapEdges = (0, sqlite_core_1.sqliteTable)("roadmap_edges", {
    id: (0, sqlite_core_1.text)("id").primaryKey(),
    userId: (0, sqlite_core_1.text)("user_id")
        .notNull()
        .references(() => exports.users.id, { onDelete: "cascade" }),
    sourceId: (0, sqlite_core_1.text)("source_id").notNull(),
    targetId: (0, sqlite_core_1.text)("target_id").notNull(),
    createdAt: (0, sqlite_core_1.text)("created_at")
        .default((0, drizzle_orm_1.sql) `(CURRENT_TIMESTAMP)`)
        .notNull(),
}, (table) => ({
    userIdIdx: (0, sqlite_core_1.index)("roadmap_edge_user_id_idx").on(table.userId),
}));
