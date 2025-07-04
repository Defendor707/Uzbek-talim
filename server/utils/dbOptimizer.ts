
import { db } from '../db';
import { sql } from 'drizzle-orm';

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  
  public static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  /**
   * Analyze query performance
   */
  async analyzeQuery(query: string): Promise<any> {
    try {
      const result = await db.execute(sql`EXPLAIN ANALYZE ${sql.raw(query)}`);
      return result;
    } catch (error) {
      console.error('Query analysis failed:', error);
      return null;
    }
  }

  /**
   * Vacuum and analyze tables for optimal performance
   */
  async optimizeTables(): Promise<void> {
    try {
      // Vacuum analyze critical tables
      const criticalTables = [
        'users', 'tests', 'test_attempts', 'questions', 
        'student_answers', 'lessons', 'notifications'
      ];

      for (const table of criticalTables) {
        await db.execute(sql`VACUUM ANALYZE ${sql.identifier(table)}`);
      }

      console.log('Database tables optimized successfully');
    } catch (error) {
      console.error('Table optimization failed:', error);
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    try {
      const stats = await db.execute(sql`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `);
      
      return stats;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return [];
    }
  }

  /**
   * Monitor slow queries
   */
  async getSlowQueries(): Promise<any> {
    try {
      const slowQueries = await db.execute(sql`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > 1000
        ORDER BY mean_time DESC
        LIMIT 10
      `);
      
      return slowQueries;
    } catch (error) {
      console.error('Failed to get slow queries:', error);
      return [];
    }
  }

  /**
   * Connection pool monitoring
   */
  async getConnectionStats(): Promise<any> {
    try {
      const connections = await db.execute(sql`
        SELECT 
          state,
          COUNT(*) as connection_count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `);
      
      return connections;
    } catch (error) {
      console.error('Failed to get connection stats:', error);
      return [];
    }
  }

  /**
   * Create missing indexes automatically
   */
  async createOptimalIndexes(): Promise<void> {
    try {
      const indexQueries = [
        // Composite indexes for common query patterns
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_test_attempts_student_test 
         ON test_attempts(student_id, test_id, start_time DESC)`,
        
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_answers_attempt_question 
         ON student_answers(attempt_id, question_id) 
         INCLUDE (is_correct, points_earned)`,
        
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
         ON notifications(user_id, is_read, created_at DESC) 
         WHERE is_read = false`,
        
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_teacher_subject 
         ON lessons(teacher_id, subject_id, status) 
         INCLUDE (title, created_at)`,

        // Partial indexes for active records
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_telegram 
         ON users(telegram_id) 
         WHERE is_active = true AND telegram_id IS NOT NULL`,
        
        // Full-text search indexes
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tests_title_search 
         ON tests USING gin(to_tsvector('english', title))`,
         
        `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lessons_title_search 
         ON lessons USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')))`
      ];

      for (const query of indexQueries) {
        try {
          await db.execute(sql.raw(query));
          console.log('Created index successfully');
        } catch (error) {
          // Index might already exist, continue
          console.warn('Index creation skipped:', error.message);
        }
      }

    } catch (error) {
      console.error('Failed to create optimal indexes:', error);
    }
  }

  /**
   * Database maintenance routine
   */
  async performMaintenance(): Promise<void> {
    try {
      console.log('Starting database maintenance...');
      
      // Update table statistics
      await db.execute(sql`ANALYZE`);
      
      // Reindex if needed
      await db.execute(sql`REINDEX SYSTEM`);
      
      // Clean up old data (older than 6 months)
      await this.cleanupOldData();
      
      console.log('Database maintenance completed');
    } catch (error) {
      console.error('Database maintenance failed:', error);
    }
  }

  /**
   * Clean up old data
   */
  private async cleanupOldData(): Promise<void> {
    try {
      // Remove old notifications (older than 3 months)
      await db.execute(sql`
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '3 months' 
        AND is_read = true
      `);

      // Remove old test attempts (older than 1 year) for completed tests
      await db.execute(sql`
        DELETE FROM test_attempts 
        WHERE start_time < NOW() - INTERVAL '1 year' 
        AND status = 'completed'
      `);

      console.log('Old data cleanup completed');
    } catch (error) {
      console.error('Data cleanup failed:', error);
    }
  }
}

export const dbOptimizer = DatabaseOptimizer.getInstance();
