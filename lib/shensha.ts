// 月家神煞（依月建地支起例）與雜煞 — 依《剋擇講義》通書起例

import { DayInfo, ZHI_CHONG } from "./almanac";

// 受死日：正月起戌，逐月順推（正=寅月）
const SHOU_SI: Record<string, string> = {
  寅: "戌", 卯: "辰", 辰: "亥", 巳: "巳", 午: "子", 未: "午",
  申: "丑", 酉: "未", 戌: "寅", 亥: "申", 子: "卯", 丑: "酉",
};

// 往亡日：正月寅、二月巳、三月申、四月亥、五月卯、六月午、
// 七月酉、八月子、九月辰、十月未、十一月戌、十二月丑
const WANG_WANG: Record<string, string> = {
  寅: "寅", 卯: "巳", 辰: "申", 巳: "亥", 午: "卯", 未: "午",
  申: "酉", 酉: "子", 戌: "辰", 亥: "未", 子: "戌", 丑: "丑",
};

const MENG = ["寅", "巳", "申", "亥"]; // 孟月
const ZHONG = ["子", "卯", "午", "酉"]; // 仲月
// 季月：辰未戌丑

function monthClass(monthZhi: string): "孟" | "仲" | "季" {
  if (MENG.includes(monthZhi)) return "孟";
  if (ZHONG.includes(monthZhi)) return "仲";
  return "季";
}

// 歸忌日：孟月丑、仲月寅、季月子
const GUI_JI: Record<"孟" | "仲" | "季", string> = { 孟: "丑", 仲: "寅", 季: "子" };

// 紅沙日：孟月酉、仲月巳、季月丑
const HONG_SHA: Record<"孟" | "仲" | "季", string> = { 孟: "酉", 仲: "巳", 季: "丑" };

// 楊公忌日（農曆月、日）
const YANG_GONG: [number, number][] = [
  [1, 13], [2, 11], [3, 9], [4, 7], [5, 5], [6, 3],
  [7, 1], [7, 29], [8, 27], [9, 25], [10, 23], [11, 21], [12, 19],
];

export interface ShenShaHits {
  yuePo: boolean; // 月破（日支沖月建）
  shouSi: boolean; // 受死
  wangWang: boolean; // 往亡
  guiJi: boolean; // 歸忌
  hongSha: boolean; // 紅沙
  siLi: boolean; // 四離（二分二至前一日）
  siJue: boolean; // 四絕（四立前一日）
  yangGong: boolean; // 楊公忌
}

export function getShenSha(info: DayInfo): ShenShaHits {
  const mz = info.monthZhi;
  const dz = info.dayZhi;
  const cls = monthClass(mz);
  const lunarMonth = Math.abs(info.lunarMonth); // 閏月從正月算
  return {
    yuePo: ZHI_CHONG[mz] === dz,
    shouSi: SHOU_SI[mz] === dz,
    wangWang: WANG_WANG[mz] === dz,
    guiJi: GUI_JI[cls] === dz,
    hongSha: HONG_SHA[cls] === dz,
    siLi: ["春分", "夏至", "秋分", "冬至"].includes(info.nextDayJieQi),
    siJue: ["立春", "立夏", "立秋", "立冬"].includes(info.nextDayJieQi),
    yangGong: YANG_GONG.some(([m, d]) => m === lunarMonth && d === info.lunarDay),
  };
}

// ── 安牀忌例（《剋擇講義》書 111 頁，逐月以月建取） ──────────
// 月支序：寅卯辰巳午未申酉戌亥子丑（正〜十二月）
const MONTH_ORDER = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

function byMonth(table: string[], monthZhi: string): string {
  return table[MONTH_ORDER.indexOf(monthZhi)] ?? "";
}

function season(monthZhi: string): 0 | 1 | 2 | 3 {
  const i = MONTH_ORDER.indexOf(monthZhi);
  return Math.floor(i / 3) as 0 | 1 | 2 | 3; // 0春 1夏 2秋 3冬
}

// 臥尸日（漳州重此）：正月酉逆行
const WO_SHI_ZHANG = ["酉", "申", "未", "午", "巳", "辰", "卯", "寅", "丑", "子", "亥", "戌"];
// 臥尸日（泉州重此）
const WO_SHI_QUAN = ["子", "酉", "未", "申", "巳", "辰", "卯", "寅", "丑", "午", "戌", "亥"];
// 死別日（閩浙相用）：季忌 春戌 夏丑 秋辰 冬未
const SI_BIE = ["戌", "丑", "辰", "未"];
// 醞巢日（三合主凶）
const YUN_CHAO = ["辰", "丑", "戌", "未", "卯", "子", "酉", "午", "寅", "亥", "申", "巳"];
// 天賊日（得明星時可制）
const TIAN_ZEI = ["辰", "酉", "寅", "未", "子", "巳", "戌", "卯", "申", "丑", "午", "亥"];
// 木馬殺（俗忌）
const MU_MA = ["巳", "未", "酉", "申", "戌", "子", "亥", "丑", "卯", "寅", "辰", "午"];
// 箭頭殺（俗忌）：春辰 夏未 秋戌 冬丑
const JIAN_TOU = ["辰", "未", "戌", "丑"];
// 刀砧殺（俗忌）：春亥子 夏寅卯 秋巳午 冬申酉
const DAO_ZHEN: [string, string][] = [["亥", "子"], ["寅", "卯"], ["巳", "午"], ["申", "酉"]];

