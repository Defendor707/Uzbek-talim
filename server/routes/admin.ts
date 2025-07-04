
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { dbOptimizer } from '../utils/dbOptimizer';
import { dbMonitor } from '../middleware/dbMonitor';
import { cacheManager } from '../middleware/cache';

const router = Router();

// Database health endpoint
router.get('/db/health', requireAuth, requireRole(['center']), async (req, res) => {
  try {
    const healthReport = await dbMonitor.getHealthReport();
    const dbStats = await dbOptimizer.getDatabaseStats();
    const cacheStats = cacheManager.getStats();
    
    res.json({
      database: healthReport,
      cache: cacheStats,
      statistics: dbStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Health check failed', error: error.message });
  }
});

// Database optimization endpoint
router.post('/db/optimize', requireAuth, requireRole(['center']), async (req, res) => {
  try {
    await dbOptimizer.performMaintenance();
    res.json({ message: 'Database optimization completed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Optimization failed', error: error.message });
  }
});

// Cache management
router.delete('/cache/clear', requireAuth, requireRole(['center']), (req, res) => {
  try {
    cacheManager.clear();
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Cache clear failed', error: error.message });
  }
});

export default router;
