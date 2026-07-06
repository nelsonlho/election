import { Solar, Lunar, LunarMonth } from "lunar-typescript";
import * as OpenCC from "opencc-js";

// 簡體→繁體：OpenCC 全轉（lunar-typescript 輸出為簡體）
const convert = OpenCC.Converter({ from: "cn", to: "tw" });

// OpenCC 之後再校：擇日慣用字
const POST_FIX: [string, string][] = [
  ["床", "牀"],
];

export function toTraditional(s: string): string {
  let out = convert(s);
  for (const [a, b] of POST_FIX) out = out.split(a).join(b);
  return out;
}

export const ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
export type Zhi = (typeof ZHI)[number];

// 地支六沖
export const ZHI_CHONG: Record<string, string> = {
  子: "午", 丑: "未", 寅: "申", 卯: "酉", 辰: "戌", 巳: "亥",
  午: "子", 未: "丑", 申: "寅", 酉: "卯", 戌: "辰", 亥: "巳",
};

export interface DayInfo {
  solar: { y: number; m: number; d: number; week: string };
  lunarText: string; // 農曆年月日
  lunarMonth: number; // 農曆月（閏月為負）
  lunarDay: number;
  lunarMonthDayCount: number; // 該農曆月天數（判大小月，周堂用）
  yearGanZhi: string; // 干支年（以立春為界）
  monthGanZhi: string; // 干支月（以節為界）
  dayGanZhi: string;
  dayGan: string;
  dayZhi: string;
  monthZhi: string; // 月建（節氣月支，月家神煞用）
  yearZhi: string;
  zhiXing: string; // 建除十二神（繁體）
  xiu: string; // 二十八宿
  pengZu: string; // 彭祖百忌
  taiShen: string; // 胎神占方（原書 104-105 頁六十甲子日胎神，與庫表對勘全合）
  chongDesc: string; // 日沖
  yi: string[]; // 通書宜
  ji: string[]; // 通書忌
  jieQi: string; // 當日節氣（無則空）
  nextDayJieQi: string; // 翌日節氣（判四離四絕）
}

export function getDayInfo(y: number, m: number, d: number): DayInfo {
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();
  const next = solar.next(1).getLunar();
  const lm = LunarMonth.fromYm(lunar.getYear(), lunar.getMonth());
  return {
    solar: { y, m, d, week: "日一二三四五六".charAt(solar.getWeek()) },
    lunarText: toTraditional(`${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`),
    lunarMonth: lunar.getMonth(),
    lunarDay: lunar.getDay(),
    lunarMonthDayCount: lm ? lm.getDayCount() : 30,
    yearGanZhi: lunar.getYearInGanZhiByLiChun(),
    monthGanZhi: lunar.getMonthInGanZhi(),
    dayGanZhi: lunar.getDayInGanZhi(),
    dayGan: lunar.getDayGan(),
    dayZhi: lunar.getDayZhi(),
    monthZhi: lunar.getMonthZhi(),
    yearZhi: lunar.getYearZhiByLiChun(),
    zhiXing: toTraditional(lunar.getZhiXing()),
    xiu: toTraditional(lunar.getXiu()),
    pengZu: toTraditional(`${lunar.getPengZuGan()}　${lunar.getPengZuZhi()}`),
    taiShen: toTraditional(lunar.getDayPositionTai()),
    chongDesc: toTraditional(lunar.getDayChongDesc()),
    yi: lunar.getDayYi().map(toTraditional),
    ji: lunar.getDayJi().map(toTraditional),
    jieQi: toTraditional(lunar.getJieQi()),
    nextDayJieQi: toTraditional(next.getJieQi()),
  };
}

// 由西元生年取生肖年支（以立春為界不易由年號定，此處按農曆年支——擇日通例以生肖屬相論）
export function yearZhiOfBirthYear(year: number): Zhi {
  // 農曆年支：1984 為甲子（子年）
  const idx = ((year - 1984) % 12 + 12) % 12;
  return ZHI[idx];
}

export const GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

// 土王用事：四立前十八日，土旺，忌動土破土（《剋擇講義》動土平基碎金賦）
const SI_LI = ["立春", "立夏", "立秋", "立冬"];

export function isTuWang(y: number, m: number, d: number): boolean {
  let s = Solar.fromYmd(y, m, d);
  for (let i = 0; i < 18; i++) {
    s = s.next(1);
    if (SI_LI.includes(s.getLunar().getJieQi())) return true;
  }
  return false;
}

export function yearGanOfBirthYear(year: number): string {
  const idx = ((year - 1984) % 10 + 10) % 10;
  return GAN[idx];
}
