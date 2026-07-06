// 事類評日 — 嫁娶、安牀、出行（依《剋擇講義》起例）

import { DayInfo, ZHI_CHONG, isTuWang } from "./almanac";
import { getShenSha, getAnChuangJi, getTianSiChong, getJiangShen, isPoSui, isChongMing } from "./shensha";
import { JIANCHU, JIANCHU_BY_EVENT, JianChuName } from "./jianchu";

export type EventKey =
  | "jiaqu" | "nacai" | "anchuang" | "qiusi"
  | "ruzhai" | "dongtu" | "xiuzao" | "shangliang"
  | "chuxing" | "kaishi" | "liquan" | "furen" | "qiuming"
  | "jisi" | "jinxiang" | "kaiguang" | "qiuyi"
  | "anzang" | "potu";
export type Rating = "吉" | "平" | "凶";

export const EVENT_NAMES: Record<EventKey, string> = {
  jiaqu: "嫁娶",
  nacai: "納采",
  anchuang: "安牀",
  qiusi: "求嗣",
  ruzhai: "入宅",
  dongtu: "動土",
  xiuzao: "修造",
  shangliang: "豎柱上樑",
  chuxing: "出行",
  kaishi: "開市",
  liquan: "立券交易",
  furen: "赴任",
  qiuming: "求名",
  jisi: "祭祀",
  jinxiang: "進香",
  kaiguang: "開光",
  qiuyi: "求醫治病",
  anzang: "安葬",
  potu: "破土",
};

// 事類分科（UI 選單自動生成；新事類入既有科，首層以四五科為限）
export interface EventDef {
  key: EventKey;
  name: string;
  // 所需命造欄：female = 女命生年（必填）；self = 本命生年（可留空）
  mingInput: "female" | "self";
}

export const EVENT_CATEGORIES: { category: string; events: EventDef[] }[] = [
  {
    category: "婚嫁家室",
    events: [
      { key: "nacai", name: "納采", mingInput: "female" },
      { key: "jiaqu", name: "嫁娶", mingInput: "female" },
      { key: "anchuang", name: "安牀", mingInput: "self" },
      { key: "qiusi", name: "求嗣", mingInput: "self" },
    ],
  },
  {
    category: "居家造作",
    events: [
      { key: "ruzhai", name: "入宅", mingInput: "self" },
      { key: "dongtu", name: "動土", mingInput: "self" },
      { key: "xiuzao", name: "修造", mingInput: "self" },
      { key: "shangliang", name: "豎柱上樑", mingInput: "self" },
    ],
  },
  {
    category: "功名營商",
    events: [
      { key: "chuxing", name: "出行", mingInput: "self" },
      { key: "kaishi", name: "開市", mingInput: "self" },
      { key: "liquan", name: "立券交易", mingInput: "self" },
      { key: "furen", name: "赴任", mingInput: "self" },
      { key: "qiuming", name: "求名", mingInput: "self" },
    ],
  },
  {
    category: "祭祀祈禳",
    events: [
      { key: "jisi", name: "祭祀", mingInput: "self" },
      { key: "jinxiang", name: "進香", mingInput: "self" },
      { key: "kaiguang", name: "開光", mingInput: "self" },
      { key: "qiuyi", name: "求醫治病", mingInput: "self" },
    ],
  },
  {
    category: "造葬",
    events: [
      { key: "potu", name: "破土", mingInput: "self" },
      { key: "anzang", name: "安葬", mingInput: "self" },
    ],
  },
];

export function eventDef(key: EventKey): EventDef {
  for (const c of EVENT_CATEGORIES) {
    const e = c.events.find((e) => e.key === key);
    if (e) return e;
  }
  throw new Error(`unknown event: ${key}`);
}

export interface Reason {
  kind: "吉" | "凶" | "注"; // 注：提示，不定吉凶
  text: string;
}

export interface Evaluation {
  rating: Rating;
  reasons: Reason[];
}

// ── 嫁娶行嫁利月表 ────────────────────────────────────────
// 《剋擇講義》嫁娶命利月（書 205-206 頁）：「其利月須論節氣，非論月份」
// ——故以月建（節氣月支）取月，非農曆月號。表照原書 206 頁定局。
type MonthCat = "大利月" | "小利月" | "妨翁姑月" | "妨父母月" | "妨夫月" | "妨婦月";

