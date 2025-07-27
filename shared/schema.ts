import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const genderEnum = pgEnum("gender", ["male", "female"]);
export const roleEnum = pgEnum("role", ["staff", "resource_person", "trainee"]);
export const verificationMethodEnum = pgEnum("verification_method", ["email", "phone"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: roleEnum("role").notNull(),
  firstName: text("first_name").notNull(),
  surname: text("surname").notNull(),
  middleName: text("middle_name"),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull().unique(),
  verificationCode: text("verification_code").notNull(),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const trainees = pgTable("trainees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tagNumber: text("tag_number").notNull().unique(),
  dateOfBirth: text("date_of_birth").notNull(),
  gender: genderEnum("gender").notNull(),
  state: text("state").notNull(),
  lga: text("lga").notNull(),
  sponsorId: varchar("sponsor_id").references(() => sponsors.id),
  roomNumber: text("room_number"),
  roomBlock: text("room_block"),
  verificationMethod: verificationMethodEnum("verification_method").notNull(),
});

export const staff = pgTable("staff", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  department: text("department"),
  position: text("position"),
});

export const resourcePersons = pgTable("resource_persons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  specialization: text("specialization"),
  experience: text("experience"),
});

export const verificationCodes = pgTable("verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(), // email or phone
  code: text("code").notNull(),
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sponsors = pgTable("sponsors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTraineeSchema = createInsertSchema(trainees).omit({
  id: true,
  tagNumber: true,
  roomNumber: true,
  roomBlock: true,
});

export const insertStaffSchema = createInsertSchema(staff).omit({
  id: true,
});

export const insertResourcePersonSchema = createInsertSchema(resourcePersons).omit({
  id: true,
});

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).omit({
  id: true,
  createdAt: true,
});

export const insertSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Trainee = typeof trainees.$inferSelect;
export type InsertTrainee = z.infer<typeof insertTraineeSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type ResourcePerson = typeof resourcePersons.$inferSelect;
export type InsertResourcePerson = z.infer<typeof insertResourcePersonSchema>;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;

// Extended types for API responses
export type TraineeWithUser = Trainee & {
  user: User;
};

export type StaffWithUser = Staff & {
  user: User;
};

export type ResourcePersonWithUser = ResourcePerson & {
  user: User;
};

export type Sponsor = typeof sponsors.$inferSelect;
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;

// Extended types for API responses with sponsors
export type TraineeWithUserAndSponsor = Trainee & {
  user: User;
  sponsor?: Sponsor | null;
};
