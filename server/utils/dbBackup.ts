
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export class DatabaseBackup {
  private static instance: DatabaseBackup;
  private backupDir = path.join(process.cwd(), 'backups');

  public static getInstance(): DatabaseBackup {
    if (!DatabaseBackup.instance) {
      DatabaseBackup.instance = new DatabaseBackup();
    }
    return DatabaseBackup.instance;
  }

  async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  async createBackup(): Promise<string> {
    await this.ensureBackupDirectory();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `backup-${timestamp}.sql`);
    
    try {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not found');
      }

      // Create compressed backup
      const command = `pg_dump "${databaseUrl}" | gzip > "${backupFile}.gz"`;
      await execAsync(command);

      console.log(`Database backup created: ${backupFile}.gz`);
      return `${backupFile}.gz`;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      return files.filter(file => file.endsWith('.sql.gz')).sort().reverse();
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async cleanOldBackups(keepCount: number = 7): Promise<void> {
    try {
      const backups = await this.listBackups();
      const toDelete = backups.slice(keepCount);

      for (const backup of toDelete) {
        await fs.unlink(path.join(this.backupDir, backup));
        console.log(`Deleted old backup: ${backup}`);
      }
    } catch (error) {
      console.error('Failed to clean old backups:', error);
    }
  }

  async scheduleBackups(): Promise<void> {
    // Create backup every 6 hours
    setInterval(async () => {
      try {
        await this.createBackup();
        await this.cleanOldBackups();
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    console.log('Database backup scheduler started');
  }
}

export const dbBackup = DatabaseBackup.getInstance();
