import { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "../storage";
import { verifyToken } from "../utils/auth";

export interface SyncMessage {
  type: 'user_updated' | 'profile_updated' | 'test_created' | 'test_updated' | 'lesson_created' | 'lesson_updated' | 'schedule_updated';
  userId: number;
  data: any;
  timestamp: number;
}

class SyncService {
  private wss: WebSocketServer | null = null;
  private connections = new Map<WebSocket, { userId: number; role: string }>();

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws-sync' });
    
    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'Token required');
        return;
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        ws.close(1008, 'Invalid token');
        return;
      }

      this.connections.set(ws, { userId: decoded.userId, role: decoded.role });
      
      ws.on('close', () => {
        this.connections.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.connections.delete(ws);
      });

      // Send initial sync confirmation
      ws.send(JSON.stringify({
        type: 'connected',
        userId: decoded.userId,
        timestamp: Date.now()
      }));
    });
  }

  // Broadcast sync message to relevant users
  broadcast(message: SyncMessage, targetUserIds?: number[]) {
    if (!this.wss) return;

    const messageString = JSON.stringify(message);
    
    this.connections.forEach((connectionInfo, ws) => {
      // Send to specific users or all connected users
      if (!targetUserIds || targetUserIds.includes(connectionInfo.userId)) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(messageString);
        }
      }
    });
  }

  // Notify about user profile updates
  notifyUserUpdate(userId: number, userData: any) {
    this.broadcast({
      type: 'user_updated',
      userId,
      data: userData,
      timestamp: Date.now()
    }, [userId]);
  }

  // Notify about profile updates (student, teacher, etc.)
  notifyProfileUpdate(userId: number, profileData: any, profileType: string) {
    this.broadcast({
      type: 'profile_updated',
      userId,
      data: { ...profileData, profileType },
      timestamp: Date.now()
    }, [userId]);
  }

  // Notify about new tests for students in specific grade/classroom
  async notifyTestCreated(testData: any) {
    // Get all students in the same grade/classroom
    const students = await storage.getUsersByRole('student');
    const relevantStudentIds = students
      .filter(user => {
        // Here you would filter based on grade/classroom if available in user data
        return true; // For now, notify all students
      })
      .map(user => user.id);

    this.broadcast({
      type: 'test_created',
      userId: testData.teacherId,
      data: testData,
      timestamp: Date.now()
    }, relevantStudentIds);
  }

  // Notify about lesson updates
  async notifyLessonCreated(lessonData: any) {
    // Get all students in the same grade
    const students = await storage.getUsersByRole('student');
    const relevantStudentIds = students.map(user => user.id);

    this.broadcast({
      type: 'lesson_created',
      userId: lessonData.teacherId,
      data: lessonData,
      timestamp: Date.now()
    }, relevantStudentIds);
  }

  // Notify about schedule updates
  async notifyScheduleUpdate(scheduleData: any) {
    // Notify students in the affected class
    const students = await storage.getUsersByRole('student');
    const relevantStudentIds = students.map(user => user.id);

    this.broadcast({
      type: 'schedule_updated',
      userId: scheduleData.teacherId,
      data: scheduleData,
      timestamp: Date.now()
    }, relevantStudentIds);
  }

  // Get connected users count
  getConnectedUsersCount(): number {
    return this.connections.size;
  }

  // Get connected users by role
  getConnectedUsersByRole(role: string): number[] {
    const userIds: number[] = [];
    this.connections.forEach((connectionInfo) => {
      if (connectionInfo.role === role) {
        userIds.push(connectionInfo.userId);
      }
    });
    return userIds;
  }
}

export const syncService = new SyncService();