const LI_YUE: Record<string, Record<MonthCat, [string, string]>> = {
  子午: { 大利月: ["丑", "未"], 小利月: ["寅", "申"], 妨翁姑月: ["卯", "酉"], 妨父母月: ["辰", "戌"], 妨夫月: ["巳", "亥"], 妨婦月: ["子", "午"] },
  丑未: { 大利月: ["子", "午"], 小利月: ["巳", "亥"], 妨翁姑月: ["辰", "戌"], 妨父母月: ["卯", "酉"], 妨夫月: ["寅", "申"], 妨婦月: ["丑", "未"] },
  寅申: { 大利月: ["卯", "酉"], 小利月: ["辰", "戌"], 妨翁姑月: ["巳", "亥"], 妨父母月: ["子", "午"], 妨夫月: ["丑", "未"], 妨婦月: ["寅", "申"] },
  卯酉: { 大利月: ["寅", "申"], 小利月: ["丑", "未"], 妨翁姑月: ["子", "午"], 妨父母月: ["巳", "亥"], 妨夫月: ["辰", "戌"], 妨婦月: ["卯", "酉"] },
  辰戌: { 大利月: ["巳", "亥"], 小利月: ["子", "午"], 妨翁姑月: ["丑", "未"], 妨父母月: ["寅", "申"], 妨夫月: ["卯", "酉"], 妨婦月: ["辰", "戌"] },
  巳亥: { 大利月: ["辰", "戌"], 小利月: ["卯", "酉"], 妨翁姑月: ["寅", "申"], 妨父母月: ["丑", "未"], 妨夫月: ["子", "午"], 妨婦月: ["巳", "亥"] },
};

function liYueGroup(zhi: string): string {
  for (const key of Object.keys(LI_YUE)) if (key.includes(zhi)) return key;
  return "子午";
}

export function jiaQuMonthCat(femaleZhi: string, monthZhi: string): MonthCat {
  const table = LI_YUE[liYueGroup(femaleZhi)];
  for (const cat of Object.keys(table) as MonthCat[]) {
    if (table[cat].includes(monthZhi)) return cat;
  }
  return "大利月";
}

// ── 三德（歲德、天德、月德）──────────────────────────────
// 原書：妨翁姑月、妨父母月「宜取日有歲德、天德、月德，逢一可解」
const TIAN_DE: Record<string, string> = {
  寅: "丁", 卯: "申", 辰: "壬", 巳: "辛", 午: "亥", 未: "甲",
  申: "癸", 酉: "寅", 戌: "丙", 亥: "乙", 子: "巳", 丑: "庚",
};
const YUE_DE: Record<string, string> = {
  寅: "丙", 午: "丙", 戌: "丙", 亥: "甲", 卯: "甲", 未: "甲",
  申: "壬", 子: "壬", 辰: "壬", 巳: "庚", 酉: "庚", 丑: "庚",
};
const SUI_DE: Record<string, string> = {
  甲: "甲", 己: "甲", 乙: "庚", 庚: "庚", 丙: "丙", 辛: "丙",
  丁: "壬", 壬: "壬", 戊: "戊", 癸: "戊",
};

function sanDe(info: DayInfo): string[] {
  const out: string[] = [];
  const td = TIAN_DE[info.monthZhi];
  if (info.dayGan === td || info.dayZhi === td) out.push("天德");
  if (info.dayGan === YUE_DE[info.monthZhi]) out.push("月德");
  if (info.dayGan === SUI_DE[info.yearGanZhi.charAt(0)]) out.push("歲德");
  return out;
}

// ── 嫁娶周堂 ──────────────────────────────────────────────
// 周堂圖八位（順序）：夫、姑、堂、翁、第、竈、婦、廚
// 大月（三十日）初一起「夫」順行；小月（廿九日）初一起「婦」逆行
const ZHOU_TANG = ["夫", "姑", "堂", "翁", "第", "竈", "婦", "廚"];

export function zhouTang(lunarDay: number, monthDayCount: number): string {
  if (monthDayCount >= 30) return ZHOU_TANG[(lunarDay - 1) % 8];
  return ZHOU_TANG[(6 - (lunarDay - 1) + 800) % 8];
}

