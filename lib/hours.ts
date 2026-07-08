// 時課——十二時辰吉凶（《剋擇講義》擇時之法）
// 貴人登天時（書 224-228）：月將加時，貴人臨亥（天門）之時為時家最吉。
//   式：時支 =（亥 − 貴人支 ＋ 月將）mod 12。以正月雨水後表甲乙丙三干六格驗合。
// 又合婚斷法（書 149）：「遇祿、馬、貴人則吉；白虎、沖、刑、刃、空亡則凶」。
// 埋兒凶時（書 105）：子午卯酉女忌丑時、寅申巳亥女忌申時、辰戌丑未女忌卯時。

import { GAN, ZHI, ZHI_CHONG, getYueJiang, DayInfo } from "./almanac";
import { HUI_TOU, JIAN_REN } from "./events";

const GAN_LIST = GAN as readonly string[];
const ZHI_LIST = ZHI as readonly string[];

// 陽貴（晝貴）、陰貴（夜貴）
const YANG_GUI: Record<string, string> = {
  甲: "未", 乙: "申", 丙: "酉", 丁: "亥", 戊: "丑",
  己: "子", 庚: "丑", 辛: "寅", 壬: "卯", 癸: "巳",
};
const YIN_GUI: Record<string, string> = {
  甲: "丑", 乙: "子", 丙: "亥", 丁: "酉", 戊: "未",
  己: "申", 庚: "未", 辛: "午", 壬: "巳", 癸: "卯",
};
const LU: Record<string, string> = {
  甲: "寅", 乙: "卯", 丙: "巳", 戊: "巳", 丁: "午", 己: "午",
  庚: "申", 辛: "酉", 壬: "亥", 癸: "子",
};
const TIAN_YI: Record<string, string[]> = {
  甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"],
  乙: ["子", "申"], 己: ["子", "申"],
  丙: ["亥", "酉"], 丁: ["亥", "酉"],
  壬: ["巳", "卯"], 癸: ["巳", "卯"],
  辛: ["午", "寅"],
};
const YI_MA: Record<string, string> = {
  申: "寅", 子: "寅", 辰: "寅", 寅: "申", 午: "申", 戌: "申",
  巳: "亥", 酉: "亥", 丑: "亥", 亥: "巳", 卯: "巳", 未: "巳",
};
const LIU_HE: Record<string, string> = {
  子: "丑", 丑: "子", 寅: "亥", 亥: "寅", 卯: "戌", 戌: "卯",
  辰: "酉", 酉: "辰", 巳: "申", 申: "巳", 午: "未", 未: "午",
};
const SAN_HE = ["申子辰", "巳酉丑", "寅午戌", "亥卯未"];
const GAN_WX: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};
const KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
const XING: [string, string][] = [
  ["子", "卯"], ["卯", "子"],
  ["寅", "巳"], ["巳", "申"], ["申", "寅"],
  ["丑", "戌"], ["戌", "未"], ["未", "丑"],
  ["辰", "辰"], ["午", "午"], ["酉", "酉"], ["亥", "亥"],
];
const HOUR_RANGE = [
  "23-01", "01-03", "03-05", "05-07", "07-09", "09-11",
  "11-13", "13-15", "15-17", "17-19", "19-21", "21-23",
];

export interface HourReason {
  kind: "吉" | "凶" | "注";
  text: string;
}

export interface HourEval {
  zhi: string;
  ganZhi: string;
  range: string;
  rating: "吉" | "平" | "凶";
  reasons: HourReason[];
}

export interface HourOptions {
  femaleZhi?: string; // 女命（婚事埋兒凶時、沖命用）
  femaleGan?: string; // 女命年干（箭刃用）
  persons?: { label: string; zhi: string; gan?: string }[]; // 諸命（沖命、回頭貢殺、箭刃用）
  xianMingZhi?: string; // 仙命（葬事用）
}