export interface AnChuangHit {
  name: string;
  kind: "凶" | "注";
  note: string;
}

export function getAnChuangJi(info: DayInfo): AnChuangHit[] {
  const mz = info.monthZhi;
  const dz = info.dayZhi;
  const s = season(mz);
  const out: AnChuangHit[] = [];
  if (byMonth(WO_SHI_ZHANG, mz) === dz)
    out.push({ name: "臥尸日", kind: "凶", note: "安牀忌之（原書：漳州重此）" });
  if (byMonth(WO_SHI_QUAN, mz) === dz)
    out.push({ name: "臥尸日", kind: "凶", note: "安牀忌之（原書：泉州重此）" });
  if (SI_BIE[s] === dz)
    out.push({ name: "死別日", kind: "凶", note: "安牀忌之（原書：閩浙相用）" });
  if (byMonth(YUN_CHAO, mz) === dz)
    out.push({ name: "醞巢日", kind: "注", note: "安牀俗忌（原書注：三合主凶）" });
  if (byMonth(TIAN_ZEI, mz) === dz)
    out.push({ name: "天賊日", kind: "注", note: "安牀俗忌，原書注：得明星時可制" });
  if (byMonth(MU_MA, mz) === dz)
    out.push({ name: "木馬殺", kind: "注", note: "安牀俗忌" });
  if (JIAN_TOU[s] === dz)
    out.push({ name: "箭頭殺", kind: "注", note: "安牀俗忌" });
  if (DAO_ZHEN[s].includes(dz))
    out.push({ name: "刀砧殺", kind: "注", note: "安牀俗忌" });
  return out;
}

// ── 裁衣合帳忌例（原書 92-93 頁） ──────────────────────────
// 白虎日（麟符制）、朱雀日（鳳凰符制）：六支循環，以月建取
const BAI_HU_CYCLE = ["午", "申", "戌", "子", "寅", "辰"];
const ZHU_QUE_CYCLE = ["卯", "巳", "未", "酉", "亥", "丑"];
// 長星、短星（俗忌裁衣，以農曆月、日號取）
const CHANG_XING: Record<number, number[]> = {
  1: [7], 2: [4], 3: [1], 4: [9], 5: [15], 6: [10],
  7: [8], 8: [2, 5], 9: [3, 4], 10: [1], 11: [12], 12: [9],
};
const DUAN_XING: Record<number, number[]> = {
  1: [21], 2: [19], 3: [16], 4: [25], 5: [25], 6: [20],
  7: [22], 8: [18, 19], 9: [16, 17], 10: [14], 11: [22], 12: [25],
};
// 正四廢（季之干支對，日干支全同者忌）
const SI_FEI: [string, string][][] = [
  [["庚", "申"], ["辛", "酉"]], // 春
  [["壬", "子"], ["癸", "亥"]], // 夏
  [["甲", "寅"], ["乙", "卯"]], // 秋
  [["丙", "午"], ["丁", "巳"]], // 冬
];

// 正四廢（安床、裁衣皆忌——原書 93、100 頁）
export function isSiFei(info: DayInfo): boolean {
  const fei = SI_FEI[season(info.monthZhi)];
  return fei.some(([g, z]) => info.dayGan === g && info.dayZhi === z);
}

export function getCaiYiJi(info: DayInfo): { kind: "凶" | "注"; text: string }[] {
  const out: { kind: "凶" | "注"; text: string }[] = [];
  const mi = MONTH_ORDER.indexOf(info.monthZhi);
  const dz = info.dayZhi;
  if (BAI_HU_CYCLE[mi % 6] === dz)
    out.push({ kind: "注", text: "白虎日，裁衣合帳忌之（麟符制之則吉——原書）" });
  if (ZHU_QUE_CYCLE[mi % 6] === dz)
    out.push({ kind: "注", text: "朱雀日，裁衣合帳忌之（鳳凰符制之則吉——原書）" });
  if (byMonth(TIAN_ZEI, info.monthZhi) === dz)
    out.push({ kind: "凶", text: "天賊日，裁衣忌之（原書：裁衣合帳忌例）" });
  const lm = Math.abs(info.lunarMonth);
  if (CHANG_XING[lm]?.includes(info.lunarDay))
    out.push({ kind: "凶", text: "長星日（俗忌裁衣），忌用" });
  if (DUAN_XING[lm]?.includes(info.lunarDay))
    out.push({ kind: "凶", text: "短星日（俗忌裁衣），忌用" });
  const fei = SI_FEI[season(info.monthZhi)];
  if (fei.some(([g, z]) => info.dayGan === g && dz === z))
    out.push({ kind: "凶", text: "正四廢日，俗忌勿用（原書：裁衣合帳忌例）" });
  return out;
}

