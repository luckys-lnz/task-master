import { pgTable, text, timestamp, unique, uuid, boolean, foreignKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const verificationTokens = pgTable("verification_tokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: timestamp("email_verified", { mode: 'string' }),
	image: text(),
	hashedPassword: text("hashed_password"),
	avatarUrl: text("avatar_url"),
	notificationsEnabled: boolean("notifications_enabled").default(true),
	defaultView: text("default_view").default('list'),
	theme: text().default('light'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const tasks = pgTable("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: text().notNull(),
	description: text(),
	dueDate: timestamp("due_date", { mode: 'string' }),
	priority: text().default('LOW').notNull(),
	tags: text().array(),
	position: text(),
	isCompleted: boolean("is_completed").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	notes: text(),
	dueTime: text("due_time"),
	category: text(),
	attachments: text().array(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "tasks_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	sessionToken: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("sessions_sessionToken_unique").on(table.sessionToken),
]);

export const subtasks = pgTable("subtasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	taskId: uuid("task_id").notNull(),
	title: text().notNull(),
	isCompleted: boolean("is_completed").default(false),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "subtasks_task_id_tasks_id_fk"
		}).onDelete("cascade"),
]);

export const accounts = pgTable("accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);
