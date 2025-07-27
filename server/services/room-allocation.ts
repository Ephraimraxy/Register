import { storage } from "../storage";

export class RoomAllocationService {
  static async allocateRoom(gender: 'male' | 'female'): Promise<{ block: string; room: string } | null> {
    return await storage.getAvailableRoom(gender);
  }

  static async generateTagNumber(): Promise<string> {
    return await storage.getNextTagNumber();
  }

  static formatRoomAssignment(block: string, room: string): string {
    return `${block} Room ${room}`;
  }
}