// ── 女命十二地支日吉凶論（原書 86-89 頁，以女命三合局定局） ──
// 律：正檳榔殺＝局旺支後三位；檳榔三殺＝旺支＋七（歲煞）；沖命犯沖大凶；餘清吉取用
const NV_MING_DAY: Record<string, { binlang: string[]; sansha: string; geshan: string[] }> = {
  申子辰: { binlang: ["卯", "辰", "巳"], sansha: "未", geshan: ["寅", "申", "亥"] },
  巳酉丑: { binlang: ["子", "丑", "寅"], sansha: "辰", geshan: ["午", "酉", "戌"] },
  寅午戌: { binlang: ["酉", "戌", "亥"], sansha: "丑", geshan: ["巳"] },
  亥卯未: { binlang: ["午", "未", "申"], sansha: "戌", geshan: ["卯", "亥"] },
};

// 原書特例：午女午日、戌女未日＝刑合貴化（刑中帶合，可用）
const XING_HE: [string, string][] = [["午", "午"], ["戌", "未"]];

function nvMingDayVerdict(femaleZhi: string, dayZhi: string): Reason | null {
  const group = Object.keys(NV_MING_DAY).find((k) => k.includes(femaleZhi));
  if (!group) return null;
  const t = NV_MING_DAY[group];
  if (ZHI_CHONG[femaleZhi] === dayZhi) return null; // 犯沖大凶已另計
  if (XING_HE.some(([m, d]) => m === femaleZhi && d === dayZhi))
    return { kind: "注", text: "女命日吉凶（原書）：刑合貴化，可用" };
  if (t.binlang.includes(dayZhi))
    return { kind: "凶", text: "女命日吉凶（原書）：正檳榔殺，忌用" };
  if (t.sansha === dayZhi)
    return { kind: "凶", text: "女命日吉凶（原書）：檳榔三殺，忌用" };
  if (t.geshan.includes(dayZhi))
    return { kind: "凶", text: "女命日吉凶（原書）：盤隔山殺，忌用" };
  return { kind: "吉", text: "女命日吉凶（原書）：清吉取用" };
}

// ── 吉凶神定局（原書 59 頁起）：本命對日辰之吉凶 ──────────
// 吉：三合、六合、堆貴（日支為命干天乙）、進貴（命支為日干天乙）、
//     堆祿（日支為命干祿）、進祿（命支為日干祿）、堆馬（日支為命驛馬）
// 凶：刑（另沖已計）
const TIAN_YI: Record<string, string[]> = {
  甲: ["丑", "未"], 戊: ["丑", "未"], 庚: ["丑", "未"],
  乙: ["子", "申"], 己: ["子", "申"],
  丙: ["亥", "酉"], 丁: ["亥", "酉"],
  壬: ["巳", "卯"], 癸: ["巳", "卯"],
  辛: ["午", "寅"],
};
const LU: Record<string, string> = {
  甲: "寅", 乙: "卯", 丙: "巳", 戊: "巳", 丁: "午", 己: "午",
  庚: "申", 辛: "酉", 壬: "亥", 癸: "子",
};
const SAN_HE_GROUPS = ["申子辰", "巳酉丑", "寅午戌", "亥卯未"];
const LIU_HE: Record<string, string> = {
  子: "丑", 丑: "子", 寅: "亥", 亥: "寅", 卯: "戌", 戌: "卯",
  辰: "酉", 酉: "辰", 巳: "申", 申: "巳", 午: "未", 未: "午",
};
const YI_MA: Record<string, string> = {
  申: "寅", 子: "寅", 辰: "寅", 寅: "申", 午: "申", 戌: "申",
  巳: "亥", 酉: "亥", 丑: "亥", 亥: "巳", 卯: "巳", 未: "巳",
};
// 三刑
const XING_PAIRS: [string, string][] = [
  ["子", "卯"], ["卯", "子"],
  ["寅", "巳"], ["巳", "申"], ["申", "寅"],
  ["丑", "戌"], ["戌", "未"], ["未", "丑"],
  ["辰", "辰"], ["午", "午"], ["酉", "酉"], ["亥", "亥"],
];

