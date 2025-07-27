import { 
  users, 
  trainees, 
  staff, 
  resourcePersons, 
  verificationCodes,
  sponsors,
  type User, 
  type InsertUser,
  type Trainee,
  type InsertTrainee,
  type TraineeWithUser,
  type TraineeWithUserAndSponsor,
  type Staff,
  type InsertStaff,
  type StaffWithUser,
  type ResourcePerson,
  type InsertResourcePerson,
  type ResourcePersonWithUser,
  type VerificationCode,
  type InsertVerificationCode,
  type Sponsor,
  type InsertSponsor
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByEmailOrPhone(identifier: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Trainee methods
  getTrainee(id: string): Promise<TraineeWithUserAndSponsor | undefined>;
  getAllTrainees(): Promise<TraineeWithUserAndSponsor[]>;
  createTrainee(trainee: InsertTrainee): Promise<Trainee>;
  updateTrainee(id: string, updates: Partial<Trainee>): Promise<Trainee | undefined>;
  deleteTrainee(id: string): Promise<boolean>;
  getNextTagNumber(): Promise<string>;
  getAvailableRoom(gender: 'male' | 'female'): Promise<{ block: string; room: string } | null>;
  
  // Staff methods
  getAllStaff(): Promise<StaffWithUser[]>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  
  // Resource Person methods
  getAllResourcePersons(): Promise<ResourcePersonWithUser[]>;
  createResourcePerson(resourcePerson: InsertResourcePerson): Promise<ResourcePerson>;
  
  // Verification methods
  createVerificationCode(verificationCode: InsertVerificationCode): Promise<VerificationCode>;
  getVerificationCode(identifier: string, code: string): Promise<VerificationCode | undefined>;
  markVerificationCodeAsUsed(id: string): Promise<void>;
  cleanupExpiredCodes(): Promise<void>;

  // Sponsor methods
  getAllSponsors(): Promise<Sponsor[]>;
  createSponsor(sponsor: InsertSponsor): Promise<Sponsor>;
  updateSponsor(id: string, updates: Partial<Sponsor>): Promise<Sponsor | undefined>;
  deleteSponsor(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user || undefined;
  }

  async getUserByEmailOrPhone(identifier: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(or(eq(users.email, identifier), eq(users.phone, identifier)));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async getTrainee(id: string): Promise<TraineeWithUserAndSponsor | undefined> {
    const [result] = await db.select()
      .from(trainees)
      .innerJoin(users, eq(trainees.userId, users.id))
      .leftJoin(sponsors, eq(trainees.sponsorId, sponsors.id))
      .where(eq(trainees.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.trainees,
      user: result.users,
      sponsor: result.sponsors || null
    };
  }

  async getAllTrainees(): Promise<TraineeWithUserAndSponsor[]> {
    const results = await db.select()
      .from(trainees)
      .innerJoin(users, eq(trainees.userId, users.id))
      .leftJoin(sponsors, eq(trainees.sponsorId, sponsors.id))
      .orderBy(trainees.tagNumber);
    
    return results.map(result => ({
      ...result.trainees,
      user: result.users,
      sponsor: result.sponsors || null
    }));
  }

  async createTrainee(trainee: InsertTrainee & { tagNumber: string; roomBlock?: string; roomNumber?: string }): Promise<Trainee> {
    const [newTrainee] = await db.insert(trainees).values(trainee).returning();
    return newTrainee;
  }

  async updateTrainee(id: string, updates: Partial<Trainee>): Promise<Trainee | undefined> {
    const [updatedTrainee] = await db.update(trainees)
      .set(updates)
      .where(eq(trainees.id, id))
      .returning();
    return updatedTrainee || undefined;
  }

  async deleteTrainee(id: string): Promise<boolean> {
    const result = await db.delete(trainees).where(eq(trainees.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getNextTagNumber(): Promise<string> {
    const [lastTrainee] = await db.select({ tagNumber: trainees.tagNumber })
      .from(trainees)
      .orderBy(desc(trainees.tagNumber))
      .limit(1);
    
    if (!lastTrainee) {
      return "001";
    }
    
    const lastNumber = parseInt(lastTrainee.tagNumber);
    const nextNumber = lastNumber + 1;
    return nextNumber.toString().padStart(3, '0');
  }

  async getAvailableRoom(gender: 'male' | 'female'): Promise<{ block: string; room: string } | null> {
    // Get all occupied rooms for the gender
    const occupiedRooms = await db.select({ roomNumber: trainees.roomNumber, roomBlock: trainees.roomBlock })
      .from(trainees)
      .where(and(
        eq(trainees.gender, gender),
        eq(trainees.roomNumber, trainees.roomNumber) // Not null
      ));
    
    // Count occupancy per room
    const roomOccupancy: Record<string, number> = {};
    occupiedRooms.forEach(room => {
      if (room.roomNumber && room.roomBlock) {
        const key = `${room.roomBlock}-${room.roomNumber}`;
        roomOccupancy[key] = (roomOccupancy[key] || 0) + 1;
      }
    });
    
    // Define room ranges based on gender
    const blocks = gender === 'male' ? ['A', 'B'] : ['C', 'D'];
    const roomRanges = {
      'A': { start: 100, end: 199 },
      'B': { start: 200, end: 299 },
      'C': { start: 300, end: 399 },
      'D': { start: 400, end: 499 }
    };
    
    // Find available room
    for (const block of blocks) {
      const range = roomRanges[block as keyof typeof roomRanges];
      for (let roomNum = range.start; roomNum <= range.end; roomNum += 2) { // Even numbers only
        const roomKey = `${block}-${roomNum}`;
        const occupancy = roomOccupancy[roomKey] || 0;
        
        if (occupancy < 2) { // Room can accommodate 2 people
          return { block: `Block ${block}`, room: roomNum.toString() };
        }
      }
    }
    
    return null; // No available rooms
  }

  async getAllStaff(): Promise<StaffWithUser[]> {
    const results = await db.select()
      .from(staff)
      .innerJoin(users, eq(staff.userId, users.id));
    
    return results.map(result => ({
      ...result.staff,
      user: result.users
    }));
  }

  async createStaff(staffMember: InsertStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(staffMember).returning();
    return newStaff;
  }

  async getAllResourcePersons(): Promise<ResourcePersonWithUser[]> {
    const results = await db.select()
      .from(resourcePersons)
      .innerJoin(users, eq(resourcePersons.userId, users.id));
    
    return results.map(result => ({
      ...result.resource_persons,
      user: result.users
    }));
  }

  async createResourcePerson(resourcePerson: InsertResourcePerson): Promise<ResourcePerson> {
    const [newResourcePerson] = await db.insert(resourcePersons).values(resourcePerson).returning();
    return newResourcePerson;
  }

  async createVerificationCode(verificationCode: InsertVerificationCode): Promise<VerificationCode> {
    const [newCode] = await db.insert(verificationCodes).values(verificationCode).returning();
    return newCode;
  }

  async getVerificationCode(identifier: string, code: string): Promise<VerificationCode | undefined> {
    const [verificationCode] = await db.select()
      .from(verificationCodes)
      .where(and(
        eq(verificationCodes.identifier, identifier),
        eq(verificationCodes.code, code),
        eq(verificationCodes.isUsed, false)
      ));
    
    return verificationCode || undefined;
  }

  async markVerificationCodeAsUsed(id: string): Promise<void> {
    await db.update(verificationCodes)
      .set({ isUsed: true })
      .where(eq(verificationCodes.id, id));
  }

  async cleanupExpiredCodes(): Promise<void> {
    await db.delete(verificationCodes)
      .where(eq(verificationCodes.expiresAt, new Date()));
  }

  async getAllSponsors(): Promise<Sponsor[]> {
    return await db.select().from(sponsors).where(eq(sponsors.isActive, true)).orderBy(sponsors.name);
  }

  async createSponsor(sponsor: InsertSponsor): Promise<Sponsor> {
    const [newSponsor] = await db.insert(sponsors).values(sponsor).returning();
    return newSponsor;
  }

  async updateSponsor(id: string, updates: Partial<Sponsor>): Promise<Sponsor | undefined> {
    const [updatedSponsor] = await db.update(sponsors)
      .set(updates)
      .where(eq(sponsors.id, id))
      .returning();
    return updatedSponsor || undefined;
  }

  async deleteSponsor(id: string): Promise<boolean> {
    const result = await db.update(sponsors)
      .set({ isActive: false })
      .where(eq(sponsors.id, id));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
