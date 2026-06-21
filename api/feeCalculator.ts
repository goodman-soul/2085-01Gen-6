import type { FeeDetail } from './types.js';

const HOURLY_RATE = 3;
const NIGHT_CAP = 30;
const DAILY_CAP = 60;
const NIGHT_START_HOUR = 22;
const NIGHT_END_HOUR = 6;

export const isNightHour = (hour: number): boolean => {
  return hour >= NIGHT_START_HOUR || hour < NIGHT_END_HOUR;
};

export const calculateNightHours = (start: Date, end: Date): number => {
  let totalNightMinutes = 0;
  const current = new Date(start);

  while (current < end) {
    const nextHour = new Date(current);
    nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

    const segmentEnd = nextHour < end ? nextHour : end;
    const segmentDuration = (segmentEnd.getTime() - current.getTime()) / (1000 * 60);

    if (isNightHour(current.getHours())) {
      totalNightMinutes += segmentDuration;
    }

    current.setTime(nextHour.getTime());
  }

  return totalNightMinutes / 60;
};

interface NightPeriod {
  start: Date;
  end: Date;
}

const getNightPeriodsInRange = (start: Date, end: Date): NightPeriod[] => {
  const periods: NightPeriod[] = [];
  const current = new Date(start);
  current.setMinutes(0, 0, 0);

  while (current < end) {
    if (current.getHours() === NIGHT_START_HOUR) {
      const nightStart = new Date(current);
      const nightEnd = new Date(current);
      nightEnd.setDate(nightEnd.getDate() + 1);
      nightEnd.setHours(NIGHT_END_HOUR, 0, 0, 0);

      const actualStart = nightStart > start ? nightStart : start;
      const actualEnd = nightEnd < end ? nightEnd : end;

      if (actualStart < actualEnd) {
        periods.push({ start: actualStart, end: actualEnd });
      }
    }

    current.setHours(current.getHours() + 1);
  }

  return periods;
};

interface DailyPeriod {
  start: Date;
  end: Date;
}

const getDailyPeriods = (start: Date, end: Date): DailyPeriod[] => {
  const periods: DailyPeriod[] = [];
  const periodStart = new Date(start);

  while (periodStart < end) {
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 1);

    const actualEnd = periodEnd < end ? periodEnd : end;
    periods.push({ start: periodStart, end: actualEnd });

    periodStart.setTime(periodEnd.getTime());
  }

  return periods;
};

interface CalculateFeeOptions {
  hourlyRate?: number;
  nightCap?: number;
  dailyCap?: number;
  damageDeduction?: number;
  cleaningFee?: number;
}

export const calculateFee = (
  startTime: Date | string,
  endTime: Date | string,
  options: CalculateFeeOptions = {}
): FeeDetail => {
  const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
  const end = typeof endTime === 'string' ? new Date(endTime) : endTime;

  const hourlyRate = options.hourlyRate ?? HOURLY_RATE;
  const nightCap = options.nightCap ?? NIGHT_CAP;
  const dailyCap = options.dailyCap ?? DAILY_CAP;
  const damageDeduction = options.damageDeduction ?? 0;
  const cleaningFee = options.cleaningFee ?? 0;

  const totalMinutes = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
  const totalHours = totalMinutes / 60;
  const baseFee = Number((totalHours * hourlyRate).toFixed(2));

  let nightCapDiscount = 0;
  const nightPeriods = getNightPeriodsInRange(start, end);
  const nightCapSavings: number[] = [];

  for (const period of nightPeriods) {
    const periodHours = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60);
    const periodFee = periodHours * hourlyRate;
    if (periodFee > nightCap) {
      nightCapSavings.push(Number((periodFee - nightCap).toFixed(2)));
    }
  }
  nightCapDiscount = Number(nightCapSavings.reduce((sum, val) => sum + val, 0).toFixed(2));

  let dailyCapDiscount = 0;
  const dailyPeriods = getDailyPeriods(start, end);
  const dailyCapSavings: number[] = [];

  for (const period of dailyPeriods) {
    const periodHours = (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60);
    let periodFee = periodHours * hourlyRate;

    let periodNightDiscount = 0;
    const periodNightHours = calculateNightHours(period.start, period.end);
    const periodNightFee = periodNightHours * hourlyRate;
    if (periodNightFee > nightCap && periodNightHours > 0) {
      periodNightDiscount = periodNightFee - nightCap;
    }

    periodFee = periodFee - periodNightDiscount;

    if (periodFee > dailyCap) {
      const saving = Number((periodFee - dailyCap).toFixed(2));
      dailyCapSavings.push(saving);
    }
  }
  dailyCapDiscount = Number(dailyCapSavings.reduce((sum, val) => sum + val, 0).toFixed(2));

  let totalAmount = baseFee - nightCapDiscount - dailyCapDiscount + damageDeduction + cleaningFee;
  totalAmount = Number(Math.max(0, totalAmount).toFixed(2));

  return {
    baseFee,
    nightCapDiscount,
    dailyCapDiscount,
    damageDeduction,
    cleaningFee,
    totalAmount,
  };
};
