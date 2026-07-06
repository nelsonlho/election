// 擇日引擎：單日查與範圍尋吉日

import { getDayInfo, DayInfo, yearZhiOfBirthYear, yearGanOfBirthYear } from "./almanac";
import { evaluateDay, eventDef, Evaluation, EventKey, EvalOptions } from "./events";

export interface DayResult {
  info: DayInfo;
  evaluation: Evaluation;
}

export function queryDay(y: number, m: number, d: number, event: EventKey, opts: EvalOptions = {}): DayResult {
  const info = getDayInfo(y, m, d);
  return { info, evaluation: evaluateDay(info, event, opts) };
}

export interface RangeQuery {
  start: Date;
  days: number; // 尋日範圍（上限 366）
  event: EventKey;
  femaleBirthYear?: number; // 婚事：女命生年（西元）
  birthYear?: number; // 餘事：本命生年（西元，可缺）
  mountainZhi?: string; // 宅舍座山（十二支山，造作事用，可缺）
}

export function findAuspiciousDays(q: RangeQuery): DayResult[] {
  const opts: EvalOptions = {};
  const useFemale = eventDef(q.event).mingInput === "female";
  if (useFemale && q.femaleBirthYear) {
    opts.femaleBirthZhi = yearZhiOfBirthYear(q.femaleBirthYear);
    opts.femaleBirthGan = yearGanOfBirthYear(q.femaleBirthYear);
  }
  if (!useFemale && q.birthYear) {
    opts.birthZhi = yearZhiOfBirthYear(q.birthYear);
    opts.birthGan = yearGanOfBirthYear(q.birthYear);
  }
  if (q.mountainZhi) opts.mountainZhi = q.mountainZhi;

  const n = Math.min(Math.max(q.days, 1), 366);
  const out: DayResult[] = [];
  const cur = new Date(q.start.getTime());
  for (let i = 0; i < n; i++) {
    const info = getDayInfo(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
    out.push({ info, evaluation: evaluateDay(info, q.event, opts) });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
