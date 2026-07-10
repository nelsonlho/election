// 擇日引擎：單日查與範圍尋吉日

import { getDayInfo, DayInfo, yearZhiOfBirthYear, yearGanOfBirthYear } from "./almanac";
import { evaluateDay, eventDef, Evaluation, EventKey, EvalOptions, MingPerson } from "./events";

export function personsOfYears(years: number[]): MingPerson[] {
  return years.map((y) => ({ year: y, zhi: yearZhiOfBirthYear(y), gan: yearGanOfBirthYear(y) }));
}

export interface DayResult {
  info: DayInfo;
  evaluation: Evaluation;
}

export function queryDay(y: number, m: number, d: number, event: EventKey, opts: EvalOptions = {}): DayResult {
  const info = getDayInfo(y, m, d);
  return { info, evaluation: evaluateDay(info, event, opts) };
}

// 單查日數上限（約三年）——起始日可設任意日（含過去），故過去未來皆可盡查
export const MAX_SPAN_DAYS = 1100;

export interface RangeQuery {
  start: Date;
  days: number; // 尋日範圍（上限 MAX_SPAN_DAYS）
  event: EventKey;
  femaleBirthYear?: number; // 婚事：女命生年（西元）
  birthYear?: number; // 本命生年（西元，可缺）
  birthYears?: number[]; // 多命合參（如開市數東家、婚事乾造），優先於 birthYear
  mountainZhi?: string; // 座山（十二支山，造作葬事用，可缺）
  jianXiang?: string; // 兼向——座山所兼之鄰山（沖兼、三殺七山用，可缺）
  xianMingYear?: number; // 仙命（亡者）生年——葬事用，可缺
  femaleBirthMonth?: number; // 女命生月（陰胎用——安牀）
  birthMonth?: number; // 本命（乾造）生月（陽氣用——安牀）
  disabledLayers?: string[]; // 停用之法度層
}

export function findAuspiciousDays(q: RangeQuery): DayResult[] {
  const opts: EvalOptions = {};
  const useFemale = eventDef(q.event).mingInput === "female";
  // 安牀雖以本命入，陰胎仍以女命推（原書 107）——故亦收女命
  if ((useFemale || q.event === "anchuang") && q.femaleBirthYear) {
    opts.femaleBirthZhi = yearZhiOfBirthYear(q.femaleBirthYear);
    opts.femaleBirthGan = yearGanOfBirthYear(q.femaleBirthYear);
  }
  if (q.femaleBirthMonth) opts.femaleBirthMonth = q.femaleBirthMonth;
  if (q.birthMonth) opts.birthMonth = q.birthMonth;
  const years = q.birthYears?.length ? q.birthYears : q.birthYear ? [q.birthYear] : [];
  if (years.length) {
    opts.persons = personsOfYears(years);
    if (!useFemale) {
      opts.birthZhi = opts.persons[0].zhi;
      opts.birthGan = opts.persons[0].gan;
    }
  }
  if (q.mountainZhi) opts.mountainZhi = q.mountainZhi;
  if (q.jianXiang) opts.jianXiang = q.jianXiang;
  if (q.xianMingYear) {
    opts.xianMingZhi = yearZhiOfBirthYear(q.xianMingYear);
    opts.xianMingGan = yearGanOfBirthYear(q.xianMingYear);
  }
  if (q.disabledLayers?.length) opts.disabledLayers = q.disabledLayers;

  const n = Math.min(Math.max(q.days, 1), MAX_SPAN_DAYS);
  const out: DayResult[] = [];
  const cur = new Date(q.start.getTime());
  for (let i = 0; i < n; i++) {
    const info = getDayInfo(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
    out.push({ info, evaluation: evaluateDay(info, q.event, opts) });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
