import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { VerificationService } from "./services/verification";
import { RoomAllocationService } from "./services/room-allocation";
import { z } from "zod";
import { insertUserSchema, insertTraineeSchema, insertSponsorSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Trainee registration endpoint
  app.post("/api/trainees/register", async (req, res) => {
    try {
      const registrationData = z.object({
        firstName: z.string().min(1),
        surname: z.string().min(1),
        middleName: z.string().optional(),
        dateOfBirth: z.string(),
        gender: z.enum(['male', 'female']),
        state: z.string().min(1),
        lga: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        verificationMethod: z.enum(['email', 'phone']),
        verificationCode: z.string().length(6),
        sponsorId: z.string().optional()
      }).parse(req.body);

      // Verify the code first
      const identifier = registrationData.verificationMethod === 'email' 
        ? registrationData.email 
        : registrationData.phone;
      
      const verification = await VerificationService.verifyCode(identifier, registrationData.verificationCode);
      
      if (!verification.success) {
        return res.status(400).json({ 
          message: verification.message,
          isExpired: verification.isExpired 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmailOrPhone(registrationData.email) ||
                          await storage.getUserByEmailOrPhone(registrationData.phone);
      
      if (existingUser) {
        return res.status(400).json({ 
          message: "User with this email or phone number already exists" 
        });
      }

      // Generate tag number and allocate room
      const tagNumber = await RoomAllocationService.generateTagNumber();
      const roomAllocation = await RoomAllocationService.allocateRoom(registrationData.gender);

      if (!roomAllocation) {
        return res.status(400).json({ 
          message: "No available rooms for your gender category" 
        });
      }

      // Create user
      const userData = insertUserSchema.parse({
        role: 'trainee',
        firstName: registrationData.firstName,
        surname: registrationData.surname,
        middleName: registrationData.middleName,
        email: registrationData.email,
        phone: registrationData.phone,
        verificationCode: registrationData.verificationCode,
        isVerified: true
      });

      const user = await storage.createUser(userData);

      // Create trainee
      const traineeData = insertTraineeSchema.parse({
        userId: user.id,
        dateOfBirth: registrationData.dateOfBirth,
        gender: registrationData.gender,
        state: registrationData.state,
        lga: registrationData.lga,
        sponsorId: registrationData.sponsorId || null,
        verificationMethod: registrationData.verificationMethod
      });

      const trainee = await storage.createTrainee({
        ...traineeData,
        tagNumber,
        roomBlock: roomAllocation.block,
        roomNumber: roomAllocation.room
      });

      res.json({
        message: "Registration successful",
        trainee: {
          ...trainee,
          user: {
            firstName: user.firstName,
            surname: user.surname,
            email: user.email,
            phone: user.phone
          }
        }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Send verification code endpoint
  app.post("/api/verification/send", async (req, res) => {
    try {
      const { identifier, method } = z.object({
        identifier: z.string().min(1),
        method: z.enum(['email', 'phone'])
      }).parse(req.body);

      const result = await VerificationService.sendVerificationCode(identifier, method);
      
      res.json({
        success: result.success,
        message: result.message,
        // In production, don't include the code
        ...(process.env.NODE_ENV === 'development' && { code: result.code })
      });
    } catch (error) {
      console.error("Send verification error:", error);
      res.status(500).json({ message: "Failed to send verification code" });
    }
  });

  // Verify code endpoint
  app.post("/api/verification/verify", async (req, res) => {
    try {
      const { identifier, code } = z.object({
        identifier: z.string().min(1),
        code: z.string().length(6)
      }).parse(req.body);

      const result = await VerificationService.verifyCode(identifier, code);
      
      res.json(result);
    } catch (error) {
      console.error("Verification error:", error);
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // Get all trainees endpoint
  app.get("/api/trainees", async (req, res) => {
    try {
      const trainees = await storage.getAllTrainees();
      res.json(trainees);
    } catch (error) {
      console.error("Get trainees error:", error);
      res.status(500).json({ message: "Failed to fetch trainees" });
    }
  });

  // Update trainee endpoint
  app.patch("/api/trainees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedTrainee = await storage.updateTrainee(id, updates);
      
      if (!updatedTrainee) {
        return res.status(404).json({ message: "Trainee not found" });
      }
      
      res.json(updatedTrainee);
    } catch (error) {
      console.error("Update trainee error:", error);
      res.status(500).json({ message: "Failed to update trainee" });
    }
  });

  // Delete trainee endpoint
  app.delete("/api/trainees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteTrainee(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Trainee not found" });
      }
      
      res.json({ message: "Trainee deleted successfully" });
    } catch (error) {
      console.error("Delete trainee error:", error);
      res.status(500).json({ message: "Failed to delete trainee" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { identifier, password } = z.object({
        identifier: z.string().min(1),
        password: z.string().min(1)
      }).parse(req.body);

      const user = await storage.getUserByEmailOrPhone(identifier);
      
      if (!user || user.verificationCode !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isVerified) {
        return res.status(401).json({ message: "Account not verified" });
      }

      // In a real app, you would generate a JWT token here
      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          role: user.role,
          firstName: user.firstName,
          surname: user.surname,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Staff endpoints (coming soon - basic structure)
  app.get("/api/staff", async (req, res) => {
    try {
      const staff = await storage.getAllStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch staff" });
    }
  });

  // Resource persons endpoints (coming soon - basic structure)
  app.get("/api/resource-persons", async (req, res) => {
    try {
      const resourcePersons = await storage.getAllResourcePersons();
      res.json(resourcePersons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resource persons" });
    }
  });

  // Sponsors endpoints
  app.get("/api/sponsors", async (req, res) => {
    try {
      const sponsors = await storage.getAllSponsors();
      res.json(sponsors);
    } catch (error) {
      console.error("Get sponsors error:", error);
      res.status(500).json({ message: "Failed to fetch sponsors" });
    }
  });

  app.post("/api/sponsors", async (req, res) => {
    try {
      const sponsorData = insertSponsorSchema.parse(req.body);
      const sponsor = await storage.createSponsor(sponsorData);
      res.json(sponsor);
    } catch (error) {
      console.error("Create sponsor error:", error);
      res.status(500).json({ message: "Failed to create sponsor" });
    }
  });

  app.patch("/api/sponsors/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedSponsor = await storage.updateSponsor(id, updates);
      
      if (!updatedSponsor) {
        return res.status(404).json({ message: "Sponsor not found" });
      }
      
      res.json(updatedSponsor);
    } catch (error) {
      console.error("Update sponsor error:", error);
      res.status(500).json({ message: "Failed to update sponsor" });
    }
  });

  app.delete("/api/sponsors/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      const deleted = await storage.deleteSponsor(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Sponsor not found" });
      }
      
      res.json({ message: "Sponsor deleted successfully" });
    } catch (error) {
      console.error("Delete sponsor error:", error);
      res.status(500).json({ message: "Failed to delete sponsor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