function jiXiongShen(info: DayInfo, mingGan: string | undefined, mingZhi: string): Reason[] {
  const out: Reason[] = [];
  const dz = info.dayZhi;
  const dg = info.dayGan;
  const group = SAN_HE_GROUPS.find((g) => g.includes(mingZhi));
  if (group && group.includes(dz) && dz !== mingZhi)
    out.push({ kind: "吉", text: "日支與本命三合（原書：吉凶神定局）" });
  if (LIU_HE[mingZhi] === dz)
    out.push({ kind: "吉", text: "日支與本命六合（原書：吉凶神定局）" });
  if (mingGan && TIAN_YI[mingGan]?.includes(dz))
    out.push({ kind: "吉", text: "堆貴：日支為本命天乙貴人" });
  if (TIAN_YI[dg]?.includes(mingZhi))
    out.push({ kind: "吉", text: "進貴：日干天乙貴人臨本命" });
  if (mingGan && LU[mingGan] === dz)
    out.push({ kind: "吉", text: "堆祿：日支為本命祿位" });
  if (LU[dg] === mingZhi)
    out.push({ kind: "吉", text: "進祿：日干祿臨本命" });
  if (YI_MA[mingZhi] === dz)
    out.push({ kind: "吉", text: "堆馬：日支為本命驛馬" });
  if (XING_PAIRS.some(([a, b]) => a === mingZhi && b === dz))
    out.push({ kind: "注", text: "日支刑本命，慎用（原書：吉凶神定局列刑為忌）" });
  return out;
}

// ── 婚神煞（原書第四期「六十女總局」歸納之通例） ──────────
// 胎元＝命干＋2、命支＋6 → 命支之日即沖胎元（干＋2 同干者真沖、干＋8 者正沖，凶）
// 夫星＝命干＋7、命支＋7 → 命支＋1 之日沖夫星（干＋3 者正沖，凶）
// 天嗣＝依干表（見 shensha.getTianSiChong），嫁娶亦忌
// 桃花（咸池）＝三合局沐浴位；天狗＝命支＋10。俱可制，慎用
const GAN_ORDER = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const ZHI_ORDER_E = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const XIAN_CHI: Record<string, string> = {
  申: "酉", 子: "酉", 辰: "酉",
  寅: "卯", 午: "卯", 戌: "卯",
  巳: "午", 酉: "午", 丑: "午",
  亥: "子", 卯: "子", 未: "子",
};

function zhiAdd(zhi: string, n: number): string {
  return ZHI_ORDER_E[(ZHI_ORDER_E.indexOf(zhi) + n + 120) % 12];
}
function ganAdd(gan: string, n: number): string {
  return GAN_ORDER[(GAN_ORDER.indexOf(gan) + n + 100) % 10];
}

function hunShenSha(info: DayInfo, fGan: string | undefined, fZhi: string): Reason[] {
  const out: Reason[] = [];
  const dz = info.dayZhi;
  const dg = info.dayGan;
  // 沖胎元：命支之日
  if (dz === fZhi) {
    if (fGan && (dg === ganAdd(fGan, 2) || dg === ganAdd(fGan, 8)))
      out.push({ kind: "凶", text: `${info.dayGanZhi}日${dg === ganAdd(fGan, 2) ? "真" : "正"}沖胎元，大凶（原書：六十女總局）` });
    else out.push({ kind: "注", text: "日支同女命，沖胎元，慎用（原書：六十女總局）" });
  }
  // 沖夫星：命支＋1 之日
  if (dz === zhiAdd(fZhi, 1)) {
    if (fGan && dg === ganAdd(fGan, 3))
      out.push({ kind: "凶", text: `${info.dayGanZhi}日正沖夫星，大凶（原書：六十女總局）` });
    else out.push({ kind: "注", text: "日支沖夫星，慎用（三德逢一可解）" });
  }
  // 沖天嗣（原書嫁娶總局亦列）
  if (fGan) {
    const ts = getTianSiChong(fGan, info.dayGanZhi, dz);
    if (ts) out.push({ kind: ts.kind, text: ts.text.replace("安牀大忌", "婚事大忌") });
  }
  // 桃花（咸池）
  if (XIAN_CHI[fZhi] === dz)
    out.push({ kind: "注", text: "犯桃花（咸池），慎用（原書：四柱有堆長生、進長生可解）" });
  // 天狗
  if (dz === zhiAdd(fZhi, 10))
    out.push({ kind: "注", text: "犯天狗，慎用（原書：麟陽登貴可制）" });
  return out;
}

