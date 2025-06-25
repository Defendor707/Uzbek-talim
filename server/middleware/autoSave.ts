import { Request, Response, NextFunction } from 'express';

interface AutoSaveEntry {
  data: any;
  timestamp: number;
  userId: number;
  attemptId: number;
}

class AutoSaveManager {
  private saveQueue: Map<string, AutoSaveEntry> = new Map();
  private processingInterval: NodeJS.Timeout;
  private readonly SAVE_INTERVAL = 5000; // 5 seconds
  private readonly MAX_QUEUE_SIZE = 1000;

  constructor() {
    // Process auto-save queue every 5 seconds
    this.processingInterval = setInterval(() => {
      this.processBatch();
    }, this.SAVE_INTERVAL);
  }

  private async processBatch(): Promise<void> {
    if (this.saveQueue.size === 0) return;

    const entries = Array.from(this.saveQueue.entries());
    this.saveQueue.clear();

    for (const [key, entry] of entries) {
      try {
        await this.saveToDatabase(entry);
      } catch (error) {
        console.error(`Auto-save failed for ${key}:`, error);
        // Re-queue failed saves (with max attempts limit)
        if (!key.includes('_retry_')) {
          this.saveQueue.set(`${key}_retry_${Date.now()}`, entry);
        }
      }
    }
  }

  private async saveToDatabase(entry: AutoSaveEntry): Promise<void> {
    // This would be replaced with actual database save logic
    // For now, just log the save operation
    console.log(`Auto-saving for user ${entry.userId}, attempt ${entry.attemptId}`);
    
    // Example: Save test progress
    // await storage.updateTestAttempt(entry.attemptId, {
    //   lastSaveTime: new Date(),
    //   currentAnswers: entry.data.answers
    // });
  }

  addToQueue(userId: number, attemptId: number, data: any): void {
    if (this.saveQueue.size >= this.MAX_QUEUE_SIZE) {
      console.warn('Auto-save queue is full, dropping oldest entry');
      const oldestKey = this.saveQueue.keys().next().value;
      if (oldestKey) {
        this.saveQueue.delete(oldestKey);
      }
    }

    const key = `${userId}_${attemptId}_${Date.now()}`;
    this.saveQueue.set(key, {
      data,
      timestamp: Date.now(),
      userId,
      attemptId
    });
  }

  getQueueSize(): number {
    return this.saveQueue.size;
  }

  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

// Global auto-save manager
const autoSaveManager = new AutoSaveManager();

// Middleware for auto-save functionality
export function autoSaveMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Add auto-save method to request object
  (req as any).autoSave = (attemptId: number, data: any) => {
    if (req.user?.userId) {
      autoSaveManager.addToQueue(req.user.userId, attemptId, data);
    }
  };

  next();
}

// WebSocket optimization for real-time updates
export class WebSocketOptimizer {
  private connections: Map<string, any> = new Map();
  private updateQueue: Map<string, any[]> = new Map();
  private batchInterval: NodeJS.Timeout;

  constructor() {
    // Batch WebSocket updates every 1 second
    this.batchInterval = setInterval(() => {
      this.processBatchUpdates();
    }, 1000);
  }

  addConnection(userId: string, socket: any): void {
    this.connections.set(userId, socket);
    this.updateQueue.set(userId, []);
  }

  removeConnection(userId: string): void {
    this.connections.delete(userId);
    this.updateQueue.delete(userId);
  }

  queueUpdate(userId: string, update: any): void {
    const queue = this.updateQueue.get(userId);
    if (queue) {
      queue.push(update);
      
      // Limit queue size to prevent memory issues
      if (queue.length > 50) {
        queue.shift(); // Remove oldest update
      }
    }
  }

  private processBatchUpdates(): void {
    const entries = Array.from(this.updateQueue.entries());
    for (const [userId, updates] of entries) {
      if (updates.length === 0) continue;

      const socket = this.connections.get(userId);
      if (socket && socket.readyState === 1) { // WebSocket.OPEN
        try {
          // Send batched updates
          socket.send(JSON.stringify({
            type: 'batch_update',
            updates: updates.splice(0) // Clear queue after reading
          }));
        } catch (error) {
          console.error(`WebSocket send error for user ${userId}:`, error);
          this.removeConnection(userId);
        }
      }
    }
  }

  broadcastToRole(role: string, message: any): void {
    // This would require storing user roles with connections
    // Implementation depends on your WebSocket setup
    console.log(`Broadcasting to ${role}:`, message);
  }

  destroy(): void {
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
    }
    this.connections.clear();
    this.updateQueue.clear();
  }
}

export const wsOptimizer = new WebSocketOptimizer();
export { autoSaveManager };
export default autoSaveMiddleware;