import { Router } from 'express';
import { beds, orders, records, admin, resetDb } from '../db.js';
import { formatDateTime } from '../utils/dateUtils.js';

const router = Router();

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    const found = admin.find((a) => a.username === username && a.password === password);
    if (!found) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    const token = `token-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    res.json({
      success: true,
      name: found.name,
      role: found.role,
      token,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/stats', (req, res) => {
  try {
    const now = new Date();
    const todayStr = formatDateTime(now).split(' ')[0];

    const todayOrderCount = orders.filter((o) => o.createdAt.startsWith(todayStr)).length;
    const activeOrderCount = orders.filter((o) => o.status === 'active').length;

    const todayIncome = orders
      .filter((o) => (o.status === 'completed' || o.status === 'manual_closed') && o.endTime?.startsWith(todayStr))
      .reduce((sum, o) => sum + (o.actualPayment || 0), 0);

    const damagedBedCount = beds.filter((b) => b.status === 'damaged').length;
    const pendingRepairCount = records.filter((r) => r.type === 'bed_damage').length;
    const pendingCount = damagedBedCount + pendingRepairCount;

    res.json({
      todayOrderCount,
      activeOrderCount,
      todayIncome: Number(todayIncome.toFixed(2)),
      pendingCount,
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/reset', (req, res) => {
  try {
    resetDb();
    res.json({ success: true, message: 'Database reset successfully' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