// ── 共同凶煞 ──────────────────────────────────────────────
// 各神煞所忌之事類
const WANG_WANG_EVENTS: EventKey[] = ["chuxing", "jiaqu", "ruzhai", "furen", "qiuming"]; // 往亡忌出行、嫁娶、移徙、上任求名
const GUI_JI_EVENTS: EventKey[] = ["chuxing", "ruzhai"]; // 歸忌忌遠行、歸家、移徙
const HONG_SHA_EVENTS: EventKey[] = ["jiaqu", "nacai"]; // 紅沙忌婚事
const SHOU_SI_EXEMPT: EventKey[] = ["anzang", "potu"]; // 受死日百事忌，惟葬事可用
const ZANG_EVENTS: EventKey[] = ["anzang", "potu"]; // 葬事：另忌重日（巳亥）
const YUE_PO_EXEMPT: EventKey[] = ["qiuyi"]; // 破日反宜求醫治病、破屋壞垣
const JI_SI_EVENTS: EventKey[] = ["jisi", "jinxiang", "kaiguang"]; // 祭祀之屬：忌寅日（彭祖）

function commonBad(info: DayInfo, event: EventKey): Reason[] {
  const s = getShenSha(info);
  const out: Reason[] = [];
  if (s.yuePo && !YUE_PO_EXEMPT.includes(event))
    out.push({ kind: "凶", text: "月破日（日支沖月建），大耗之日，諸事不宜" });
  if (s.shouSi && !SHOU_SI_EXEMPT.includes(event))
    out.push({ kind: "凶", text: "受死日，百事皆忌（惟葬事可用）" });
  if (s.siLi) out.push({ kind: "凶", text: "四離日（二分二至前一日），氣序分離，忌用事" });
  if (s.siJue) out.push({ kind: "凶", text: "四絕日（四立前一日），氣序絕滅，忌用事" });
  if (s.yangGong) out.push({ kind: "凶", text: "楊公忌日，百事忌用" });
  if (s.wangWang && WANG_WANG_EVENTS.includes(event))
    out.push({ kind: "凶", text: "往亡日，忌出行、嫁娶、移徙、上任" });
  if (s.guiJi && GUI_JI_EVENTS.includes(event))
    out.push({ kind: "凶", text: "歸忌日，忌遠行、歸家、移徙" });
  if (s.hongSha && HONG_SHA_EVENTS.includes(event))
    out.push({ kind: "凶", text: "紅沙日，婚事大忌" });
  if (ZANG_EVENTS.includes(event) && (info.dayZhi === "巳" || info.dayZhi === "亥"))
    out.push({ kind: "凶", text: "重日（巳亥日），葬事忌之，恐犯重喪" });
  return out;
}

// ── 建除評語 ──────────────────────────────────────────────
function jianChuReason(info: DayInfo, event: EventKey): Reason | null {
  const name = info.zhiXing as JianChuName;
  const jc = JIANCHU[name];
  if (!jc) return null;
  const { good, bad } = JIANCHU_BY_EVENT[event];
  if (bad.includes(name))
    return { kind: "凶", text: `${name}日（建除）：${jc.ji.includes(EVENT_NAMES[event]) ? `忌${EVENT_NAMES[event]}` : `於${EVENT_NAMES[event]}不利`}。${jc.meaning}` };
  if (good.includes(name))
    return { kind: "吉", text: `${name}日（建除）：宜${jc.yi}` };
  return { kind: "注", text: `${name}日（建除）：${jc.meaning}` };
}

// ── 通書宜忌佐證 ──────────────────────────────────────────
const EVENT_TERMS: Record<EventKey, string[]> = {
  jiaqu: ["嫁娶"],
  nacai: ["納采", "訂盟"],
  anchuang: ["安牀"],
  qiusi: ["求嗣"],
  ruzhai: ["入宅", "移徙"],
  dongtu: ["動土"],
  xiuzao: ["修造", "修造動土"],
  shangliang: ["豎柱上樑", "上樑"],
  chuxing: ["出行"],
  kaishi: ["開市"],
  liquan: ["立券", "交易", "立券交易"],
  furen: ["赴任", "上官赴任"],
  qiuming: ["入學"],
  jisi: ["祭祀"],
  jinxiang: ["祈福", "齋醮"],
  kaiguang: ["開光"],
  qiuyi: ["治病", "療病", "求醫療病"],
  anzang: ["安葬"],
  potu: ["破土"],
};

function tongShuReason(info: DayInfo, event: EventKey): Reason | null {
  const terms = EVENT_TERMS[event];
  if (info.ji.some((t) => terms.includes(t)))
    return { kind: "凶", text: `通書是日忌${EVENT_NAMES[event]}` };
  if (info.yi.some((t) => terms.includes(t)))
    return { kind: "吉", text: `通書是日宜${EVENT_NAMES[event]}` };
  return null;
}

