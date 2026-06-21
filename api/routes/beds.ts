import { Router } from 'express';
import { beds } from '../db.js';
import type { BedStatus } from '../types.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    let result = [...beds];
    const { ward, status } = req.query;
    if (ward) result = result.filter((b) => b.ward === ward);
    if (status) result = result.filter((b) => b.status === (status as BedStatus));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/qr/:qrCode', (req, res) => {
  try {
    const bed = beds.find((b) => b.qrCode === req.params.qrCode);
    if (!bed) {
      res.status(404).json({ error: 'Bed not found' });
      return;
    }
    res.json(bed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id', (req, res) => {
  try {
    const bed = beds.find((b) => b.id === req.params.id);
    if (!bed) {
      res.status(404).json({ error: 'Bed not found' });
      return;
    }
    res.json(bed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body as { status: BedStatus };
    const bed = beds.find((b) => b.id === req.params.id);
    if (!bed) {
      res.status(404).json({ error: 'Bed not found' });
      return;
    }
    bed.status = status;
    res.json(bed);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
