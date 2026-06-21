import { Router } from 'express';
import { records, generateRecordId } from '../db.js';
import { formatDateTime } from '../utils/dateUtils.js';
import type { RecordType, ExceptionRecordData } from '../types.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    let result = [...records];
    const { type, orderId } = req.query;
    if (type) result = result.filter((r) => r.type === (type as RecordType));
    if (orderId) result = result.filter((r) => r.orderId === String(orderId));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id', (req, res) => {
  try {
    const record = records.find((r) => r.id === req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/', (req, res) => {
  try {
    const { orderId, bedNumber, type, operator, data } = req.body as {
      orderId: string;
      bedNumber: string;
      type: RecordType;
      operator: string;
      data: ExceptionRecordData;
    };
    const now = new Date();
    const record = {
      id: generateRecordId(),
      orderId,
      bedNumber,
      type,
      createdAt: formatDateTime(now),
      operator,
      data,
    };
    records.push(record);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const record = records.find((r) => r.id === req.params.id);
    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    Object.assign(record, req.body);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