// ── 各事評日 ──────────────────────────────────────────────
export interface EvalOptions {
  femaleBirthZhi?: string; // 女命年支（婚事用）
  femaleBirthGan?: string; // 女命年干（吉神定局用）
  birthZhi?: string; // 本命年支（沖命、破碎用）
  birthGan?: string; // 本命年干（吉神定局用）
  mountainZhi?: string; // 宅舍座山（十二支山，造作事用）
  disabledLayers?: string[]; // 停用之法度層（鍵見 RULE_LAYERS）
}

// ── 法度層（介面可取捨；預設全開） ──────────────────────
export interface RuleLayer {
  key: string;
  name: string;
  desc: string;
  events?: EventKey[]; // 缺者全事類通用
}

const HUN_EVENTS: EventKey[] = ["jiaqu", "nacai"];

export const RULE_LAYERS: RuleLayer[] = [
  { key: "yuejia", name: "月家神煞", desc: "月破、受死、往亡、歸忌、紅沙、四離四絕、楊公忌、重日" },
  { key: "jianchu", name: "建除十二神", desc: "建滿平收黑，除危定執黃，成開可用，破閉不用" },
  { key: "tongshu", name: "通書宜忌", desc: "逐日通書宜忌對照" },
  { key: "pengzu", name: "彭祖百忌", desc: "亥不行嫁、申不安牀、巳不遠行、寅不祭祀等" },
  { key: "chongming", name: "沖命破碎", desc: "日支正沖本命、破碎日（須入生年）" },
  { key: "jixiong", name: "吉凶神定局", desc: "三合、六合、堆貴、進貴、堆祿、進祿、堆馬、刑（須入生年）" },
  { key: "liyue", name: "行嫁利月", desc: "女命大利、小利、妨翁姑、妨父母、妨夫、妨婦月（論節氣）", events: ["jiaqu"] },
  { key: "zhoutang", name: "嫁娶周堂", desc: "大月起夫順行、小月起婦逆行，值夫婦大凶", events: ["jiaqu"] },
  { key: "nvming", name: "女命日吉凶", desc: "正檳榔殺、檳榔三殺、盤隔山殺、清吉取用（原書 86-89）", events: HUN_EVENTS },
  { key: "bujiang", name: "陰陽不將", desc: "不將大吉；月厭、厭對、俱將忌（原書將神名目）", events: HUN_EVENTS },
  { key: "hunsha", name: "婚神煞", desc: "沖胎元、沖夫星、沖天嗣、桃花、天狗（原書六十女總局）", events: HUN_EVENTS },
  { key: "anchuang", name: "安牀忌例", desc: "臥尸、死別、醞巢、天賊、木馬、箭頭、刀砧、天嗣犯沖（原書 109-111）", events: ["anchuang"] },
  { key: "tuwang", name: "土王用事", desc: "四立前十八日忌動土破土", events: ["dongtu", "potu"] },
  { key: "shan", name: "沖山三殺", desc: "日支沖座山、流年三殺占山（須入座山）", events: ["ruzhai", "dongtu", "xiuzao", "shangliang"] },
];

export function layersForEvent(event: EventKey): RuleLayer[] {
  return RULE_LAYERS.filter((l) => !l.events || l.events.includes(event));
}

// 造作事類（沖山、三殺以山向論——原書第六期 392-393 頁）
const ZAO_ZUO_EVENTS: EventKey[] = ["dongtu", "xiuzao", "shangliang", "ruzhai"];

// 流年三殺方（依年支三合局）：申子辰年煞南、寅午戌年煞北、巳酉丑年煞東、亥卯未年煞西
const SAN_SHA_FANG: Record<string, string[]> = {
  申: ["巳", "午", "未"], 子: ["巳", "午", "未"], 辰: ["巳", "午", "未"],
  寅: ["亥", "子", "丑"], 午: ["亥", "子", "丑"], 戌: ["亥", "子", "丑"],
  巳: ["寅", "卯", "辰"], 酉: ["寅", "卯", "辰"], 丑: ["寅", "卯", "辰"],
  亥: ["申", "酉", "戌"], 卯: ["申", "酉", "戌"], 未: ["申", "酉", "戌"],
};

