import { Router } from 'express';
import { beds, orders, records, generateOrderId, generateRecordId } from '../db.js';
import { formatDateTime } from '../utils/dateUtils.js';
import { calculateFee } from '../feeCalculator.js';
import type { OrderStatus, CleanStatus, DamageLevel, CloseReason, FeeDetail } from '../types.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    let result = [...orders];
    const { status, bedNumber, userPhone, ward } = req.query;
    if (status) result = result.filter((o) => o.status === (status as OrderStatus));
    if (bedNumber) result = result.filter((o) => o.bedNumber === String(bedNumber));
    if (userPhone) result = result.filter((o) => o.userPhone === String(userPhone));
    if (ward) result = result.filter((o) => o.ward === String(ward));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.get('/:id', (req, res) => {
  try {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/', (req, res) => {
  try {
    const { bedId, userPhone } = req.body as { bedId: string; userPhone: string };
    const bed = beds.find((b) => b.id === bedId);
    if (!bed) {
      res.status(404).json({ error: 'Bed not found' });
      return;
    }
    if (bed.status !== 'available') {
      res.status(400).json({ error: 'Bed is not available' });
      return;
    }
    bed.status = 'occupied';
    const now = new Date();
    const order = {
      id: generateOrderId(),
      bedId,
      bedNumber: bed.bedNumber,
      ward: bed.ward,
      userPhone,
      status: 'active' as OrderStatus,
      startTime: formatDateTime(now),
      depositAmount: bed.depositAmount,
      createdAt: formatDateTime(now),
      updatedAt: formatDateTime(now),
    };
    orders.push(order as any);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch('/:id/complete', (req, res) => {
  try {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.status !== 'active') {
      res.status(400).json({ error: 'Order is not active' });
      return;
    }

    const body = req.body as {
      endTime?: string;
      cleanStatus?: CleanStatus;
      returnWard?: string;
      damageLevel?: DamageLevel;
      damageDescription?: string;
      damageDeduction?: number;
    };

    const endTime = body.endTime ? new Date(body.endTime) : new Date();
    const cleanStatus = body.cleanStatus ?? 'need_clean';
    const returnWard = body.returnWard ?? order.ward;
    const damageLevel = body.damageLevel;

    const cleaningFeeMap: Record<CleanStatus, number> = {
      clean: 0,
      need_clean: 10,
      heavily_soiled: 30,
    };
    const cleaningFee = cleaningFeeMap[cleanStatus];
    const damageDeduction = body.damageDeduction ?? (damageLevel === 'minor' ? 50 : damageLevel === 'moderate' ? 150 : damageLevel === 'severe' ? 400 : 0);

    const feeResult: FeeDetail = calculateFee(new Date(order.startTime), endTime, {
      cleaningFee,
      damageDeduction,
    });

    order.status = 'completed';
    order.endTime = formatDateTime(endTime);
    order.durationMinutes = Math.round((endTime.getTime() - new Date(order.startTime).getTime()) / 60000);
    order.cleanStatus = cleanStatus;
    order.returnWard = returnWard;
    order.feeDetail = feeResult;
    order.actualPayment = feeResult.totalAmount;
    order.nightCapped = feeResult.nightCapDiscount > 0;
    order.dailyCapped = feeResult.dailyCapDiscount > 0;
    order.updatedAt = formatDateTime(endTime);

    const refundAmount = Number(Math.max(0, order.depositAmount - feeResult.totalAmount).toFixed(2));
    order.depositRefund = refundAmount;

    if (feeResult.nightCapDiscount > 0) {
      records.push({
        id: generateRecordId(),
        orderId: order.id,
        bedNumber: order.bedNumber,
        type: 'night_cap',
        createdAt: formatDateTime(endTime),
        operator: '系统',
        data: {
          type: 'night_cap',
          nightStart: order.startTime,
          nightEnd: formatDateTime(endTime),
          originalHours: order.durationMinutes / 60,
          cappedHours: order.durationMinutes / 60,
          savedAmount: feeResult.nightCapDiscount,
        },
      });
    }

    records.push({
      id: generateRecordId(),
      orderId: order.id,
      bedNumber: order.bedNumber,
      type: 'deposit_refund',
      createdAt: formatDateTime(endTime),
      operator: '系统',
      data: {
        type: 'deposit_refund',
        refundAmount,
        refundMethod: '原路退回',
        refundTime: formatDateTime(endTime),
        remark: damageLevel ? `扣除损坏赔偿${damageDeduction}元后退还剩余押金` : '正常归还，费用结算完成',
      },
    });

    if (damageLevel) {
      records.push({
        id: generateRecordId(),
        orderId: order.id,
        bedNumber: order.bedNumber,
        type: 'bed_damage',
        createdAt: formatDateTime(endTime),
        operator: '系统',
        data: {
          type: 'bed_damage',
          damageLevel,
          damageDescription: body.damageDescription ?? `床位${damageLevel === 'minor' ? '轻微' : damageLevel === 'moderate' ? '中度' : '严重'}损坏`,
          deductionAmount: damageDeduction,
        },
      });
    }

    const bed = beds.find((b) => b.id === order.bedId);
    if (bed) {
      bed.status = damageLevel ? 'damaged' : 'available';
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch('/:id/manual-close', (req, res) => {
  try {
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.status !== 'active') {
      res.status(400).json({ error: 'Order is not active' });
      return;
    }

    const body = req.body as {
      closeReason: CloseReason;
      operator: string;
      feeAdjustment?: number;
      adjustedAmount?: number;
      closeRemark?: string;
    };

    const closeReason = body.closeReason;
    const operator = body.operator ?? '管理员';
    const feeAdjustment = body.feeAdjustment ?? 0;

    const endTime = new Date();
    const feeResult = calculateFee(new Date(order.startTime), endTime, {
      damageDeduction: feeAdjustment,
    });

    const adjustedAmount = body.adjustedAmount ?? feeResult.totalAmount;

    order.status = 'manual_closed';
    order.endTime = formatDateTime(endTime);
    order.durationMinutes = Math.round((endTime.getTime() - new Date(order.startTime).getTime()) / 60000);
    order.feeDetail = feeResult;
    order.actualPayment = adjustedAmount;
    order.updatedAt = formatDateTime(endTime);

    const refundAmount = Number(Math.max(0, order.depositAmount - adjustedAmount).toFixed(2));
    order.depositRefund = refundAmount;

    const bed = beds.find((b) => b.id === order.bedId);
    if (bed) {
      bed.status = 'available';
    }

    records.push({
      id: generateRecordId(),
      orderId: order.id,
      bedNumber: order.bedNumber,
      type: 'manual_close',
      createdAt: formatDateTime(endTime),
      operator,
      data: {
        type: 'manual_close',
        closeReason,
        closeRemark: body.closeRemark,
        closeTime: formatDateTime(endTime),
        feeAdjustment,
        adjustedAmount,
      },
    });

    if (refundAmount > 0) {
      records.push({
        id: generateRecordId(),
        orderId: order.id,
        bedNumber: order.bedNumber,
        type: 'deposit_refund',
        createdAt: formatDateTime(endTime),
        operator,
        data: {
          type: 'deposit_refund',
          refundAmount,
          refundMethod: '原路退回',
          refundTime: formatDateTime(endTime),
          remark: '人工关闭订单退款',
        },
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body as { status: OrderStatus };
    const order = orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    order.status = status;
    order.updatedAt = formatDateTime(new Date());
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
