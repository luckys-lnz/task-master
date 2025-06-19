"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationTokens = exports.sessions = exports.accounts = exports.subtasksRelations = exports.tasksRelations = exports.usersRelations = exports.subtasks = exports.tasks = exports.users = exports.TaskPriority = void 0;
var drizzle_orm_1 = require("drizzle-orm");
var pg_core_1 = require("drizzle-orm/pg-core");
// Define priority enum values
exports.TaskPriority = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    URGENT: "URGENT",
};
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)("name"),
    email: (0, pg_core_1.text)("email").unique().notNull(),
    emailVerified: (0, pg_core_1.timestamp)("emailVerified", { mode: "date" }),
    image: (0, pg_core_1.text)("image"),
    hashedPassword: (0, pg_core_1.text)("hashedPassword"),
    avatar_url: (0, pg_core_1.text)("avatar_url"),
    notifications_enabled: (0, pg_core_1.boolean)("notifications_enabled").default(true),
    default_view: (0, pg_core_1.text)("default_view").default("list"),
    theme: (0, pg_core_1.text)("theme").default("light"),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull()
});
exports.tasks = (0, pg_core_1.pgTable)("tasks", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    user_id: (0, pg_core_1.uuid)("user_id").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    title: (0, pg_core_1.text)("title").notNull(),
    description: (0, pg_core_1.text)("description"),
    due_date: (0, pg_core_1.timestamp)("due_date", { mode: "date" }),
    priority: (0, pg_core_1.text)("priority").notNull().default("LOW"),
    tags: (0, pg_core_1.text)("tags").array(),
    position: (0, pg_core_1.text)("position"),
    is_completed: (0, pg_core_1.boolean)("is_completed").default(false),
    created_at: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updated_at: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull()
});
exports.subtasks = (0, pg_core_1.pgTable)("subtasks", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    task_id: (0, pg_core_1.uuid)("task_id").notNull().references(function () { return exports.tasks.id; }, { onDelete: "cascade" }),
    title: (0, pg_core_1.text)("title").notNull(),
    is_completed: (0, pg_core_1.boolean)("is_completed").default(false)
});
// Define relations
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, function (_a) {
    var many = _a.many;
    return ({
        tasks: many(exports.tasks)
    });
});
exports.tasksRelations = (0, drizzle_orm_1.relations)(exports.tasks, function (_a) {
    var one = _a.one, many = _a.many;
    return ({
        user: one(exports.users, {
            fields: [exports.tasks.user_id],
            references: [exports.users.id],
        }),
        subtasks: many(exports.subtasks)
    });
});
exports.subtasksRelations = (0, drizzle_orm_1.relations)(exports.subtasks, function (_a) {
    var one = _a.one;
    return ({
        task: one(exports.tasks, {
            fields: [exports.subtasks.task_id],
            references: [exports.tasks.id],
        })
    });
});
// Auth tables
exports.accounts = (0, pg_core_1.pgTable)("accounts", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("userId").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    type: (0, pg_core_1.text)("type").notNull(),
    provider: (0, pg_core_1.text)("provider").notNull(),
    providerAccountId: (0, pg_core_1.text)("providerAccountId").notNull(),
    refresh_token: (0, pg_core_1.text)("refresh_token"),
    access_token: (0, pg_core_1.text)("access_token"),
    expires_at: (0, pg_core_1.timestamp)("expires_at"),
    token_type: (0, pg_core_1.text)("token_type"),
    scope: (0, pg_core_1.text)("scope"),
    id_token: (0, pg_core_1.text)("id_token"),
    session_state: (0, pg_core_1.text)("session_state")
});
exports.sessions = (0, pg_core_1.pgTable)("sessions", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("userId").notNull().references(function () { return exports.users.id; }, { onDelete: "cascade" }),
    sessionToken: (0, pg_core_1.text)("sessionToken").unique().notNull(),
    expires: (0, pg_core_1.timestamp)("expires").notNull()
});
exports.verificationTokens = (0, pg_core_1.pgTable)("verification_tokens", {
    identifier: (0, pg_core_1.text)("identifier").notNull(),
    token: (0, pg_core_1.text)("token").notNull(),
    expires: (0, pg_core_1.timestamp)("expires").notNull(),
}, function (vt) { return ({
    compoundKey: [vt.identifier, vt.token],
}); });