function zaoZuoShan(info: DayInfo, mountainZhi: string): Reason[] {
  const out: Reason[] = [];
  if (ZHI_CHONG[mountainZhi] === info.dayZhi)
    out.push({ kind: "凶", text: `日支${info.dayZhi}沖山（宅坐${mountainZhi}山），造作忌之（原書：沖山例）` });
  const yearZhi = info.yearGanZhi.charAt(1);
  if (SAN_SHA_FANG[yearZhi]?.includes(mountainZhi))
    out.push({ kind: "凶", text: `流年${info.yearGanZhi}三殺占山（${mountainZhi}山），歲內造作大忌（原書：三殺例）` });
  return out;
}

export function evaluateDay(info: DayInfo, event: EventKey, opts: EvalOptions = {}): Evaluation {
  const reasons: Reason[] = [];
  const off = new Set(opts.disabledLayers ?? []);
  const on = (key: string) => !off.has(key);

  if (on("yuejia")) reasons.push(...commonBad(info, event));

  // 彭祖百忌（日支）
  if (on("pengzu") && event === "jiaqu" && info.dayZhi === "亥")
    reasons.push({ kind: "凶", text: "彭祖百忌：亥不行嫁，必主分張" });
  if (on("pengzu") && event === "anchuang" && info.dayZhi === "申")
    reasons.push({ kind: "凶", text: "彭祖百忌：申不安牀，鬼祟入房（原書：十二月皆忌申日）" });

  // 安牀忌例（原書 111 頁定局）
  if (event === "anchuang" && on("anchuang")) {
    for (const hit of getAnChuangJi(info)) {
      reasons.push({ kind: hit.kind, text: `${hit.name}，${hit.note}` });
    }
    // 天嗣犯沖（原書 109 頁）：以本命（新床以女命）天干推
    if (opts.birthGan) {
      const ts = getTianSiChong(opts.birthGan, info.dayGanZhi, info.dayZhi);
      if (ts) reasons.push(ts);
    }
  }
  if (on("pengzu") && event === "chuxing" && info.dayZhi === "巳")
    reasons.push({ kind: "凶", text: "彭祖百忌：巳不遠行，財物伏藏" });
  if (on("pengzu") && JI_SI_EVENTS.includes(event) && info.dayZhi === "寅")
    reasons.push({ kind: "凶", text: "彭祖百忌：寅不祭祀，神鬼不嘗" });
  if (on("pengzu") && event === "qiuyi" && info.dayZhi === "未")
    reasons.push({ kind: "凶", text: "彭祖百忌：未不服藥，毒氣入腸" });

  // 本命沖煞（婚事以女命論，餘以本命論）
  const useFemale = eventDef(event).mingInput === "female";
  const ming = useFemale ? opts.femaleBirthZhi : opts.birthZhi;
  if (ming) {
    const who = useFemale ? "女命" : "本命";
    if (on("chongming") && isChongMing(ming, info.dayZhi))
      reasons.push({ kind: "凶", text: `日支${info.dayZhi}正沖${who}${ming}，犯沖大凶` });
    // 破碎日：通書公例；嫁娶另依原書女命日吉凶表，不重複計
    if (on("chongming") && event !== "jiaqu" && isPoSui(ming, info.dayZhi))
      reasons.push({ kind: "凶", text: `破碎日（${who}${ming}見${info.dayZhi}日），忌用` });
    // 吉凶神定局（原書 59 頁起）
    if (on("jixiong")) {
      const mingGan = useFemale ? opts.femaleBirthGan : opts.birthGan;
      reasons.push(...jiXiongShen(info, mingGan, ming));
    }
  }

  // 女命十二地支日吉凶（《剋擇講義》書 86-89 頁）：婚事以女命三合局斷日
  if (on("nvming") && (event === "jiaqu" || event === "nacai") && opts.femaleBirthZhi) {
    const v = nvMingDayVerdict(opts.femaleBirthZhi, info.dayZhi);
    if (v) reasons.push(v);
  }

  // 土王用事（原書：動土平基碎金賦）：四立前十八日，忌動土破土
  if (on("tuwang") && (event === "dongtu" || event === "potu") && isTuWang(info.solar.y, info.solar.m, info.solar.d))
    reasons.push({ kind: "凶", text: "土王用事（四立前十八日，土旺），忌動土破土" });

  // 造作沖山、三殺（原書第六期）：入宅動土修造上樑，有座向則判
  if (on("shan") && ZAO_ZUO_EVENTS.includes(event) && opts.mountainZhi) {
    reasons.push(...zaoZuoShan(info, opts.mountainZhi));
  }

  // 婚神煞（原書第四期六十女總局歸納）：胎元、夫星、天嗣、桃花、天狗
  if (on("hunsha") && (event === "jiaqu" || event === "nacai") && opts.femaleBirthZhi) {
    reasons.push(...hunShenSha(info, opts.femaleBirthGan, opts.femaleBirthZhi));
  }

  // 陰陽不將（原書 211-221 頁每月將神名目）：嫁娶專用
  if (on("bujiang") && (event === "jiaqu" || event === "nacai")) {
    const js = getJiangShen(info);
    if (js === "不將")
      reasons.push({ kind: "吉", text: "陰陽不將日，嫁娶大吉（原書：將神名目）" });
    else if (js === "月厭")
      reasons.push({ kind: "凶", text: "月厭日，嫁娶大忌" });
    else if (js === "厭對")
      reasons.push({ kind: "凶", text: "厭對日（沖月厭），忌嫁娶" });
    else if (js === "俱將")
      reasons.push({ kind: "凶", text: "俱將日（干支俱將，俱妨），嫁娶忌之" });
    else if (js === "陽將")
      reasons.push({ kind: "注", text: "陽將日（妨夫），嫁娶慎用" });
    else reasons.push({ kind: "注", text: "陰將日（妨婦），嫁娶慎用" });
  }

  // 嫁娶專屬：利月（原書 205-206 頁，以月建論）、周堂（原書 207-208 頁）
  if (event === "jiaqu") {
    if (on("liyue") && opts.femaleBirthZhi) {
      const cat = jiaQuMonthCat(opts.femaleBirthZhi, info.monthZhi);
      const de = sanDe(info);
      if (cat === "大利月")
        reasons.push({ kind: "吉", text: `本月（${info.monthZhi}月建）為女命${opts.femaleBirthZhi}之大利月` });
      else if (cat === "小利月")
        reasons.push({ kind: "注", text: "本月為小利月，清吉合式可用（妨媒之說，原書斥為誣謬）" });
      else if (cat === "妨翁姑月")
        reasons.push(
          de.length > 0
            ? { kind: "注", text: `本月妨翁姑，是日得${de.join("、")}可解` }
            : { kind: "注", text: "本月妨翁姑，日無三德，新娘入門後三朝方登堂拜見翁姑" },
        );
      else if (cat === "妨父母月")
        reasons.push(
          de.length > 0
            ? { kind: "注", text: `本月妨父母，是日得${de.join("、")}可解` }
            : { kind: "注", text: "本月妨父母，日無三德，女家父母勿送新娘登轎" },
        );
      else if (cat === "妨夫月")
        reasons.push({ kind: "凶", text: "本月妨夫月，原書：不利不用" });
      else reasons.push({ kind: "凶", text: "本月妨婦月，原書：不利不用" });
    }
    const zt = on("zhoutang") ? zhouTang(info.lunarDay, info.lunarMonthDayCount) : "";
    if (zt === "") {
      // 周堂層停用
    } else if (zt === "夫" || zt === "婦")
      reasons.push({ kind: "凶", text: `嫁娶周堂值「${zt}」，原書：此日大凶，最忌不用` });
    else if (zt === "翁")
      reasons.push({ kind: "注", text: "周堂值翁，新人進門翁勿相見（無翁或從權則可用）" });
    else if (zt === "姑")
      reasons.push({ kind: "注", text: "周堂值姑，新人進門姑勿登堂（無姑或從權則可用）" });
    else if (zt === "堂")
      reasons.push({ kind: "吉", text: "周堂值堂，新人候三朝登堂，吉" });
    else if (zt === "第")
      reasons.push({ kind: "吉", text: "周堂值第（士家之第，非女弟也），吉" });
    else
      reasons.push({ kind: "注", text: `周堂值${zt}，新人進門${zt}門遮掩即可用` });
  }

  // 建除十二神
  if (on("jianchu")) {
    const jcr = jianChuReason(info, event);
    if (jcr) reasons.push(jcr);
  }

  // 通書宜忌
  if (on("tongshu")) {
    const tsr = tongShuReason(info, event);
    if (tsr) reasons.push(tsr);
  }

  // 評等：有凶即凶；無凶而有吉為吉；餘為平
  const rating: Rating = reasons.some((r) => r.kind === "凶")
    ? "凶"
    : reasons.some((r) => r.kind === "吉")
      ? "吉"
      : "平";

  return { rating, reasons };
}