// ── 陰陽不將（原書 211-221 頁「每月將神名目」，依表歸納起例） ──
// 月厭：正月（寅月）在戌，逐月逆行。厭對＝沖厭。
// 支對厭：厭後五支為「後」，厭前五支為「前」。
// 干以祿位對厭分前後（祿臨厭對之位作「前」——原書乙丑二月不將可證）。
// 干前支後＝不將（嫁娶大吉）；干前支前＝陽將（妨夫）；
// 干後支後＝陰將（妨婦）；干後支前＝俱將（俱妨）。
const YUE_YAN: Record<string, string> = {
  寅: "戌", 卯: "酉", 辰: "申", 巳: "未", 午: "午", 未: "巳",
  申: "辰", 酉: "卯", 戌: "寅", 亥: "丑", 子: "子", 丑: "亥",
};
const LU_ZHI: Record<string, string> = {
  甲: "寅", 乙: "卯", 丙: "巳", 戊: "巳", 丁: "午", 己: "午",
  庚: "申", 辛: "酉", 壬: "亥", 癸: "子",
};
const ZHI_ORDER = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export type JiangShen = "不將" | "陽將" | "陰將" | "俱將" | "月厭" | "厭對";

export function getJiangShen(info: DayInfo): JiangShen {
  const yan = YUE_YAN[info.monthZhi];
  const e = ZHI_ORDER.indexOf(yan);
  const dz = ZHI_ORDER.indexOf(info.dayZhi);
  const dd = ((dz - e) % 12 + 12) % 12;
  if (dd === 0) return "月厭";
  if (dd === 6) return "厭對";
  const zhiHou = dd >= 1 && dd <= 5; // 支在厭後
  const lu = ZHI_ORDER.indexOf(LU_ZHI[info.dayGan]);
  const dl = ((lu - e) % 12 + 12) % 12;
  const ganHou = dl >= 1 && dl <= 5; // 干（祿）在厭後；dl=0 作後、dl=6 作前
  const ganQian = !ganHou;
  if (ganQian && zhiHou) return "不將";
  if (ganQian && !zhiHou) return "陽將";
  if (!ganQian && zhiHou) return "陰將";
  return "俱將";
}

// ── 天嗣犯沖（原書 109 頁）：以命天干定真天嗣，正沖日安牀大忌 ──
const TIAN_SI: Record<string, { si: string; chong: string }> = {
  甲: { si: "丙寅", chong: "壬申" },
  乙: { si: "丁亥", chong: "癸巳" },
  丙: { si: "戊戌", chong: "甲辰" },
  丁: { si: "己酉", chong: "乙卯" },
  戊: { si: "庚申", chong: "丙寅" },
  己: { si: "辛未", chong: "丁丑" },
  庚: { si: "壬午", chong: "戊子" },
  辛: { si: "癸巳", chong: "己亥" },
  壬: { si: "甲辰", chong: "庚戌" },
  癸: { si: "乙卯", chong: "辛酉" },
};

export function getTianSiChong(
  mingGan: string,
  dayGanZhi: string,
  dayZhi: string,
): { kind: "凶" | "注"; text: string } | null {
  const t = TIAN_SI[mingGan];
  if (!t) return null;
  if (dayGanZhi === t.chong)
    return { kind: "凶", text: `${t.chong}日正沖天嗣（命真天嗣${t.si}），犯滅子胎，安牀大忌` };
  if (dayZhi === t.chong.charAt(1))
    return { kind: "注", text: `日支沖天嗣（命真天嗣${t.si}），亦稱沖，慎用` };
  return null;
}

// 破碎日（以本命年支取）：子午卯酉命見巳日、寅申巳亥命見酉日、辰戌丑未命見丑日
export function isPoSui(mingZhi: string, dayZhi: string): boolean {
  if (["子", "午", "卯", "酉"].includes(mingZhi)) return dayZhi === "巳";
  if (["寅", "申", "巳", "亥"].includes(mingZhi)) return dayZhi === "酉";
  return dayZhi === "丑";
}

// 正沖本命（日支沖本命年支）
export function isChongMing(mingZhi: string, dayZhi: string): boolean {
  return ZHI_CHONG[mingZhi] === dayZhi;
}