export function evaluateHours(info: DayInfo, opts: HourOptions = {}): HourEval[] {
  const dayGanIdx = GAN_LIST.indexOf(info.dayGan);
  const dz = info.dayZhi;
  const jiang = getYueJiang(info.solar.y, info.solar.m, info.solar.d);
  const jiangIdx = ZHI_LIST.indexOf(jiang as (typeof ZHI)[number]);
  // 日旬空亡
  const dayIdx = (() => {
    const zi = ZHI_LIST.indexOf(dz);
    for (let n = dayGanIdx; n < 60; n += 10) if (n % 12 === zi) return n;
    return -1;
  })();
  const kong =
    dayIdx >= 0
      ? [ZHI_LIST[(dayIdx - (dayIdx % 10) + 10) % 12], ZHI_LIST[(dayIdx - (dayIdx % 10) + 11) % 12]]
      : [];
  const sanHeGroup = SAN_HE.find((g) => g.includes(dz)) ?? "";

  return ZHI_LIST.map((hz, i) => {
    const hGan = GAN_LIST[((dayGanIdx % 5) * 2 + i) % 10]; // 五鼠遁
    const reasons: HourReason[] = [];
    // 貴人登天門時
    if (jiangIdx >= 0) {
      for (const [name, table] of [["陽貴", YANG_GUI], ["陰貴", YIN_GUI]] as const) {
        const g = ZHI_LIST.indexOf(table[info.dayGan]);
        if (((11 - g + jiangIdx) % 12 + 12) % 12 === i)
          reasons.push({ kind: "吉", text: `貴人登天門時（${name}）——時家最吉（原書 224）` });
      }
    }
    if (LU[info.dayGan] === hz) reasons.push({ kind: "吉", text: "日祿臨時" });
    if (TIAN_YI[info.dayGan]?.includes(hz)) reasons.push({ kind: "吉", text: "天乙貴人時" });
    if (YI_MA[dz] === hz) reasons.push({ kind: "吉", text: "驛馬時" });
    if (LIU_HE[dz] === hz) reasons.push({ kind: "吉", text: "時與日支六合" });
    if (sanHeGroup.includes(hz) && hz !== dz) reasons.push({ kind: "吉", text: "時與日支三合" });
    if (ZHI_CHONG[dz] === hz) reasons.push({ kind: "凶", text: "日時相沖（時破），大凶" });
    if (
      KE[GAN_WX[hGan]] === GAN_WX[info.dayGan] &&
      GAN_LIST.indexOf(hGan) % 2 === dayGanIdx % 2 // 同陰陽方為五不遇（甲日庚午、乙日辛巳之例）
    )
      reasons.push({ kind: "凶", text: "五不遇時（時干剋日干）" });
    // 天地雷兵時（原書 396；397 註：天兵大忌上樑入殮、地兵大忌動土破土、六戊時大忌祈禱）
    if (hGan === "丙") reasons.push({ kind: "注", text: "天兵時（遇丙）——大忌上樑、入殮（原書 396-397）" });
    if (hGan === "庚") reasons.push({ kind: "注", text: "地兵時（遇庚）——大忌動土、破土（原書 396-397）" });
    if (hGan === "戊") reasons.push({ kind: "注", text: "雷兵時（遇戊，六戊時）——大忌祈禱設醮（原書 396-397）" });
    if (kong.includes(hz)) reasons.push({ kind: "注", text: "日旬空亡時，慎用" });
    if (XING.some(([a, b]) => a === dz && b === hz))
      reasons.push({ kind: "注", text: "時支刑日支，慎用" });
    // 沖命
    if (opts.femaleZhi && ZHI_CHONG[opts.femaleZhi] === hz)
      reasons.push({ kind: "凶", text: `時沖女命${opts.femaleZhi}` });
    for (const p of opts.persons ?? []) {
      if (ZHI_CHONG[p.zhi] === hz) reasons.push({ kind: "凶", text: `時沖${p.label}` });
    }
    if (opts.xianMingZhi && ZHI_CHONG[opts.xianMingZhi] === hz)
      reasons.push({ kind: "凶", text: `時沖仙命${opts.xianMingZhi}` });
    // 回頭貢殺、箭刃（原書 56-57）：此時足成四柱之局者
    {
      const pillars = [info.yearGanZhi.charAt(1), info.monthZhi, dz, hz];
      const mings = [
        ...(opts.femaleZhi ? [{ label: `女命${opts.femaleZhi}`, zhi: opts.femaleZhi, gan: opts.femaleGan }] : []),
        ...(opts.persons ?? []),
      ];
      for (const p of mings) {
        const need = HUI_TOU[p.zhi];
        if (need && need.includes(hz) && need.every((z) => pillars.includes(z)))
          reasons.push({ kind: "凶", text: `此時${need.join("")}三合全局，${p.label}犯回頭貢殺，不能制化（原書 56）` });
        const pair = p.gan ? JIAN_REN[p.gan] : undefined;
        if (pair && pair.includes(hz) && pair.every((z) => pillars.includes(z)))
          reasons.push({ kind: "凶", text: `此時${pair.join("")}雙全，${p.label}犯箭刃（原書 57：天乙到、三合化刃則喜）` });
      }
    }
    // 埋兒凶時（原書 105 頁；婚牀事以女命論）
    if (opts.femaleZhi) {
      const fz = opts.femaleZhi;
      const mai =
        ["子", "午", "卯", "酉"].includes(fz) ? "丑" :
        ["寅", "申", "巳", "亥"].includes(fz) ? "申" : "卯";
      if (hz === mai)
        reasons.push({ kind: "凶", text: "埋兒凶時（原書 105 頁），嫁娶安牀忌之" });
    }
    const rating: HourEval["rating"] = reasons.some((r) => r.kind === "凶")
      ? "凶"
      : reasons.some((r) => r.kind === "吉")
        ? "吉"
        : "平";
    return { zhi: hz, ganZhi: hGan + hz, range: HOUR_RANGE[i], rating, reasons };
  });
}
