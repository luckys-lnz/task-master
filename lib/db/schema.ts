import { relations } from "drizzle-orm";
import { pgTable, uuid, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

// Define priority enum values
export const TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

export type TaskPriorityType = typeof TaskPriority[keyof typeof TaskPriority];

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  hashed_password: text("hashed_password"),
  avatar_url: text("avatar_url"),
  notifications_enabled: boolean("notifications_enabled").default(true),
  default_view: text("default_view").default("list"),
  theme: text("theme").default("light"),
  reset_password_token: text("reset_password_token"),
  reset_password_expires: timestamp("reset_password_expires", { mode: "date" }),
  email_verification_token: text("email_verification_token"),
  email_verification_expires: timestamp("email_verification_expires", { mode: "date" }),
  failed_login_attempts: text("failed_login_attempts").default("0"),
  locked_until: timestamp("locked_until", { mode: "date" }),
  created_at: timestamp("created_at").defaultNow().notNull()
});

export const tasks = pgTable('tasks', {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  notes: text("notes"), 
  due_date: timestamp("due_date", { mode: "date" }),
  due_time: text("due_time"),
  priority: text("priority", { enum: ["LOW", "MEDIUM", "HIGH", "URGENT"] }).notNull().default("LOW"),
  category: text("category"),
  tags: text("tags").array(),
  position: text("position"),
  completed: boolean('completed').default(false).notNull(),
  attachments: text("attachments").array(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const subtasks = pgTable('subtasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  completed: boolean('completed').default(false).notNull(),
  task_id: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks)
}));

export const tasksRelations = relations(tasks, ({ many }) => ({
  subtasks: many(subtasks),
}));

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.task_id],
    references: [tasks.id],
  }),
}));

// Auth tables - using snake_case column names to match DrizzleAdapter expectations
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state")
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionToken: text("sessionToken").unique().notNull(),
  expires: timestamp("expires").notNull()
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type SubTask = typeof subtasks.$inferSelect;
export type NewSubTask = typeof subtasks.$inferInsert;