// 事類評日 — 嫁娶、安牀、出行（依《剋擇講義》起例）

import { DayInfo, ZHI_CHONG, isTuWang } from "./almanac";
import { getShenSha, getAnChuangJi, getCaiYiJi, getDongTuJi, getTianSiChong, getJiangShen, getMieMo, isPoSui, isChongMing, isSiFei } from "./shensha";
import { JIANCHU, JIANCHU_BY_EVENT, JianChuName } from "./jianchu";

export type EventKey =
  | "jiaqu" | "nacai" | "anchuang" | "qiusi" | "caiyi" | "guanji"
  | "ruzhai" | "dongtu" | "xiuzao" | "xiufang" | "shangliang" | "zuozao" | "anmen" | "chaixie" | "juejing"
  | "chuxing" | "kaishi" | "liquan" | "furen" | "qiuming" | "nacaifu" | "zaizhong" | "nachu"
  | "jisi" | "jinxiang" | "kaiguang" | "qiuyi" | "anxiang" | "jiechu"
  | "anzang" | "potu" | "qizan" | "xiufen"
  | "rulian" | "yijiu" | "chengfu" | "chufu" | "xietu" | "libei" | "kaishengfen" | "heshoumu"
  | "wenming" | "naxu" | "guining" | "jinrenkou" | "huiqinyou"
  | "yixi" | "qiji" | "gaiwu" | "chuhuo" | "zaocang" | "buyuan" | "famu"
  | "kaicang" | "zhichan" | "yunniang" | "jingluo" | "buzhuo" | "quyu"
  | "suhui" | "choushen" | "muyu" | "titou";
export type Rating = "吉" | "平" | "凶";

export const EVENT_NAMES: Record<EventKey, string> = {
  jiaqu: "嫁娶",
  nacai: "納采",
  anchuang: "安牀",
  qiusi: "求嗣",
  caiyi: "裁衣合帳",
  guanji: "冠笄",
  ruzhai: "入宅",
  dongtu: "動土",
  xiuzao: "修造",
  xiufang: "修方",
  shangliang: "豎柱上樑",
  zuozao: "作灶",
  anmen: "安門",
  chaixie: "拆卸",
  juejing: "掘井開池",
  chuxing: "出行",
  kaishi: "開市",
  liquan: "立券交易",
  furen: "赴任",
  qiuming: "求名",
  nacaifu: "納財",
  zaizhong: "栽種",
  nachu: "納畜牧養",
  jisi: "祭祀",
  jinxiang: "進香",
  kaiguang: "開光",
  anxiang: "安香",
  jiechu: "解除禳災",
  qiuyi: "求醫治病",
  anzang: "安葬",
  potu: "破土",
  qizan: "啟攢遷葬",
  xiufen: "修墳",
  rulian: "入殮",
  yijiu: "移柩",
  chengfu: "成服",
  chufu: "除服",
  xietu: "謝土",
  libei: "立碑",
  kaishengfen: "開生墳",
  heshoumu: "合壽木",
  wenming: "問名",
  naxu: "納婿",
  guining: "歸寧",
  jinrenkou: "進人口",
  huiqinyou: "會親友",
  yixi: "移徙",
  qiji: "起基定磉",
  gaiwu: "蓋屋合脊",
  chuhuo: "出火遷神",
  zaocang: "造倉庫",
  buyuan: "補垣塞穴",
  famu: "伐木",
  kaicang: "開倉出貨",
  zhichan: "置產",
  yunniang: "醞釀",
  jingluo: "經絡安機",
  buzhuo: "捕捉畋獵",
  quyu: "取漁結網",
  suhui: "塑繪",
  choushen: "酬神",
  muyu: "沐浴",
  titou: "剃頭整甲",
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
      { key: "caiyi", name: "裁衣合帳", mingInput: "self" },
      { key: "guanji", name: "冠笄", mingInput: "self" },
      { key: "wenming", name: "問名", mingInput: "female" },
      { key: "naxu", name: "納婿", mingInput: "female" },
      { key: "guining", name: "歸寧", mingInput: "self" },
      { key: "jinrenkou", name: "進人口", mingInput: "self" },
      { key: "huiqinyou", name: "會親友", mingInput: "self" },
    ],
  },
  {
    category: "居家造作",
    events: [
      { key: "ruzhai", name: "入宅", mingInput: "self" },
      { key: "dongtu", name: "動土", mingInput: "self" },
      { key: "xiuzao", name: "修造", mingInput: "self" },
      { key: "xiufang", name: "修方", mingInput: "self" },
      { key: "shangliang", name: "豎柱上樑", mingInput: "self" },
      { key: "zuozao", name: "作灶", mingInput: "self" },
      { key: "anmen", name: "安門", mingInput: "self" },
      { key: "chaixie", name: "拆卸", mingInput: "self" },
      { key: "juejing", name: "掘井開池", mingInput: "self" },
      { key: "yixi", name: "移徙", mingInput: "self" },
      { key: "qiji", name: "起基定磉", mingInput: "self" },
      { key: "gaiwu", name: "蓋屋合脊", mingInput: "self" },
      { key: "chuhuo", name: "出火遷神", mingInput: "self" },
      { key: "zaocang", name: "造倉庫", mingInput: "self" },
      { key: "buyuan", name: "補垣塞穴", mingInput: "self" },
      { key: "famu", name: "伐木", mingInput: "self" },
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
      { key: "nacaifu", name: "納財", mingInput: "self" },
      { key: "zaizhong", name: "栽種", mingInput: "self" },
      { key: "nachu", name: "納畜牧養", mingInput: "self" },
      { key: "kaicang", name: "開倉出貨", mingInput: "self" },
      { key: "zhichan", name: "置產", mingInput: "self" },
      { key: "yunniang", name: "醞釀", mingInput: "self" },
      { key: "jingluo", name: "經絡安機", mingInput: "self" },
      { key: "buzhuo", name: "捕捉畋獵", mingInput: "self" },
      { key: "quyu", name: "取漁結網", mingInput: "self" },
    ],
  },
  {
    category: "祭祀祈禳",
    events: [
      { key: "jisi", name: "祭祀", mingInput: "self" },
      { key: "jinxiang", name: "進香", mingInput: "self" },
      { key: "kaiguang", name: "開光", mingInput: "self" },
      { key: "anxiang", name: "安香", mingInput: "self" },
      { key: "jiechu", name: "解除禳災", mingInput: "self" },
      { key: "suhui", name: "塑繪", mingInput: "self" },
      { key: "choushen", name: "酬神", mingInput: "self" },
      { key: "muyu", name: "沐浴", mingInput: "self" },
      { key: "titou", name: "剃頭整甲", mingInput: "self" },
      { key: "qiuyi", name: "求醫治病", mingInput: "self" },
    ],
  },
  {
    category: "造葬",
    events: [
      { key: "potu", name: "破土", mingInput: "self" },
      { key: "anzang", name: "安葬", mingInput: "self" },
      { key: "qizan", name: "啟攢遷葬", mingInput: "self" },
      { key: "xiufen", name: "修墳", mingInput: "self" },
      { key: "rulian", name: "入殮", mingInput: "self" },
      { key: "yijiu", name: "移柩", mingInput: "self" },
      { key: "chengfu", name: "成服", mingInput: "self" },
      { key: "chufu", name: "除服", mingInput: "self" },
      { key: "xietu", name: "謝土", mingInput: "self" },
      { key: "libei", name: "立碑", mingInput: "self" },
      { key: "kaishengfen", name: "開生墳", mingInput: "self" },
      { key: "heshoumu", name: "合壽木", mingInput: "self" },
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

// ── 嫁娶周堂局（原書第四期 書136-137，瑞成清本大小月例互證） ──
// 周堂八位（順序）：夫、姑、堂、翁、第、竈、婦、廚。值夫、值婦＝大凶最忌。
// 大月（三十日）初一起「夫」順行；小月（廿九日）初一起「婦」逆行。
// 白虎值、麟符貼繫「日位」（非周堂神），大小月各自成環（小月序為大月之反）。
export type ZhouTangSlot = {
  name: string;        // 周堂神
  ji: "凶" | "吉" | "注"; // 值夫婦凶；堂第吉；翁姑竈廚注（遮掩勿登可用）
  note: string;        // 原書按語
  baihu: string;       // 白虎值（灶/堂/床/死/睡/門/路/廚）
  linfu: string;       // 麟符貼（貼X／免用）
};

// 大月例（index＝(lunarDay-1)%8）
const ZHOU_TANG_BIG: ZhouTangSlot[] = [
  { name: "夫", ji: "凶", note: "此日大凶，最忌不用", baihu: "灶", linfu: "貼灶" },
  { name: "姑", ji: "注", note: "是日姑人勿登堂（無姑或從權則吉）", baihu: "堂", linfu: "貼堂" },
  { name: "堂", ji: "吉", note: "新人候三朝登堂，吉", baihu: "床", linfu: "貼床" },
  { name: "翁", ji: "注", note: "新人進門翁勿登堂（無翁或從權則可用）", baihu: "死", linfu: "免用" },
  { name: "第", ji: "吉", note: "士家之第，非女弟也，吉", baihu: "睡", linfu: "貼床" },
  { name: "竈", ji: "注", note: "新人進門竈門遮掩即可用", baihu: "門", linfu: "貼門" },
  { name: "婦", ji: "凶", note: "此日大凶，最忌不用", baihu: "路", linfu: "貼簪" },
  { name: "廚", ji: "注", note: "新人進門竈門遮掩即可用", baihu: "廚", linfu: "貼灶" },
];

// 小月例（index＝(lunarDay-1)%8）
const ZHOU_TANG_SMALL: ZhouTangSlot[] = [
  { name: "婦", ji: "凶", note: "此日大凶，最忌不用", baihu: "廚", linfu: "貼灶" },
  { name: "竈", ji: "注", note: "新人進門竈門遮掩即可用", baihu: "路", linfu: "貼簪" },
  { name: "第", ji: "吉", note: "士家門第，非女弟也，吉", baihu: "門", linfu: "貼門" },
  { name: "翁", ji: "注", note: "是日翁人勿登堂（無翁或從權則吉）", baihu: "睡", linfu: "貼床" },
  { name: "堂", ji: "吉", note: "新人候三朝登堂，吉", baihu: "死", linfu: "免用" },
  { name: "姑", ji: "注", note: "是日姑人勿登堂（無姑或從權則吉）", baihu: "床", linfu: "貼床" },
  { name: "夫", ji: "凶", note: "此日大凶，最忌不用", baihu: "堂", linfu: "貼堂" },
  { name: "廚", ji: "注", note: "新人進門竈門遮掩即可用", baihu: "灶", linfu: "貼灶" },
];

export function jiaQuZhouTang(lunarDay: number, monthDayCount: number): ZhouTangSlot {
  const arr = monthDayCount >= 30 ? ZHOU_TANG_BIG : ZHOU_TANG_SMALL;
  return arr[(lunarDay - 1 + 800) % 8];
}

// 舊接口：僅返周堂神名（兼容既有呼叫）
export function zhouTang(lunarDay: number, monthDayCount: number): string {
  return jiaQuZhouTang(lunarDay, monthDayCount).name;
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

function jiXiongShen(info: DayInfo, mingGan: string | undefined, mingZhi: string, label = "本命"): Reason[] {
  const out: Reason[] = [];
  const dz = info.dayZhi;
  const dg = info.dayGan;
  const group = SAN_HE_GROUPS.find((g) => g.includes(mingZhi));
  if (group && group.includes(dz) && dz !== mingZhi)
    out.push({ kind: "吉", text: `日支與${label}三合（原書：吉凶神定局）` });
  if (LIU_HE[mingZhi] === dz)
    out.push({ kind: "吉", text: `日支與${label}六合（原書：吉凶神定局）` });
  if (mingGan && TIAN_YI[mingGan]?.includes(dz))
    out.push({ kind: "吉", text: `堆貴：日支為${label}天乙貴人` });
  if (TIAN_YI[dg]?.includes(mingZhi))
    out.push({ kind: "吉", text: `進貴：日干天乙貴人臨${label}` });
  if (mingGan && LU[mingGan] === dz)
    out.push({ kind: "吉", text: `堆祿：日支為${label}祿位` });
  if (LU[dg] === mingZhi)
    out.push({ kind: "吉", text: `進祿：日干祿臨${label}` });
  if (YI_MA[mingZhi] === dz)
    out.push({ kind: "吉", text: `堆馬：日支為${label}驛馬` });
  if (XING_PAIRS.some(([a, b]) => a === mingZhi && b === dz))
    out.push({ kind: "注", text: `日支刑${label}，慎用（原書：吉凶神定局列刑為忌）` });
  return out;
}

// ── 婚神煞（原書第四五期「六十女命行嫁」逐命反推，書192-309清本互證） ──
// 胎元＝食神干（命干＋2）＋命支局「胎」位（火子木酉金卯水午）→ 真胎元日大凶、沖胎元日凶
// 夫星＝正官干（剋命干異性）；夫妻宮＝命宮＋6，男女宮＝命宮＋8（命宮＝命干祿）
// 沖母腹＝沖命支日；滅子胎＝沖男女宮日（命宮＋2）；殺翁＝命支＋1、殺姑＝命支＋7
// 桃花（咸池）＝三合局沐浴位；天狗＝命支＋10；流霞＝命干表；三殺＝局歲煞
// （驗：火局甲戌、木局乙未 逐十二日各12/12全合）
const GAN_ORDER = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const ZHI_ORDER_E = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const XIAN_CHI: Record<string, string> = {
  申: "酉", 子: "酉", 辰: "酉",
  寅: "卯", 午: "卯", 戌: "卯",
  巳: "午", 酉: "午", 丑: "午",
  亥: "子", 卯: "子", 未: "子",
};

// 三合局五行（命支所屬）
function juWuXing(zhi: string): "火" | "木" | "金" | "水" {
  if ("寅午戌".includes(zhi)) return "火";
  if ("亥卯未".includes(zhi)) return "木";
  if ("巳酉丑".includes(zhi)) return "金";
  return "水"; // 申子辰
}
// 局「胎」位（局長生＋10）：火子・木酉・金卯・水午。胎元支＝命支局胎位（第四五期逐命互證：甲戌子/庚午子/乙未酉）
const JU_TAI: Record<string, string> = { 火: "子", 木: "酉", 金: "卯", 水: "午" };
// 正官（夫星干＝命之正官）：剋命干之異性干
const ZHENG_GUAN: Record<string, string> = {
  甲: "辛", 乙: "庚", 丙: "癸", 丁: "壬", 戊: "乙",
  己: "甲", 庚: "丁", 辛: "丙", 壬: "己", 癸: "戊",
};
// 流霞（命干→日支），犯之慎用
const LIU_XIA: Record<string, string> = {
  甲: "酉", 乙: "戌", 丙: "未", 丁: "申", 戊: "巳",
  己: "午", 庚: "辰", 辛: "卯", 壬: "亥", 癸: "寅",
};
// 五虎遁：年（命）干→寅月干
const WU_HU: Record<string, string> = {
  甲: "丙", 己: "丙", 乙: "戊", 庚: "戊", 丙: "庚",
  辛: "庚", 丁: "壬", 壬: "壬", 戊: "甲", 癸: "甲",
};
// 五虎遁定某干所臨之支（命干起遁，尋 targetGan 之月支）——夫星/天嗒支之由來
function wuHuZhi(mingGan: string, targetGan: string): string {
  const x = GAN_ORDER.indexOf(WU_HU[mingGan]);
  const g = GAN_ORDER.indexOf(targetGan);
  return zhiAdd("寅", ((g - x) % 10 + 10) % 10);
}
// 羊刃（命干→支）；飛刃＝沖羊刃。箭刃忌＝羊刃＋飛刃全
const YANG_REN: Record<string, string> = {
  甲: "卯", 乙: "辰", 丙: "午", 丁: "未", 戊: "午",
  己: "未", 庚: "酉", 辛: "戌", 壬: "子", 癸: "丑",
};
// 紅艷煞（命干→時支）
const HONG_YAN: Record<string, string> = {
  甲: "午", 乙: "申", 丙: "寅", 丁: "未", 戊: "辰",
  己: "辰", 庚: "戌", 辛: "酉", 壬: "子", 癸: "申",
};
// 五行長生墓／死／絕位（陽干順、陰干逆）——夫星（正官干）・天嗣（食神干）之墓死絕
const WX_MU: Record<string, string> = {
  甲: "未", 乙: "戌", 丙: "戌", 丁: "丑", 戊: "戌",
  己: "丑", 庚: "丑", 辛: "辰", 壬: "辰", 癸: "未",
};
const WX_SI: Record<string, string> = {
  甲: "午", 乙: "亥", 丙: "酉", 丁: "寅", 戊: "酉",
  己: "寅", 庚: "子", 辛: "巳", 壬: "卯", 癸: "申",
};
const WX_JUE: Record<string, string> = {
  甲: "申", 乙: "酉", 丙: "亥", 丁: "子", 戊: "亥",
  己: "子", 庚: "寅", 辛: "卯", 壬: "巳", 癸: "午",
};
// 食神干（天嗣干＝命干＋2）
const SHI_SHEN: Record<string, string> = {
  甲: "丙", 乙: "丁", 丙: "戊", 丁: "己", 戊: "庚",
  己: "辛", 庚: "壬", 辛: "癸", 壬: "甲", 癸: "乙",
};
// 命支三合局墓庫（火戌木未金丑水辰）——白虎吞胎年＝沖局墓
const JU_MU: Record<string, string> = { 火: "戌", 木: "未", 金: "丑", 水: "辰" };
// 孤辰・寡宿（命支三會→孤・寡）
function guChenGuaSu(zhi: string): { gu: string; gua: string } {
  if ("亥子丑".includes(zhi)) return { gu: "寅", gua: "戌" };
  if ("寅卯辰".includes(zhi)) return { gu: "巳", gua: "丑" };
  if ("巳午未".includes(zhi)) return { gu: "申", gua: "辰" };
  return { gu: "亥", gua: "未" }; // 申酉戌
}

function zhiAdd(zhi: string, n: number): string {
  return ZHI_ORDER_E[(ZHI_ORDER_E.indexOf(zhi) + n + 120) % 12];
}
function ganAdd(gan: string, n: number): string {
  return GAN_ORDER[(GAN_ORDER.indexOf(gan) + n + 100) % 10];
}

// ── 命宮盤（原書 108 頁）：命宮＝女命干祿位，逆行七位夫妻宮、五位男女宮 ──
// 沖夫妻宮日＝祿支日；沖男女宮日（犯滅子胎）＝祿支＋2 之日
// 例證：甲女命宮寅、夫妻宮申、男女宮戌（原書 108）；甲子女寅日沖夫宮、
// 辰日滅子胎（總局 250）；己亥女午日沖夫宮（總局 322）
const LU_GONG: Record<string, string> = {
  甲: "寅", 乙: "卯", 丙: "巳", 戊: "巳", 丁: "午", 己: "午",
  庚: "申", 辛: "酉", 壬: "亥", 癸: "子",
};

function gongChong(fGan: string, dayZhi: string): Reason[] {
  const lu = LU_GONG[fGan];
  if (!lu) return [];
  const out: Reason[] = [];
  if (dayZhi === lu)
    out.push({ kind: "凶", text: "日支沖夫妻宮（原書：命宮盤），忌用" });
  if (dayZhi === zhiAdd(lu, 2))
    out.push({ kind: "凶", text: "日支沖男女宮，犯滅子胎（原書 108 頁），忌用" });
  return out;
}

function hunShenSha(info: DayInfo, fGan: string | undefined, fZhi: string): Reason[] {
  const out: Reason[] = [];
  const dz = info.dayZhi;
  const dg = info.dayGan;
  // 胎元（原書第四五期逐命：胎元干＝命食神干＋2、支＝命支局胎位；真胎元日大凶、胎元日慎、沖胎元日凶）
  if (fGan) {
    const taiZhi = JU_TAI[juWuXing(fZhi)];
    const taiGZ = ganAdd(fGan, 2) + taiZhi;
    if (info.dayGanZhi === taiGZ)
      out.push({ kind: "凶", text: `${taiGZ}日真胎元，大凶（原書：六十女總局）` });
    else if (dz === taiZhi)
      out.push({ kind: "注", text: `日臨胎元（胎元${taiGZ}），慎用——忌真胎元日（原書：六十女總局）` });
    if (dz === zhiAdd(taiZhi, 6))
      out.push({ kind: "凶", text: "日支沖胎元，忌用（原書：六十女總局）" });
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
  // 殺翁＝命支＋1 之日、殺姑＝命支＋7 之日（六十女總局細註歸納：
  // 甲子女翁丑姑未、乙丑女翁寅姑申、丙寅女翁卯姑酉、庚午女翁未姑丑，四驗皆合）
  if (dz === zhiAdd(fZhi, 1))
    out.push({ kind: "注", text: "犯殺翁——家有翁者忌：三德逢一可解，無德則新娘進門時翁少避；無翁不忌（原書：六十女總局）" });
  if (dz === zhiAdd(fZhi, 7))
    out.push({ kind: "注", text: "犯殺姑——家有姑者忌：三德逢一可解，無德則新娘進門時姑少避；無姑不忌（原書：六十女總局）" });
  // 桃花（咸池）
  if (XIAN_CHI[fZhi] === dz)
    out.push({ kind: "注", text: "犯桃花（咸池），慎用（原書：四柱有堆長生、進長生可解）" });
  // 天狗
  if (dz === zhiAdd(fZhi, 10))
    out.push({ kind: "注", text: "犯天狗，慎用（原書：麟陽登貴可制）" });
  // 流霞（命干→日支）
  if (fGan && LIU_XIA[fGan] === dz)
    out.push({ kind: "注", text: "犯流霞，慎用（原書：六十女總局）" });
  // 沖母腹（沖命支之日；別於沖男女宮之滅子胎）——第四五期逐命：甲戌辰/乙未丑
  if (dz === zhiAdd(fZhi, 6))
    out.push({ kind: "凶", text: "日支沖命，犯沖母腹，忌用（原書：六十女總局）" });
  // ── 墓煞層（第四五期左頁 per命忌支；甲戌·庚午·乙未三命反推）──
  // 夫星墓／死／絕＝正官干五行（陽順陰逆）之墓／死／絕；天嗣墓／死／絕＝食神干同理
  if (fGan) {
    const guan = ZHENG_GUAN[fGan];
    const si = SHI_SHEN[fGan];
    if (dz === WX_MU[guan]) out.push({ kind: "注", text: "犯夫星墓，慎用（原書：六十女總局左局）" });
    else if (dz === WX_SI[guan]) out.push({ kind: "注", text: "犯夫星死，慎用（原書：六十女總局左局）" });
    else if (dz === WX_JUE[guan]) out.push({ kind: "注", text: "犯夫星絕，慎用（原書：六十女總局左局）" });
    if (dz === WX_MU[si]) out.push({ kind: "注", text: "犯天嗣墓，慎用（原書：六十女總局左局）" });
    else if (dz === WX_SI[si]) out.push({ kind: "注", text: "犯天嗣死，慎用（原書：六十女總局左局）" });
    else if (dz === WX_JUE[si]) out.push({ kind: "注", text: "犯天嗣絕，慎用（原書：六十女總局左局）" });
  }
  // 孤辰・寡宿
  const { gu, gua } = guChenGuaSu(fZhi);
  if (dz === gu) out.push({ kind: "注", text: "犯孤辰，慎用（原書：六十女總局左局）" });
  if (dz === gua) out.push({ kind: "注", text: "犯寡宿，慎用（原書：六十女總局左局）" });
  // 箭刃（羊刃＋飛刃全）
  if (fGan && (dz === YANG_REN[fGan] || dz === zhiAdd(YANG_REN[fGan], 6)))
    out.push({ kind: "注", text: "犯箭刃，慎用（原書：六十女總局左局）" });
  // 反目煞（命支±3全）
  if (dz === zhiAdd(fZhi, 3) || dz === zhiAdd(fZhi, -3))
    out.push({ kind: "注", text: "犯反目煞，慎用（原書：六十女總局左局）" });
  // 河上翁煞（＝咸池位，同桃花支——另名並列）
  if (XIAN_CHI[fZhi] === dz)
    out.push({ kind: "注", text: "犯河上翁煞（與桃花同位），慎用（原書：六十女總局左局）" });
  // 白虎吞胎（年支＝沖命局墓）——四局全證：火辰木丑金未水戌
  if (info.yearGanZhi.charAt(1) === zhiAdd(JU_MU[juWuXing(fZhi)], 6))
    out.push({ kind: "注", text: "本年白虎吞胎（原書：六十女總局左局），婚事慎之" });
  // 四柱六神吉凶（頭欄）：日干與命干異陰陽為吉、同陰陽為凶（偏神：比食偏殺梟）
  // 甲戌命驗：丙庚壬（陽）凶・己辛癸（陰）吉；乙丑命驗：甲庚（陽）吉・乙（陰）凶
  if (fGan && GAN_ORDER.indexOf(fGan) % 2 === GAN_ORDER.indexOf(dg) % 2)
    out.push({ kind: "注", text: "日干與女命同陰陽（四柱六神值偏神），力弱慎用（原書：六十女總局頭欄）" });
  // 命宮盤沖（原書 108 頁）
  if (fGan) out.push(...gongChong(fGan, dz));
  // 紅鸞、天喜（原書 196 頁；註引會海：天喜乃血光之神，紅鸞非吉曜，逢吉神則吉、凶神則凶）
  const hongLuan = ZHI_ORDER_E[((3 - ZHI_ORDER_E.indexOf(fZhi)) % 12 + 12) % 12];
  if (dz === hongLuan)
    out.push({ kind: "注", text: "紅鸞日——原書：紅鸞非吉曜之物，逢吉神則吉、凶神則凶，並參餘法" });
  if (dz === ZHI_CHONG[hongLuan])
    out.push({ kind: "注", text: "天喜日——原書：天喜乃血光之神，逢吉神則吉、凶神則凶，並參餘法" });
  return out;
}

// ── 伐木架馬做梁忌例（原書第六期書326-327，per月/季 定局） ──
const MONTH_ORDER_E = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
// 季（0春1夏2秋3冬）
const LU_BAN_JI = ["子", "卯", "午", "酉"]; // 魯班殺：春子夏卯秋午冬酉
const FU_SHA_JI = ["辰", "未", "戌", "丑"]; // 斧殺：春辰夏未秋戌冬丑
const DAO_ZHEN_FM = ["亥", "寅", "巳", "申"]; // 刀砧（伐木表）：春亥夏寅秋巳冬申
const TIAN_HUO_ZL = ["子", "酉", "午", "卯"]; // 天火做梁：月序%4
const LONG_HU = ["巳", "亥", "午", "子", "未", "丑", "申", "寅", "酉", "卯", "戌", "辰"]; // 龍虎
const SHAN_GE = ["未", "巳", "卯", "酉", "亥", "丑"]; // 山隔：月序%6
const MU_MA_FM = ["巳", "未", "酉", "申", "戌", "子", "亥", "丑", "卯", "寅", "辰", "午"]; // 木馬架馬
const TIAN_ZEI_FM = ["辰", "酉", "寅", "未", "子", "巳", "戌", "卯", "申", "丑", "午", "亥"]; // 天賊

function famuJi(info: DayInfo): Reason[] {
  const out: Reason[] = [];
  const i = MONTH_ORDER_E.indexOf(info.monthZhi);
  if (i < 0) return out;
  const ji = Math.floor(i / 3);
  const dz = info.dayZhi;
  if (dz === LU_BAN_JI[ji]) out.push({ kind: "凶", text: "魯班殺日，伐木架馬做梁大凶不用（原書第六期書326）" });
  if (dz === FU_SHA_JI[ji]) out.push({ kind: "凶", text: "斧殺日，伐木架馬大凶不用（原書第六期書326）" });
  if (dz === DAO_ZHEN_FM[ji]) out.push({ kind: "凶", text: "刀砧殺日，伐木架馬大凶不用（原書第六期書326）" });
  if (dz === MU_MA_FM[i]) out.push({ kind: "凶", text: "木馬殺日，架馬不用（原書第六期書326）" });
  if (dz === TIAN_HUO_ZL[i % 4]) out.push({ kind: "凶", text: "天火日，做梁不用（原書第六期書326）" });
  if (dz === TIAN_ZEI_FM[i]) out.push({ kind: "注", text: "天賊日，伐木忌之，宿時（得明星）或蔞時制之則吉（原書第六期書326）" });
  if (dz === LONG_HU[i]) out.push({ kind: "注", text: "龍虎日，入山伐木忌之，吉多可用（原書第六期書327）" });
  if (dz === SHAN_GE[i % 6]) out.push({ kind: "注", text: "山隔日，入山伐木忌之，吉多可用（原書第六期書327）" });
  return out;
}

// ── 入宅、安香周堂（原書第七期 459-460 頁，大小月圈點互證） ──
// 入宅周堂十六位環（大月初一起首位順行、小月初一起「王」位逆行）；
// 凶位恆為第 4、6、10、14、16（健？亡歸？離？刑——名有漫漶處，圈點兩表互證無誤）
const RUZHAI_ZT = ["清", "遮", "陽", "健", "盛", "亡", "福", "麗", "福", "歸", "武", "民", "王", "離", "財", "刑"];
const RUZHAI_BAD = new Set([3, 5, 9, 13, 15]);

function ruZhaiZhouTang(lunarDay: number, monthDayCount: number): { name: string; bad: boolean } {
  const idx =
    monthDayCount >= 30
      ? (lunarDay - 1) % 16
      : (((12 - (lunarDay - 1)) % 16) + 16) % 16;
  return { name: RUZHAI_ZT[idx], bad: RUZHAI_BAD.has(idx) };
}

// 安香周堂八位環：安利天害殺富師災（害殺災凶）；大月初一起安順行、小月初一起天逆行
const ANXIANG_ZT = ["安", "利", "天", "害", "殺", "富", "師", "災"];
const ANXIANG_BAD = new Set(["害", "殺", "災"]);

function anXiangZhouTang(lunarDay: number, monthDayCount: number): { name: string; bad: boolean } {
  const idx =
    monthDayCount >= 30
      ? (lunarDay - 1) % 8
      : (((2 - (lunarDay - 1)) % 8) + 8) % 8;
  const name = ANXIANG_ZT[idx];
  return { name, bad: ANXIANG_BAD.has(name) };
}

// ── 開市周堂（原書第七期，PDF 298 圈點兩例互證） ──────────
// 八位環：發相・自如・債木（凶）・財帛・囷旺・爭訟（凶）・平等・福慶
// 大月初一起發相順行；小月初一起財帛逆行
const KAISHI_ZT = ["發相", "自如", "債木", "財帛", "囷旺", "爭訟", "平等", "福慶"];
const KAISHI_BAD = new Set(["債木", "爭訟"]);

function kaiShiZhouTang(lunarDay: number, monthDayCount: number): { name: string; bad: boolean } {
  const idx =
    monthDayCount >= 30
      ? (lunarDay - 1) % 8
      : (((3 - (lunarDay - 1)) % 8) + 8) % 8;
  const name = KAISHI_ZT[idx];
  return { name, bad: KAISHI_BAD.has(name) };
}

// ── 共同凶煞 ──────────────────────────────────────────────
// 各神煞所忌之事類
const WANG_WANG_EVENTS: EventKey[] = ["chuxing", "jiaqu", "ruzhai", "furen", "qiuming", "yixi", "guining"]; // 往亡忌出行、嫁娶、移徙、上任求名
const JUE_YAN_EVENTS: EventKey[] = ["ruzhai", "yixi", "zuozao", "chuhuo", "anxiang"]; // 絕煙火忌入宅、移徙、作灶、出火、安香
const GUI_JI_EVENTS: EventKey[] = ["chuxing", "ruzhai", "yixi", "guining"]; // 歸忌忌遠行、歸家、移徙
const HONG_SHA_EVENTS: EventKey[] = ["jiaqu", "nacai", "wenming", "naxu"]; // 紅沙忌婚事
const SHOU_SI_EXEMPT: EventKey[] = ["anzang", "potu", "qizan", "rulian", "yijiu"]; // 受死日百事忌，惟葬事可用
const ZANG_EVENTS: EventKey[] = ["anzang", "potu", "qizan", "xiufen", "rulian", "yijiu", "libei", "kaishengfen"]; // 葬事：另忌重日（巳亥）
// 三喪日所忌事類：原書入殮忌例、成服除服忌例、動土忌例三表均列「三喪日 犯是不用」，
// 又安葬日家凶神占記訣「重日重喪並三喪」——故葬事全類與成服除服、動土皆忌
const SAN_SANG_EVENTS: EventKey[] = [...ZANG_EVENTS, "chengfu", "chufu", "dongtu"];
// 三喪日（原書第八期入殮／成服除服／動土忌例逐月表）：四季之殺——
// 正二三月辰日、四五六月未日、七八九月戌日、十至十二月丑日（表以月建為次）
const SAN_SANG_DAY: Record<string, string> = {
  寅: "辰", 卯: "辰", 辰: "辰",
  巳: "未", 午: "未", 未: "未",
  申: "戌", 酉: "戌", 戌: "戌",
  亥: "丑", 子: "丑", 丑: "丑",
};
const YUE_PO_EXEMPT: EventKey[] = ["qiuyi", "chaixie"]; // 破日反宜求醫治病、破屋壞垣（拆卸）
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
  if (s.yueJi) out.push({ kind: "注", text: "月忌日（初五、十四、廿三），俗忌百事，吉多可用（原書第六期書329）" });
  if (s.jueYanHuo && JUE_YAN_EVENTS.includes(event))
    out.push({ kind: "凶", text: "絕煙火日，忌入宅、移徙、作灶、出火（原書第六期書324・329 避宅出火忌例）" });
  if (s.wangWang && WANG_WANG_EVENTS.includes(event))
    out.push({ kind: "凶", text: "往亡日，忌出行、嫁娶、移徙、上任" });
  if (s.guiJi && GUI_JI_EVENTS.includes(event))
    out.push({ kind: "凶", text: "歸忌日，忌遠行、歸家、移徙" });
  if (s.hongSha && HONG_SHA_EVENTS.includes(event))
    out.push({ kind: "凶", text: "紅沙日，婚事大忌" });
  if (ZANG_EVENTS.includes(event) && (info.dayZhi === "巳" || info.dayZhi === "亥"))
    out.push({ kind: "凶", text: "重日（巳亥日），葬事忌之，恐犯重喪" });
  if (ZANG_EVENTS.includes(event) && CHONG_SANG[info.monthZhi] === info.dayGan)
    out.push({ kind: "凶", text: `重喪日（${info.monthZhi}月${info.dayGan}日），葬事大忌（原書：安葬日家凶神訣）` });
  if (SAN_SANG_EVENTS.includes(event) && SAN_SANG_DAY[info.monthZhi] === info.dayZhi)
    out.push({ kind: "凶", text: `三喪日（四季之殺：春辰、夏未、秋戌、冬丑），喪葬動土犯是不用（原書：入殮成服動土忌例）` });
  if (SAN_SANG_EVENTS.includes(event) && FU_RI[info.monthZhi] === info.dayGan && CHONG_SANG[info.monthZhi] !== info.dayGan)
    out.push({ kind: "凶", text: `復日（${info.monthZhi}月${info.dayGan}日），喪葬忌之，恐致重喪（原書：安葬入殮成服忌例）` });
  if (event === "anzang") {
    if (JI_YUE.includes(info.monthZhi) && info.dayZhi === "丑")
      out.push({ kind: "凶", text: "正紅紗（季月丑日），安葬忌之（原書：安葬忌例）" });
    if (info.lunarDay === 17)
      out.push({ kind: "凶", text: "橫天朱雀（每月十七日），忌安葬（原書：安葬忌例）" });
    // 安葬忌例表另有「開星日」欄（月支進十）——即建除開日，建除層已判，不重出
    const mm = getMieMo(info);
    if (mm)
      out.push({ kind: "凶", text: `真滅沒日（${mm}），大忌勿用（原書：日家凶神）` });
  }
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
  caiyi: ["裁衣", "合帳", "裁衣合帳"],
  guanji: ["冠笄"],
  ruzhai: ["入宅"],
  dongtu: ["動土"],
  xiuzao: ["修造", "修造動土"],
  xiufang: ["修方", "修營"],
  shangliang: ["豎柱上樑", "上樑"],
  zuozao: ["作灶"],
  anmen: ["安門"],
  chaixie: ["拆卸"],
  juejing: ["掘井", "開池", "開渠", "穿井"],
  chuxing: ["出行"],
  kaishi: ["開市"],
  liquan: ["立券", "交易", "立券交易"],
  furen: ["赴任", "上官赴任"],
  qiuming: ["入學"],
  nacaifu: ["納財"],
  zaizhong: ["栽種"],
  nachu: ["納畜", "牧養"],
  jisi: ["祭祀"],
  jinxiang: ["祈福", "齋醮"],
  kaiguang: ["開光"],
  anxiang: ["安香"],
  jiechu: ["解除", "掃舍宇"],
  qiuyi: ["治病", "療病", "求醫療病"],
  anzang: ["安葬"],
  potu: ["破土"],
  qizan: ["啟攢"],
  xiufen: ["修墳", "修墓"],
  rulian: ["入殮"],
  yijiu: ["移柩"],
  chengfu: ["成服"],
  chufu: ["除服"],
  xietu: ["謝土"],
  libei: ["立碑"],
  kaishengfen: ["開生墳"],
  heshoumu: ["合壽木"],
  wenming: ["問名"],
  naxu: ["納婿"],
  guining: ["歸寧"],
  jinrenkou: ["進人口"],
  huiqinyou: ["會親友"],
  yixi: ["移徙"],
  qiji: ["起基", "定磉"],
  gaiwu: ["蓋屋", "合脊", "蓋屋合脊"],
  chuhuo: ["出火"],
  zaocang: ["造倉"],
  buyuan: ["補垣", "塞穴"],
  famu: ["伐木"],
  kaicang: ["開倉", "出貨財"],
  zhichan: ["置產"],
  yunniang: ["醞釀"],
  jingluo: ["經絡"],
  buzhuo: ["捕捉", "畋獵"],
  quyu: ["取漁", "結網"],
  suhui: ["塑繪"],
  choushen: ["酬神"],
  muyu: ["沐浴"],
  titou: ["剃頭", "整手足甲"],
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
export interface MingPerson {
  year?: number; // 西元生年（標示用）
  zhi: string; // 年支
  gan?: string; // 年干
}

export interface EvalOptions {
  femaleBirthZhi?: string; // 女命年支（婚事用）
  femaleBirthGan?: string; // 女命年干（吉神定局用）
  birthZhi?: string; // 本命年支（沖命、破碎用；多命時為首命）
  birthGan?: string; // 本命年干（吉神定局用；多命時為首命）
  persons?: MingPerson[]; // 多命合參（如開市數東家、婚事乾造），逐命判沖破吉凶
  xianMingZhi?: string; // 仙命（亡者）年支——葬事用
  xianMingGan?: string; // 仙命年干
  femaleBirthMonth?: number; // 女命生月（1-12，以節氣為界——陰胎用，原書 107）
  birthMonth?: number; // 本命（乾造）生月——陽氣用
  mountainZhi?: string; // 宅舍座山（十二支山，造作事用）
  jianXiang?: string; // 兼向——座山所兼之鄰山（原書 394-395 沖兼、三殺七山用，可缺）
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
  { key: "yuejia", name: "月家神煞", desc: "月破、受死、往亡、歸忌、紅沙、四離四絕、楊公忌、月忌、絕煙火、重日、重喪、三喪" },
  { key: "jianchu", name: "建除十二神", desc: "建滿平收黑，除危定執黃，成開可用，破閉不用" },
  { key: "tongshu", name: "通書宜忌", desc: "逐日通書宜忌對照" },
  { key: "pengzu", name: "彭祖百忌", desc: "亥不行嫁、申不安牀、巳不遠行、寅不祭祀等" },
  { key: "chongming", name: "沖命破碎", desc: "日支正沖本命、破碎日（須入生年）" },
  { key: "jixiong", name: "吉凶神定局", desc: "三合、六合、堆貴、進貴、堆祿、進祿、堆馬、刑（須入生年）" },
  { key: "liyue", name: "行嫁利月", desc: "女命大利、小利、妨翁姑、妨父母、妨夫、妨婦月（論節氣）", events: ["jiaqu"] },
  { key: "zhoutang", name: "嫁娶周堂", desc: "大月起夫順行、小月起婦逆行，值夫婦大凶", events: ["jiaqu"] },
  { key: "nvming", name: "女命日吉凶", desc: "正檳榔殺、檳榔三殺、盤隔山殺、清吉取用（原書 86-89）", events: HUN_EVENTS },
  { key: "bujiang", name: "陰陽不將", desc: "不將大吉；月厭、厭對、俱將忌（原書將神名目）", events: HUN_EVENTS },
  { key: "hunsha", name: "婚神煞", desc: "沖胎元、沖夫星、沖天嗣、殺翁殺姑、桃花、天狗（原書六十女總局）", events: HUN_EVENTS },
  { key: "caiyiji", name: "裁衣忌例", desc: "長星、短星、天賊、白虎、朱雀、正四廢（原書 92-93）", events: ["caiyi"] },
  { key: "anchuang", name: "安牀忌例", desc: "臥尸、死別、醞巢、天賊、木馬、箭頭、刀砧、天嗣犯沖（原書 109-111）", events: ["anchuang"] },
  { key: "tuwang", name: "土王用事", desc: "四立前十八日忌動土破土穿井修墳", events: ["dongtu", "potu", "juejing", "xiufen", "kaishengfen", "qiji"] },
  { key: "shan", name: "沖山三殺", desc: "日支沖座山、流年三殺占山（須入座山；造葬以墓之坐山論）", events: ["ruzhai", "dongtu", "xiuzao", "xiufang", "shangliang", "anzang", "potu", "qizan", "xiufen", "juejing", "zuozao", "anmen", "libei", "kaishengfen", "xietu", "yixi", "qiji", "gaiwu"] },
  { key: "dongtuji", name: "動土忌例", desc: "土符、土瘟、天瘟、重日、白虎朱雀、土公死忌、黃帝死（原書 548・第六期333）", events: ["dongtu"] },
  { key: "famuji", name: "伐木架馬做梁忌例", desc: "魯班殺、斧殺、刀砧、木馬、天火做梁、天賊、龍虎、山隔（原書第六期326-327）", events: ["famu"] },
  { key: "zhengong", name: "震宮殺", desc: "飛宮月家殺：八節起宮、五虎遁至呼聲泊宮，殺宮三山忌上樑（須入座山；原書第九期）", events: ["shangliang"] },
  { key: "dayuejian", name: "大月建", desc: "飛宮月家殺：年支起宮、逆佈九宮至本月建，其三山大忌修方修造修灶（須入座山；原書第九期。訣註：凡別事不忌）", events: ["xiufang", "zuozao", "xiuzao"] },
  { key: "zhaizhou", name: "入宅安香周堂", desc: "十六位／八位周堂環，值凶位忌；出火同忌二分二至（原書 459-460）", events: ["ruzhai", "anxiang", "chuhuo"] },
  { key: "kaishizhou", name: "開市周堂", desc: "八位環：債木、爭訟值日忌（原書第七期圈點）", events: ["kaishi"] },
  { key: "yanqin", name: "演禽宿曜", desc: "廿八宿值日吉凶（通行值日歌，非講義——原書 110 註者於宿忌持譏，故預設關）：吉宿十四凶宿十四；角宿忌葬、鬼宿反宜葬", events: undefined },
  { key: "doushou", name: "斗首化曜", desc: "山斗首五行對年月日干化氣：元辰廉子武財吉、貪官破鬼忌（爐傳斗首，非講義——原書七層斗首註云今已不用）。須入座山，預設關", events: ["ruzhai", "dongtu", "xiuzao", "xiufang", "shangliang", "anzang", "potu", "qizan", "xiufen", "juejing", "zuozao", "anmen", "libei", "kaishengfen", "xietu", "yixi", "qiji", "gaiwu"] },
  { key: "shashi", name: "殺師日", desc: "地師登山之忌（通書俗傳口訣：春辰戌、夏卯酉、秋丑未、冬子午；派別有異，非講義出）——預設關，主事地師者自開", events: ["anzang", "potu", "qizan", "xiufen", "kaishengfen", "dongtu", "qiji", "libei"] },
  { key: "zuotaisui", name: "坐太歲", desc: "山即流年之方，注「可坐不可向」——不忌此說者可停用", events: ["ruzhai", "dongtu", "xiuzao", "xiufang", "shangliang", "anzang", "potu", "qizan", "xiufen", "juejing", "zuozao", "anmen", "libei", "kaishengfen", "xietu", "yixi", "qiji", "gaiwu"] },
  { key: "xianming", name: "仙命諸忌", desc: "日沖仙命、三殺、三刑、旬空（須入亡者生年——原書第八期）", events: ["anzang", "potu", "qizan", "xiufen", "rulian", "yijiu", "libei", "kaishengfen"] },
  { key: "bazuo", name: "八座劍鋒", desc: "年家八座日勿用；八座方、劍鋒方占山制化權用（原書第八期安葬凶神年支表）", events: ["anzang", "potu", "qizan", "xiufen", "rulian", "yijiu", "libei", "kaishengfen"] },
  { key: "diya", name: "地啞年例", desc: "流年逐月地啞日（八日一週期），俗以制重喪三喪之屬（原書第八期）", events: ["anzang", "potu", "qizan", "xiufen", "rulian", "yijiu", "libei", "kaishengfen", "chengfu", "chufu", "dongtu"] },
  { key: "dikong", name: "地空年例", desc: "流年逐月地空亡日（八日一週期），空亡凶日，金火日或三合可制（原書第八期，瑞成本 418-419）", events: ["anzang", "potu", "qizan", "xiufen", "rulian", "yijiu", "libei", "kaishengfen"] },
  { key: "nianke", name: "年剋山家", desc: "山運納音（山之洪範五行墓庫、年干庫運遁）；年月日納音剋山運則忌，柱中生扶可制（須入座山；原書第十期造葬廿四山總局，瑞成本 487-535）", events: ["ruzhai", "dongtu", "xiuzao", "xiufang", "shangliang", "anzang", "potu", "qizan", "xiufen", "juejing", "zuozao", "anmen", "libei", "kaishengfen", "xietu", "yixi", "qiji", "gaiwu"] },
  { key: "huitou", name: "回頭貢殺箭刃", desc: "辰戌丑未命遇四柱三合全局殺之（不能制化）；命干箭刃雙全（原書 56-57，須入生年）" },
];

export function layersForEvent(event: EventKey): RuleLayer[] {
  return RULE_LAYERS.filter((l) => !l.events || l.events.includes(event));
}

// 預設關之層（開啟以 "enable:鍵" 存於同一取捨列）
export const DEFAULT_OFF_LAYERS = ["shashi", "doushou", "yanqin"];

export function isLayerOn(key: string, offList: string[]): boolean {
  return DEFAULT_OFF_LAYERS.includes(key)
    ? offList.includes("enable:" + key)
    : !offList.includes(key);
}

// 造作造葬事類（沖山、三殺以山向論——原書第六期 392-393 頁，
// 註：「利用甚廣，如豎造、入宅、安葬、修墳、造廟」）
const ZAO_ZUO_EVENTS: EventKey[] = ["dongtu", "xiuzao", "xiufang", "shangliang", "ruzhai", "anzang", "potu", "qizan", "xiufen", "juejing", "zuozao", "anmen", "libei", "kaishengfen", "xietu", "yixi", "qiji", "gaiwu"];

// 流年三殺方（依年支三合局）：申子辰年煞南、寅午戌年煞北、巳酉丑年煞東、亥卯未年煞西
// （時課亦用之——原書 394 三殺例：「四柱中任何一字」成殺方，故輸出）
export const SAN_SHA_FANG: Record<string, string[]> = {
  申: ["巳", "午", "未"], 子: ["巳", "午", "未"], 辰: ["巳", "午", "未"],
  寅: ["亥", "子", "丑"], 午: ["亥", "子", "丑"], 戌: ["亥", "子", "丑"],
  巳: ["寅", "卯", "辰"], 酉: ["寅", "卯", "辰"], 丑: ["寅", "卯", "辰"],
  亥: ["申", "酉", "戌"], 卯: ["申", "酉", "戌"], 未: ["申", "酉", "戌"],
};

// 麒麟星方（原書第四期 160 頁「麒麟星方」，瑞成本）：逐節麟星占宮，六陽支循環。
// 立春戌、驚蟄子、清明寅、立夏辰、芒種午、小暑申、立秋戌……（(10＋2·(月建支−寅))mod12）。
// 麟星到方為吉，貼麒麟符於此方可制火星日（原書 92-93 火星日符制）。以月建（節氣月支）取節。
// 十二節與原表全合。
export function qiLinFang(monthZhi: string): string {
  const i = ZHI_ORDER_E.indexOf(monthZhi);
  if (i < 0) return "";
  return ZHI_ORDER_E[(10 + 2 * (((i - 2) % 12 + 12) % 12)) % 12];
}

// 麟星占宮之照限、合限、天狗（原書 161 頁「麟星到宮」表）：皆以麟星宮推——
// 天狗到宮＝沖麟星（凶方）；照限＝麟星三合局其餘二支（吉照）；合限＝麟星六合（吉照）；
// 白虎占宮＝麟星本宮（麟星制之故不另忌）。子例：麟星子→白虎子・天狗午・照限申辰・合限丑，全合原表。
const SAN_HE: Record<string, string[]> = {
  申: ["子", "辰"], 子: ["申", "辰"], 辰: ["申", "子"],
  寅: ["午", "戌"], 午: ["寅", "戌"], 戌: ["寅", "午"],
  巳: ["酉", "丑"], 酉: ["巳", "丑"], 丑: ["巳", "酉"],
  亥: ["卯", "未"], 卯: ["亥", "未"], 未: ["亥", "卯"],
};
export function qiLinFangDetail(monthZhi: string): { ji: string; tianGou: string; zhaoXian: string[]; heXian: string } | null {
  const ji = qiLinFang(monthZhi);
  if (!ji) return null;
  return {
    ji,
    tianGou: ZHI_CHONG[ji] ?? "",       // 天狗＝沖麟星（凶方）
    zhaoXian: SAN_HE[ji] ?? [],         // 照限＝三合其餘二支（吉照）
    heXian: LIU_HE[ji] ?? "",           // 合限＝六合（吉照）
  };
}

// 廿四山：十二支山＋八干山＋四卦山（原書沖山例遍列之）
export const MOUNTAINS_24 = [
  "壬", "子", "癸", "丑", "艮", "寅", "甲", "卯", "乙", "辰", "巽", "巳",
  "丙", "午", "丁", "未", "坤", "申", "庚", "酉", "辛", "戌", "乾", "亥",
];

// 廿四山正體五行（原書 397 正體五行例：亥壬子癸大江水，寅甲卯乙巽木宮，
// 巳丙午丁皆屬火，申庚酉辛乾金逢，辰戌丑未艮坤土，此是五行老祖宗）
export const MOUNTAIN_WX: Record<string, string> = {
  亥: "水", 壬: "水", 子: "水", 癸: "水",
  寅: "木", 甲: "木", 卯: "木", 乙: "木", 巽: "木",
  巳: "火", 丙: "火", 午: "火", 丁: "火",
  申: "金", 庚: "金", 酉: "金", 辛: "金", 乾: "金",
  辰: "土", 戌: "土", 丑: "土", 未: "土", 艮: "土", 坤: "土",
};
// 干山之沖（四柱有此干謂之沖山——原書 392 沖山例；日課以日干論，時課以時干論）
export const GAN_SHAN_CHONG: Record<string, string> = {
  甲: "庚", 庚: "甲", 乙: "辛", 辛: "乙", 丙: "壬", 壬: "丙", 丁: "癸", 癸: "丁",
};
// 卦山之沖：對宮卦所轄二支（乾戌亥↔巽辰巳、坤未申↔艮丑寅）
export const GUA_SHAN_CHONG: Record<string, string[]> = {
  乾: ["辰", "巳"], 巽: ["戌", "亥"], 坤: ["丑", "寅"], 艮: ["未", "申"],
};
// 干山所附方位組（三殺占方用）：甲乙東（寅卯辰）、丙丁南、庚辛西、壬癸北
export const GAN_SHAN_FANG: Record<string, string[]> = {
  甲: ["寅", "卯", "辰"], 乙: ["寅", "卯", "辰"],
  丙: ["巳", "午", "未"], 丁: ["巳", "午", "未"],
  庚: ["申", "酉", "戌"], 辛: ["申", "酉", "戌"],
  壬: ["亥", "子", "丑"], 癸: ["亥", "子", "丑"],
};

// 演禽——廿八宿值日吉凶（通行值日歌，非講義；原書 110 謬例宜關註者持譏，故預設關）
const XIU_QIN: Record<string, string> = {
  角: "角木蛟", 亢: "亢金龍", 氐: "氐土貉", 房: "房日兔", 心: "心月狐", 尾: "尾火虎", 箕: "箕水豹",
  斗: "斗木獬", 牛: "牛金牛", 女: "女土蝠", 虛: "虛日鼠", 危: "危月燕", 室: "室火豬", 壁: "壁水貐",
  奎: "奎木狼", 婁: "婁金狗", 胃: "胃土雉", 昴: "昴日雞", 畢: "畢月烏", 觜: "觜火猴", 參: "參水猿",
  井: "井木犴", 鬼: "鬼金羊", 柳: "柳土獐", 星: "星日馬", 張: "張月鹿", 翼: "翼火蛇", 軫: "軫水蚓",
};
const XIU_JI = ["角", "房", "尾", "箕", "斗", "室", "壁", "婁", "胃", "畢", "參", "井", "張", "軫"];

function yanQin(info: DayInfo, event: EventKey): Reason | null {
  const xiu = info.xiu;
  const qin = XIU_QIN[xiu];
  if (!qin) return null;
  const zang = ZANG_EVENTS.includes(event);
  // 特例：角宿吉而忌葬；鬼宿凶而葬反吉
  if (xiu === "角" && zang)
    return { kind: "凶", text: `值日${qin}——角宿造作嫁娶吉而忌埋葬（通行值日歌，非講義）` };
  if (xiu === "鬼" && zang)
    return { kind: "吉", text: `值日${qin}——鬼宿諸事凶而埋葬反吉（通行值日歌，非講義）` };
  if (XIU_JI.includes(xiu))
    return { kind: "吉", text: `值日${qin}，吉宿（通行值日歌，非講義）` };
  return { kind: "凶", text: `值日${qin}，凶宿（通行值日歌，非講義）` };
}

// 斗首化曜（爐傳斗首擇日綱要，通行法，非講義；原書七層斗首註云已廢）
// 廿四山斗首五行；柱干以五合化氣（甲己土乙庚金丙辛水丁壬木戊癸火）；
// 山為我：同我元辰、我生廉子、我剋武財（吉）；生我貪官、剋我破鬼（忌）
const DOUSHOU_WX: Record<string, string> = {
  壬: "土", 子: "土", 巽: "土", 巳: "土", 辛: "土", 戌: "土",
  癸: "火", 丑: "火", 丙: "火", 午: "火", 乾: "火", 亥: "火",
  艮: "木", 寅: "木", 丁: "木", 未: "木",
  甲: "水", 卯: "水", 坤: "水", 申: "水",
  乙: "金", 辰: "金", 庚: "金", 酉: "金",
};
const HUA_QI: Record<string, string> = {
  甲: "土", 己: "土", 乙: "金", 庚: "金", 丙: "水", 辛: "水",
  丁: "木", 壬: "木", 戊: "火", 癸: "火",
};
const WX_SHENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const WX_KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

function douShouYao(shanWx: string, ganWx: string): { name: string; ji: boolean } {
  if (ganWx === shanWx) return { name: "元辰", ji: false };
  if (WX_SHENG[shanWx] === ganWx) return { name: "廉子", ji: false };
  if (WX_KE[shanWx] === ganWx) return { name: "武財", ji: false };
  if (WX_SHENG[ganWx] === shanWx) return { name: "貪官", ji: true };
  return { name: "破鬼", ji: true };
}

function douShou(info: DayInfo, m: string): Reason[] {
  const shanWx = DOUSHOU_WX[m];
  if (!shanWx) return [];
  const pillars: [string, string][] = [
    ["年", info.yearGanZhi.charAt(0)],
    ["月", info.monthGanZhi.charAt(0)],
    ["日", info.dayGan],
  ];
  const yaos = pillars.map(([label, g]) => ({ label, ...douShouYao(shanWx, HUA_QI[g]) }));
  const desc = yaos.map((y) => `${y.label}${y.name}`).join("・");
  const badCore = yaos.filter((y) => (y.label === "年" || y.label === "日") && y.ji);
  if (badCore.length > 0)
    return [{ kind: "凶", text: `斗首化曜（${m}山屬${shanWx}）：${desc}——${badCore.map((y) => y.label + "柱" + y.name).join("、")}忌（爐傳斗首，非講義）` }];
  if (yaos.every((y) => !y.ji))
    return [{ kind: "吉", text: `斗首化曜（${m}山屬${shanWx}）：${desc}，三柱皆吉曜（爐傳斗首，非講義）` }];
  return [{ kind: "注", text: `斗首化曜（${m}山屬${shanWx}）：${desc}——月柱逢忌曜，慎（爐傳斗首，非講義）` }];
}

// 陰府例（原書第六期 408-409 頁）：山歸宮（一卦管三山），宮納干化氣，
// 剋化氣之干對為陰府——「雙字全凶，單字不忌」。
// 錨定：例十二戌山忌丁壬、例九申山忌戊癸、例七丁山忌乙庚（餘頁漫漶，依律推全）。
const MOUNTAIN_GONG: Record<string, string> = {
  壬: "坎", 子: "坎", 癸: "坎", 丑: "艮", 艮: "艮", 寅: "艮",
  甲: "震", 卯: "震", 乙: "震", 辰: "巽", 巽: "巽", 巳: "巽",
  丙: "離", 午: "離", 丁: "離", 未: "坤", 坤: "坤", 申: "坤",
  庚: "兌", 酉: "兌", 辛: "兌", 戌: "乾", 乾: "乾", 亥: "乾",
};
const YIN_FU: Record<string, [string, string]> = {
  乾: ["丁", "壬"], 坎: ["丙", "辛"], 艮: ["甲", "己"], 震: ["戊", "癸"],
  巽: ["甲", "己"], 離: ["乙", "庚"], 坤: ["戊", "癸"], 兌: ["乙", "庚"],
};

function yinFuJi(info: DayInfo, m: string): Reason | null {
  const gong = MOUNTAIN_GONG[m];
  const pair = gong ? YIN_FU[gong] : undefined;
  if (!pair) return null;
  const gans = [info.yearGanZhi.charAt(0), info.monthGanZhi.charAt(0), info.dayGan];
  if (pair.every((g) => gans.includes(g)))
    return {
      kind: "凶",
      text: `陰府（${m}山屬${gong}宮，忌${pair.join("")}雙字全）——年月日柱俱見，凶（原書：陰府例，單字不忌）`,
    };
  return null;
}

function zaoZuoShan(info: DayInfo, m: string, zuoTaiSui = true, jian?: string): Reason[] {
  const out: Reason[] = [];
  const yearZhi = info.yearGanZhi.charAt(1);
  const sha = SAN_SHA_FANG[yearZhi] ?? [];
  if (ZHI_CHONG[m]) {
    // 支山
    if (ZHI_CHONG[m] === info.dayZhi)
      out.push({ kind: "凶", text: `日支${info.dayZhi}沖山（坐${m}山），造作葬事忌之（原書：沖山例）` });
    if (sha.includes(m))
      out.push({ kind: "凶", text: `流年${info.yearGanZhi}三殺占山（${m}山），歲內造作葬事大忌（原書：三殺例）` });
    if (ZHI_CHONG[yearZhi] === m)
      out.push({ kind: "凶", text: `歲破占山（流年${info.yearGanZhi}沖${m}山，即向太歲），歲內大忌（原書：安葬山家凶神訣）` });
    if (zuoTaiSui && m === yearZhi)
      out.push({ kind: "注", text: `坐太歲（${m}山即流年${info.yearGanZhi}之方）——古謂太歲可坐不可向，造葬修方從權慎用` });
  } else if (GAN_SHAN_CHONG[m]) {
    // 干山
    if (info.dayGan === GAN_SHAN_CHONG[m])
      out.push({ kind: "凶", text: `日干${info.dayGan}沖山（坐${m}山，${m}${GAN_SHAN_CHONG[m]}對沖），忌之（原書：沖山例）` });
    if (GAN_SHAN_FANG[m]?.every((z) => sha.includes(z)))
      out.push({ kind: "凶", text: `流年${info.yearGanZhi}三殺占方（${m}山附焉），歲內造作葬事大忌（原書：三殺例）` });
  } else if (GUA_SHAN_CHONG[m]) {
    // 卦山
    if (GUA_SHAN_CHONG[m].includes(info.dayZhi))
      out.push({ kind: "凶", text: `日支${info.dayZhi}沖山（坐${m}山，對宮${GUA_SHAN_CHONG[m].join("")}之沖），忌之（原書：沖山例）` });
  }
  // ── 月家凶神占山（原書第八期月家八條）──────────────────────
  const mz = info.monthZhi;
  const mSha = SAN_SHA_FANG[mz] ?? [];
  if (ZHI_CHONG[m]) {
    if (ZHI_CHONG[m] === mz)
      out.push({ kind: "凶", text: `沖山凶月（${mz}月建沖${m}山，如年之歲破），月內大凶不可用（原書：月家凶神）` });
    if (mSha.includes(m))
      out.push({ kind: "凶", text: `三殺凶月（${mz}月三殺占${m}山），月家之大殺不可用（原書：月家凶神）` });
    if (zhiAdd(mz, 9) === m)
      out.push({ kind: "凶", text: `八座凶月（${mz}月八座方占${m}山），難有制法從俗大忌（原書：月家凶神）` });
  } else if (GAN_SHAN_CHONG[m] && GAN_SHAN_FANG[m]?.every((z) => mSha.includes(z))) {
    out.push({ kind: "凶", text: `三殺凶月（${mz}月三殺占方，${m}山附焉），月內不可用（原書：月家凶神）` });
  }
  // ── 日三殺占山（原書 394 三殺例：「四柱中逢申子辰任何一字，殺在南方，
  //    七山均不能用」——故日支一字亦成殺方）───────────────────
  const dSha = SAN_SHA_FANG[info.dayZhi] ?? [];
  if (ZHI_CHONG[m] ? dSha.includes(m) : GAN_SHAN_CHONG[m] ? GAN_SHAN_FANG[m]?.every((z) => dSha.includes(z)) : false)
    out.push({ kind: "凶", text: `日三殺占山（課中${info.dayZhi}字，殺${dSha.join("")}方，${m}山在焉），不能用（原書：三殺例）` });
  {
    const ci = MOUNTAINS_24.indexOf(ZHI_CHONG[mz] ?? "");
    if (ci >= 0 && MOUNTAINS_24[(ci + 1) % 24] === m)
      out.push({ kind: "凶", text: `劍鋒殺月（${mz}月劍鋒占${m}山），忌葬勿用為要——太陽、木星、木局可制（原書：月家凶神）` });
  }
  // ── 兼向諸例（原書 394-395 豎造細目）──────────────────────
  // 沖山例兼例：「◯山兼◯，四柱中如有沖所兼之字，謂之沖兼凶」（癸山兼子有午字、
  // 坤山兼未有丑字之屬）；三殺例：殺方七山＝殺方五山＋兩隅卦山兼入
  // （殺南則巽山兼巳、坤山兼未，殺北則乾山兼亥、艮山兼丑）。
  if (jian) {
    const pillarZhi: [string, string][] = [["年", yearZhi], ["月", mz], ["日", info.dayZhi]];
    const pillarGan: [string, string][] = [["年", info.yearGanZhi.charAt(0)], ["月", info.monthGanZhi.charAt(0)], ["日", info.dayGan]];
    if (ZHI_CHONG[jian]) {
      // 兼支山：柱支沖所兼
      for (const [label, z] of pillarZhi)
        if (ZHI_CHONG[jian] === z)
          out.push({ kind: "凶", text: `${label}支${z}沖兼（坐${m}山兼${jian}），謂之沖兼凶（原書：沖山例）` });
      // 三殺七山之隅：卦山兼入殺方
      if (GUA_SHAN_CHONG[m]) {
        for (const [label, z] of pillarZhi) {
          const s = SAN_SHA_FANG[z] ?? [];
          if (s.includes(jian))
            out.push({ kind: "凶", text: `三殺占兼（${label}課${z}字殺${s.join("")}方，坐${m}山兼${jian}即七山之隅），不能用（原書：三殺例）` });
        }
      }
    } else if (GAN_SHAN_CHONG[jian]) {
      // 兼干山：柱干沖所兼
      for (const [label, g] of pillarGan)
        if (GAN_SHAN_CHONG[jian] === g)
          out.push({ kind: "凶", text: `${label}干${g}沖兼（坐${m}山兼${jian}，${jian}${GAN_SHAN_CHONG[jian]}對沖），謂之沖兼凶（原書：沖山例）` });
    } else if (GUA_SHAN_CHONG[jian]) {
      // 兼卦山：柱支沖對宮二支
      for (const [label, z] of pillarZhi)
        if (GUA_SHAN_CHONG[jian].includes(z))
          out.push({ kind: "凶", text: `${label}支${z}沖兼（坐${m}山兼${jian}，對宮${GUA_SHAN_CHONG[jian].join("")}之沖），謂之沖兼凶（原書：沖山例）` });
    }
  }
  // 陰府（諸山皆判）
  const yf = yinFuJi(info, m);
  if (yf) out.push(yf);
  return out;
}

// ── 震宮殺（原書第九期，書 619-621／PDF 340-341）──────────────
// 飛宮月家殺，忌上樑。訣：八節起宮 → 就其位起甲子順飛九宮、算至流年干支即泊宮
//   → 泊宮起五虎遁（正月月建）順飛、行至本月月建（呼聲）即殺宮 → 殺宮三山忌上樑。
// 九宮順飛序 [坎坤震巽中乾兌艮離]；八節卦：立春艮、春分震、立夏巽、夏至離、
//   立秋坤、秋分兌、立冬乾、冬至坎（月無八節者從最近之節，如三月從春分震）。
// 殺宮 = (節宮序 + 年六十甲子序 + 月數 − 1) mod 9。
// 丙寅年清讀四證：正月泊坎殺坎、二月泊中殺乾、三月泊中殺兌、四月泊乾——皆合；
//   六月殺兌、八月殺兌亦與殘讀相符（原書逐月推演，書 341）。
const PALACE_ORDER = ["坎", "坤", "震", "巽", "中", "乾", "兌", "艮", "離"];
// 各卦宮所轄三山（中宮無山）
const PALACE_SAN_SHAN: Record<string, string[]> = {
  坎: ["壬", "子", "癸"], 艮: ["丑", "艮", "寅"], 震: ["甲", "卯", "乙"], 巽: ["辰", "巽", "巳"],
  離: ["丙", "午", "丁"], 坤: ["未", "坤", "申"], 兌: ["庚", "酉", "辛"], 乾: ["戌", "乾", "亥"],
};
// 月建（節氣月支）→ 起宮八節卦
const ZHEN_GONG_NODE: Record<string, string> = {
  寅: "艮", 卯: "震", 辰: "震", 巳: "巽", 午: "離", 未: "離",
  申: "坤", 酉: "兌", 戌: "兌", 亥: "乾", 子: "坎", 丑: "坎",
};

// 年六十甲子序（甲子＝0）：n≡干(mod10)、n≡支(mod12)
function ganZhiCycleIndex(gz: string): number {
  const g = "甲乙丙丁戊己庚辛壬癸".indexOf(gz.charAt(0));
  const z = ZHI_ORDER_E.indexOf(gz.charAt(1));
  if (g < 0 || z < 0) return -1;
  return ((6 * g - 5 * z) % 60 + 60) % 60;
}

// 震宮殺所在之宮（依流年干支、月建）
function zhenGongShaPalace(yearGanZhi: string, monthZhi: string): string | null {
  const node = ZHEN_GONG_NODE[monthZhi];
  const yc = ganZhiCycleIndex(yearGanZhi);
  if (!node || yc < 0) return null;
  const m = ((ZHI_ORDER_E.indexOf(monthZhi) - 2 + 12) % 12) + 1; // 寅＝1…丑＝12
  const idx = ((PALACE_ORDER.indexOf(node) + yc + m - 1) % 9 + 9) % 9;
  return PALACE_ORDER[idx];
}

// 震宮殺占山（上樑用）：殺宮三山忌上樑
function zhenGongSha(info: DayInfo, m: string): Reason[] {
  const gong = zhenGongShaPalace(info.yearGanZhi, info.monthZhi);
  if (!gong || gong === "中") return []; // 殺入中宮，無定山
  const shan = PALACE_SAN_SHAN[gong] ?? [];
  if (shan.includes(m))
    return [{
      kind: "凶",
      text: `震宮殺（流年${info.yearGanZhi}${info.monthZhi}月殺在${gong}宮，${shan.join("")}三山），忌上樑（原書第九期飛宮：八節起宮、五虎遁至呼聲泊宮）`,
    }];
  return [];
}

// ── 大月建（原書第九期，書 ~623／PDF 340 右頁「大月建」）──────────
// 飛宮月家殺，大忌修方、修灶、造新（訣註：凡及別事到不忌）。訣：
//   子午卯酉起艮鄉，辰戌丑未起中宮，寅申巳亥坤位發，逆佈九宮定歲方。
// 正月泊起宮、餘月逆佈九宮（洛書九→一遞降）至本月建即大月建所泊宮，其三山忌修方。
// 書證（同頁逐年例）：辰戌丑未年正月中宮、寅申巳亥年正月申（＝坤宮之支）——皆與訣起宮合。
const DA_YUE_JIAN_START: Record<string, string> = {
  子: "艮", 午: "艮", 卯: "艮", 酉: "艮",
  辰: "中", 戌: "中", 丑: "中", 未: "中",
  寅: "坤", 申: "坤", 巳: "坤", 亥: "坤",
};

// 大月建所在之宮（依流年支、月建；正月起宮、逆佈九宮）
function daYueJianPalace(yearZhi: string, monthZhi: string): string | null {
  const start = DA_YUE_JIAN_START[yearZhi];
  const mi = ZHI_ORDER_E.indexOf(monthZhi);
  if (!start || mi < 0) return null;
  const startNum = PALACE_ORDER.indexOf(start) + 1; // 洛書數 1..9（坎1…離9）
  const m = ((mi - 2 + 12) % 12) + 1;               // 寅＝1…丑＝12
  const num = (((startNum - (m - 1) - 1) % 9) + 9) % 9 + 1; // 逆佈：每月遞降一宮
  return PALACE_ORDER[num - 1];
}

// 大月建占山（修方營造用）：大月建三山大忌修方
function daYueJian(info: DayInfo, m: string): Reason[] {
  const yz = info.yearGanZhi.charAt(1);
  const gong = daYueJianPalace(yz, info.monthZhi);
  if (!gong || gong === "中") return []; // 大月建入中宮，無定山
  const shan = PALACE_SAN_SHAN[gong] ?? [];
  if (shan.includes(m))
    return [{
      kind: "凶",
      text: `大月建（流年${yz}年${info.monthZhi}月建在${gong}宮，${shan.join("")}三山），大忌修方修造（原書第九期飛宮：年支起宮、逆佈九宮）`,
    }];
  return [];
}

// ── 仙命諸忌（原書第八期 543 頁「仙命諸空沖殺刑刃例」） ──────
// 日沖仙命大凶；三殺日（真三殺大凶，餘取祿馬貴人可解）；三刑凶日；
// 六甲旬空（仙命旬之空亡支，冷地空亡之屬，可權用）
const XING_MAP: [string, string][] = [
  ["子", "卯"], ["卯", "子"],
  ["寅", "巳"], ["巳", "申"], ["申", "寅"],
  ["丑", "戌"], ["戌", "未"], ["未", "丑"],
  ["辰", "辰"], ["午", "午"], ["酉", "酉"], ["亥", "亥"],
];

function xianMingJi(info: DayInfo, xGan: string | undefined, xZhi: string): Reason[] {
  const out: Reason[] = [];
  const dz = info.dayZhi;
  // 陰宅貴人：日支為仙命年干之天乙貴人，吉
  if (xGan && TIAN_YI[xGan]?.includes(dz))
    out.push({ kind: "吉", text: `日支${dz}為仙命${xGan}干天乙貴人（陰宅貴人臨日）` });
  if (ZHI_CHONG[xZhi] === dz)
    out.push({ kind: "凶", text: `日支${dz}沖仙命（亡命${xZhi}），葬課大凶（原書：仙命諸忌例）` });
  if (SAN_SHA_FANG[xZhi]?.includes(dz))
    out.push({ kind: "凶", text: `仙命三殺日（${xZhi}命見${dz}日）——原書：真三殺大凶，非真者取祿馬貴人解化` });
  if (XING_MAP.some(([a, b]) => a === xZhi && b === dz))
    out.push({ kind: "注", text: "日支刑仙命（三刑凶日），宜取貴人解化從權（原書：仙命諸忌例）" });
  // 六甲旬空：仙命所在旬之空亡支
  if (xGan) {
    const gi = GAN_ORDER.indexOf(xGan);
    const zi = ZHI_ORDER_E.indexOf(xZhi);
    if (gi >= 0 && zi >= 0) {
      let n = gi;
      for (; n < 60; n += 10) if (n % 12 === zi) break;
      if (n < 60) {
        const head = n - (n % 10);
        const kong = [ZHI_ORDER_E[(head + 10) % 12], ZHI_ORDER_E[(head + 11) % 12]];
        if (kong.includes(dz))
          out.push({ kind: "注", text: `仙命旬空日（${kong.join("、")}為空亡），冷地空亡之屬，葬課慎用` });
      }
    }
    // 人梯地空亡（六十仙命諸空亡表，瑞成本書 420-429）：命干定局，干恆庚、支＝(6−2·命干序)mod12
    //   甲庚午·乙庚辰·丙庚寅·丁庚子·戊庚戌·己庚申·庚庚午·辛庚辰·壬庚寅·癸庚子（三命驗合）
    const gi2 = GAN_ORDER.indexOf(xGan);
    if (gi2 >= 0) {
      const rentiZhi = ZHI_ORDER_E[((6 - 2 * gi2) % 12 + 12) % 12];
      if (info.dayGanZhi === "庚" + rentiZhi)
        out.push({ kind: "注", text: `人梯地空亡日（仙命${xGan}干，庚${rentiZhi}日），空亡之屬，葬課慎用（原書：六十仙命諸空亡）` });
    }
  }
  return out;
}

// ── 回頭貢殺、箭刃（原書第一期 56-57 頁）─────────────────────
// 回頭貢殺：惟辰戌丑未四命；擇日四柱支中三合全局殺之——亥卯未全殺戌命、
// 寅午戌全殺丑命、巳酉丑全殺辰命、申子辰全殺未命。三字全方犯（二字不謂），不能制化。
export const HUI_TOU: Record<string, string[]> = {
  戌: ["亥", "卯", "未"], 丑: ["寅", "午", "戌"], 辰: ["巳", "酉", "丑"], 未: ["申", "子", "辰"],
};
// 箭刃：命干對定雙支——甲庚卯酉、乙辛辰戌、丙戊壬子午、丁己癸丑未；
// 四柱中雙全謂之犯箭刃；逢天乙貴人到、三合化刃則喜。
export const JIAN_REN: Record<string, [string, string]> = {
  甲: ["卯", "酉"], 庚: ["卯", "酉"], 乙: ["辰", "戌"], 辛: ["辰", "戌"],
  丙: ["子", "午"], 戊: ["子", "午"], 壬: ["子", "午"],
  丁: ["丑", "未"], 己: ["丑", "未"], 癸: ["丑", "未"],
};

// ── 陽氣陰胎（原書第一期 107 頁表、108 頁註）──────────────────
// 乾造推陽氣、坤造推陰胎，同表：支＝生月支進三（正月巳……十二月辰）；
// 干＝甲己年生起丁、乙庚起己、丙辛起辛、丁壬起癸、戊癸起乙，自正月順行。
// 生月以節氣為界（正＝立春雨水……）。擇日日支沖之謂之犯沖，安牀忌。
const YIN_TAI_GAN_START: Record<string, number> = {
  甲: 3, 己: 3, 乙: 5, 庚: 5, 丙: 7, 辛: 7, 丁: 9, 壬: 9, 戊: 1, 癸: 1, // 丁己辛癸乙 之干序
};
export function yinTaiYangQi(birthGan: string, month: number): { gan: string; zhi: string } | null {
  const s = YIN_TAI_GAN_START[birthGan];
  if (s === undefined || month < 1 || month > 12) return null;
  const gan = GAN_ORDER[(s + month - 1) % 10];
  const zhi = ZHI_ORDER_E[(5 + month - 1) % 12]; // 正月巳
  return { gan, zhi };
}

// ── 地啞年例（原書第八期，安葬忌例後附表）───────────────────
// 流年年支分八組，農曆日號以八為週期：組值 g——子1、丑寅0、卯7、辰巳6、
// 午5、未申4、酉3、戌亥2；某月地啞日＝日號 d 合 d ≡ g−(月−1)（mod 8）。
// 全表逐格與此式合（子年正月初一初九十七廿五……戌亥年正月初二初十十八廿六）。
// 表前註（字有漶漫）謂俗以制重喪、三喪之屬——故作注，非吉凶。
const DI_YA_G: Record<string, number> = {
  子: 1, 丑: 0, 寅: 0, 卯: 7, 辰: 6, 巳: 6,
  午: 5, 未: 4, 申: 4, 酉: 3, 戌: 2, 亥: 2,
};

function isDiYa(yearZhi: string, lunarMonth: number, lunarDay: number): boolean {
  const g = DI_YA_G[yearZhi];
  if (g === undefined) return false;
  const m = Math.abs(lunarMonth); // 閏月從本月
  return ((lunarDay - (g - (m - 1))) % 8 + 8) % 8 === 0;
}

// ── 地空年例（原書第八期，安葬忌例／六十仙命空亡前——瑞成清本書 418-419）───
// 流年年支分八組（同地啞），農曆日號八日一週期：組值 g——子7、丑寅0、卯7、辰巳6、
// 午5、未申4、酉3、戌亥2；某月地空日＝日號 d 合 d ≡ g−(月−1)（mod 8）。
// 逐格與此式合（子年正月初七十五廿三、二月初六十四廿二三十……戌亥年正月初二……）。
// 表首註「地空日如是金火日、或三合便可用也」——故作注（可制），葬事值之權用。
// 注意：g 與地啞僅子異（地啞子1、地空子7），餘七組同——已三驗子年正月為{7,15,23}非{1,9,17,25}。
const DI_KONG_G: Record<string, number> = {
  子: 7, 丑: 0, 寅: 0, 卯: 7, 辰: 6, 巳: 6,
  午: 5, 未: 4, 申: 4, 酉: 3, 戌: 2, 亥: 2,
};

function isDiKong(yearZhi: string, lunarMonth: number, lunarDay: number): boolean {
  const g = DI_KONG_G[yearZhi];
  if (g === undefined) return false;
  const m = Math.abs(lunarMonth);
  return ((lunarDay - (g - (m - 1))) % 8 + 8) % 8 === 0;
}

// ── 年剋山家（山運納音——原書第十期造葬廿四山吉凶總局，瑞成清本書 487-535）──
// 每山以洪範五行定墓庫（火墓戌／水土墓辰／木墓未／金墓丑），年干立春後庫運遁至庫支
// 得山運納音；年月日時四柱之納音剋山運納音則忌，就柱中取生山運之納音制化。
// 洪範五行（口訣：甲寅辰巽戌坎辛申水、震艮巳木、離壬丙乙火、兌丁乾亥金、丑癸坤庚未土）。
// 山運納音五行逐庫×年干組，照錄原書（壬山甲己甲戌火…酉山甲己乙丑金，八山驗合）：
// 六十甲子納音五行（每二干支一納音，序＝甲子乙丑金…壬戌癸亥水）：
const NAYIN_WX = [
  "金", "火", "木", "土", "金", "火", "水", "土", "金", "木",
  "水", "土", "火", "木", "水", "金", "火", "木", "土", "金",
  "火", "水", "土", "金", "木", "水", "土", "火", "木", "水",
];
function naYinWx(ganZhi: string): string {
  const i = ganZhiCycleIndex(ganZhi);
  return i < 0 ? "" : NAYIN_WX[Math.floor(i / 2)];
}
// 廿四山墓庫（洪範五行之墓）：火→戌、水／土→辰、木→未、金→丑
const MOUNTAIN_KU: Record<string, string> = {
  壬: "戌", 子: "辰", 癸: "辰", 丑: "辰", 艮: "未", 寅: "辰", 甲: "辰", 卯: "未",
  乙: "戌", 辰: "辰", 巽: "辰", 巳: "未", 丙: "戌", 午: "戌", 丁: "丑", 未: "辰",
  坤: "辰", 申: "辰", 庚: "辰", 酉: "丑", 辛: "辰", 戌: "辰", 乾: "丑", 亥: "丑",
};
// 山運納音五行：庫支 → [甲己, 乙庚, 丙辛, 丁壬, 戊癸] 年干組之納音五行（照錄原書四庫序）
const SHAN_YUN_WX: Record<string, string[]> = {
  戌: ["火", "土", "木", "金", "水"],
  辰: ["木", "金", "水", "火", "土"],
  未: ["土", "木", "金", "水", "火"],
  丑: ["金", "水", "火", "土", "木"],
};
// 山運納音五行（依座山、流年干）
function shanYunWx(mountain: string, yearGan: string): string | null {
  const ku = MOUNTAIN_KU[mountain];
  const gi = GAN_ORDER.indexOf(yearGan);
  if (!ku || gi < 0) return null;
  return SHAN_YUN_WX[ku]?.[gi % 5] ?? null;
}
// 年剋山家：四柱納音剋山運則忌，柱中有生山運之納音則可制
function nianKeShanJia(info: DayInfo, mountain: string): Reason[] {
  const w = shanYunWx(mountain, info.yearGanZhi.charAt(0));
  if (!w) return [];
  const pillars: [string, string][] = [
    ["年", info.yearGanZhi], ["月", info.monthGanZhi], ["日", info.dayGanZhi],
  ];
  const keNeeded = Object.keys(WX_KE).find((e) => WX_KE[e] === w); // 剋山運之五行
  const ke = pillars.filter(([, gz]) => naYinWx(gz) === keNeeded);
  if (ke.length === 0) return [];
  const zhi = pillars.filter(([, gz]) => naYinWx(gz) === w || WX_SHENG[naYinWx(gz)] === w); // 生扶山運
  const kePillars = ke.map(([n, gz]) => `${n}柱${gz}(${keNeeded}納音)`).join("、");
  if (zhi.length > 0)
    return [{ kind: "注", text: `年剋山家（${mountain}山山運納音屬${w}，${kePillars}剋山運）——柱中有${zhi.map(([n]) => n).join("")}柱納音生扶，可制權用（原書第十期造葬廿四山總局）` }];
  return [{ kind: "凶", text: `年剋山家（${mountain}山山運納音屬${w}，${kePillars}剋山運，柱中無生扶之納音制化），造葬忌之（原書第十期造葬廿四山總局）` }];
}

// ── 年家八座、劍鋒（原書第八期安葬凶神年支表；訣云「橫天八座不堪留」） ──
// 八座日：凶神年支對定干支日，「勿用」——子年癸酉、丑年甲戌、寅年丁亥、卯年甲子、
// 辰年乙丑、巳年甲寅、午年丁卯、未年甲辰、申年己巳、酉年甲午、戌年丁未、亥年甲申
const BA_ZUO_DAY: Record<string, string> = {
  子: "癸酉", 丑: "甲戌", 寅: "丁亥", 卯: "甲子", 辰: "乙丑", 巳: "甲寅",
  午: "丁卯", 未: "甲辰", 申: "己巳", 酉: "甲午", 戌: "丁未", 亥: "甲申",
};

// 八座凶方＝年支進九位之支山（子年酉方…）；劍鋒凶方＝沖支之次一山
// （子年丁、丑年坤、寅年庚、卯年辛、辰年乾、巳年壬、午年癸、未年艮、
//  申年甲、酉年乙、戌年巽、亥年丙——表列十二格與「沖支後一山」全合）
// 表註兩方皆「制化權用」，故作注不作凶
function baZuoJi(info: DayInfo, event: EventKey, m: string | undefined): Reason[] {
  const out: Reason[] = [];
  const yz = info.yearGanZhi.charAt(1);
  if (BA_ZUO_DAY[yz] === info.dayGanZhi)
    out.push({ kind: "凶", text: `八座日（${yz}年${info.dayGanZhi}日），葬課勿用（原書：安葬凶神年支表；訣云「橫天八座不堪留」）` });
  if (m) {
    const baFang = zhiAdd(yz, 9);
    if (m === baFang)
      out.push({ kind: "注", text: `八座凶方占山（${yz}年${baFang}方），制化權用（原書：安葬凶神年支表）` });
    const chong = ZHI_CHONG[yz];
    const ci = MOUNTAINS_24.indexOf(chong);
    const jianFeng = ci >= 0 ? MOUNTAINS_24[(ci + 1) % 24] : "";
    if (m === jianFeng)
      out.push({ kind: "注", text: `劍鋒凶方占山（${yz}年${jianFeng}方），制化權用（原書：安葬凶神年支表）` });
  }
  return out;
}

// ── 安葬忌例逐月表補（原書第八期，PDF 308 左頁）──────────────
// 天狗日：正月子順行（月支進十）；復日：月家干日 寅甲卯乙辰戊巳丙午丁未己
// 申庚酉辛戌戊亥壬子癸丑己（與入殮、成服除服表干列同——三六九十二月與重喪
// 己日有辰戌月戊日之異，故另立）；正紅紗：季月丑日（孟仲月表作○無忌）；
// 橫天朱雀：每月十七日（表十二行皆書十七）。
const FU_RI: Record<string, string> = {
  寅: "甲", 卯: "乙", 辰: "戊", 巳: "丙", 午: "丁", 未: "己",
  申: "庚", 酉: "辛", 戌: "戊", 亥: "壬", 子: "癸", 丑: "己",
};
const JI_YUE = ["辰", "未", "戌", "丑"]; // 季月

// 重喪日（原書第八期安葬日家凶神訣：重日重喪並三喪）——月家干日
// 寅月甲、卯月乙、巳月丙、午月丁、申月庚、酉月辛、亥月壬、子月癸、四季月（辰未戌丑）己
const CHONG_SANG: Record<string, string> = {
  寅: "甲", 卯: "乙", 巳: "丙", 午: "丁", 申: "庚", 酉: "辛",
  亥: "壬", 子: "癸", 辰: "己", 未: "己", 戌: "己", 丑: "己",
};

export function evaluateDay(info: DayInfo, event: EventKey, opts: EvalOptions = {}): Evaluation {
  const reasons: Reason[] = [];
  const offList = opts.disabledLayers ?? [];
  const on = (key: string) => isLayerOn(key, offList);

  if (on("yuejia")) reasons.push(...commonBad(info, event));

  // 彭祖百忌（日支）
  if (on("pengzu") && event === "jiaqu" && info.dayZhi === "亥")
    reasons.push({ kind: "凶", text: "彭祖百忌：亥不行嫁，必主分張" });
  if (on("pengzu") && event === "anchuang" && info.dayZhi === "申")
    reasons.push({ kind: "凶", text: "彭祖百忌：申不安牀，鬼祟入房（原書：十二月皆忌申日）" });

  // 裁衣合帳忌例（原書 92-93 頁）
  if (event === "caiyi" && on("caiyiji")) {
    reasons.push(...getCaiYiJi(info));
  }

  // 安牀忌例（原書 111 頁定局）
  if (event === "anchuang" && on("anchuang")) {
    for (const hit of getAnChuangJi(info)) {
      reasons.push({ kind: hit.kind, text: `${hit.name}，${hit.note}` });
    }
    // 正四廢（原書 100 頁安床碎金賦：四離四絕正四廢皆忌）
    if (isSiFei(info))
      reasons.push({ kind: "凶", text: "正四廢日，安牀忌之（原書：安床碎金賦）" });
    // 天嗣犯沖（原書 109 頁）：以本命（新床以女命）天干推
    if (opts.birthGan) {
      const ts = getTianSiChong(opts.birthGan, info.dayGanZhi, info.dayZhi);
      if (ts) reasons.push(ts);
    }
    // 命宮盤沖（原書 108 頁：沖男女宮即滅子胎，安床大忌；以女命干推）
    if (opts.birthGan) reasons.push(...gongChong(opts.birthGan, info.dayZhi));
    // 沖夫星（原書 101 頁：坤造安床忌沖夫星，以女命推）
    if (opts.birthZhi && info.dayZhi === zhiAdd(opts.birthZhi, 1)) {
      if (opts.birthGan && info.dayGan === ganAdd(opts.birthGan, 3))
        reasons.push({ kind: "凶", text: `${info.dayGanZhi}日正沖夫星，安牀大忌（原書：安床碎金賦）` });
      else reasons.push({ kind: "注", text: "日支沖夫星，安牀慎用（原書：安床碎金賦）" });
    }
    // 陽氣陰胎日沖（原書 107-108）：坤造生月推陰胎、乾造生月推陽氣，日支沖之忌
    if (opts.femaleBirthGan && opts.femaleBirthMonth) {
      const t = yinTaiYangQi(opts.femaleBirthGan, opts.femaleBirthMonth);
      if (t && ZHI_CHONG[t.zhi] === info.dayZhi)
        reasons.push({ kind: "凶", text: `日支${info.dayZhi}沖陰胎（坤造${opts.femaleBirthMonth}月生，陰胎${t.gan}${t.zhi}），安牀忌之（原書 107）` });
    }
    if (opts.birthGan && opts.birthMonth) {
      const t = yinTaiYangQi(opts.birthGan, opts.birthMonth);
      if (t && ZHI_CHONG[t.zhi] === info.dayZhi)
        reasons.push({ kind: "凶", text: `日支${info.dayZhi}沖陽氣（乾造${opts.birthMonth}月生，陽氣${t.gan}${t.zhi}），安牀忌之（原書 107）` });
    }
  }
  if (on("pengzu") && event === "chuxing" && info.dayZhi === "巳")
    reasons.push({ kind: "凶", text: "彭祖百忌：巳不遠行，財物伏藏" });
  if (on("pengzu") && JI_SI_EVENTS.includes(event) && info.dayZhi === "寅")
    reasons.push({ kind: "凶", text: "彭祖百忌：寅不祭祀，神鬼不嘗" });
  if (on("pengzu") && event === "qiuyi" && info.dayZhi === "未")
    reasons.push({ kind: "凶", text: "彭祖百忌：未不服藥，毒氣入腸" });

  // 本命沖煞（婚事以女命為主，另可多命合參——如開市數東家、婚事乾造）
  const useFemale = eventDef(event).mingInput === "female";
  const persons: { label: string; zhi: string; gan?: string }[] = [];
  if (useFemale && opts.femaleBirthZhi)
    persons.push({ label: `女命${opts.femaleBirthZhi}`, zhi: opts.femaleBirthZhi, gan: opts.femaleBirthGan });
  if (opts.persons?.length) {
    for (const p of opts.persons)
      persons.push({ label: p.year ? `${p.year}（${p.zhi}）命` : `本命${p.zhi}`, zhi: p.zhi, gan: p.gan });
  } else if (!useFemale && opts.birthZhi) {
    persons.push({ label: `本命${opts.birthZhi}`, zhi: opts.birthZhi, gan: opts.birthGan });
  }
  for (const p of persons) {
    if (on("chongming") && isChongMing(p.zhi, info.dayZhi))
      reasons.push({ kind: "凶", text: `日支${info.dayZhi}正沖${p.label}，犯沖大凶` });
    // 破碎日：通書公例；嫁娶另依原書女命日吉凶表，不重複計
    if (on("chongming") && event !== "jiaqu" && isPoSui(p.zhi, info.dayZhi))
      reasons.push({ kind: "凶", text: `破碎日（${p.label}見${info.dayZhi}日），忌用` });
    // 吉凶神定局（原書 59 頁起）
    if (on("jixiong")) reasons.push(...jiXiongShen(info, p.gan, p.zhi, p.label));
    // 回頭貢殺、箭刃（原書 56-57）：以課之年月日支論，時支於時課再判
    if (on("huitou")) {
      const pillars = [info.yearGanZhi.charAt(1), info.monthZhi, info.dayZhi];
      const need = HUI_TOU[p.zhi];
      if (need) {
        const have = need.filter((z) => pillars.includes(z));
        if (have.length === 3)
          reasons.push({ kind: "凶", text: `年月日支${need.join("")}三合全局，${p.label}犯回頭貢殺，不能制化（原書 56）` });
        else if (have.length === 2)
          reasons.push({ kind: "注", text: `年月日支已見${have.join("")}二字，${p.label}擇時勿再取${need.filter((z) => !have.includes(z)).join("")}時，恐成回頭貢殺（原書 56）` });
      }
      const pair = p.gan ? JIAN_REN[p.gan] : undefined;
      if (pair && pair.every((z) => pillars.includes(z)))
        reasons.push({ kind: "凶", text: `課中${pair.join("")}雙全，${p.label}犯箭刃（原書 57：逢天乙貴人到、三合化刃則喜）` });
    }
  }

  // 女命十二地支日吉凶（《剋擇講義》書 86-89 頁）：婚事以女命三合局斷日
  if (on("nvming") && (event === "jiaqu" || event === "nacai") && opts.femaleBirthZhi) {
    const v = nvMingDayVerdict(opts.femaleBirthZhi, info.dayZhi);
    if (v) reasons.push(v);
  }

  // 動土忌例（原書第八期 548 頁）：土符、土瘟、天瘟、重日、白虎朱雀
  if (event === "dongtu" && on("dongtuji")) {
    reasons.push(...getDongTuJi(info));
  }
  // 伐木架馬做梁忌例（原書第六期 326-327）
  if (event === "famu" && on("famuji")) {
    reasons.push(...famuJi(info));
  }

  // 殺師日（通書俗傳，非講義；預設關）：春辰戌、夏卯酉、秋丑未、冬子午
  if (on("shashi")) {
    const SHASHI_EVENTS: EventKey[] = ["anzang", "potu", "qizan", "xiufen", "kaishengfen", "dongtu", "qiji", "libei"];
    if (SHASHI_EVENTS.includes(event)) {
      const seasonIdx = Math.floor(["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"].indexOf(info.monthZhi) / 3);
      const pairs = [["辰", "戌"], ["卯", "酉"], ["丑", "未"], ["子", "午"]][seasonIdx] ?? [];
      if (pairs.includes(info.dayZhi))
        reasons.push({ kind: "注", text: "殺師日（通書俗傳口訣，派別有異）——主事地師勿登山扶作，事主無妨" });
    }
  }

  // 土王用事（原書：動土平基碎金賦）：四立前十八日，忌動土破土
  if (on("tuwang") && ["dongtu", "potu", "juejing", "xiufen", "kaishengfen", "qiji"].includes(event) && isTuWang(info.solar.y, info.solar.m, info.solar.d))
    reasons.push({ kind: "凶", text: "土王用事（四立前十八日，土旺），忌動土破土" });

  // 造作沖山、三殺（原書第六期）：入宅動土修造上樑，有座向則判
  if (on("shan") && ZAO_ZUO_EVENTS.includes(event) && opts.mountainZhi) {
    reasons.push(...zaoZuoShan(info, opts.mountainZhi, on("zuotaisui"), opts.jianXiang));
  }

  // 震宮殺（原書第九期飛宮）：上樑有座山則判
  if (on("zhengong") && event === "shangliang" && opts.mountainZhi) {
    reasons.push(...zhenGongSha(info, opts.mountainZhi));
  }

  // 大月建（原書第九期飛宮）：修方修造修灶有座山則判（訣註：凡別事不忌）
  if (on("dayuejian") && ["xiufang", "zuozao", "xiuzao"].includes(event) && opts.mountainZhi) {
    reasons.push(...daYueJian(info, opts.mountainZhi));
  }

  // 年剋山家（原書第十期造葬廿四山總局）：造葬有座山則判山運納音
  if (on("nianke") && (ZAO_ZUO_EVENTS.includes(event) || ZANG_EVENTS.includes(event)) && opts.mountainZhi) {
    reasons.push(...nianKeShanJia(info, opts.mountainZhi));
  }

  // 二宅通用：日課流年干之天乙貴人臨日支，吉
  if (
    on("jixiong") &&
    (ZAO_ZUO_EVENTS.includes(event) || ZANG_EVENTS.includes(event)) &&
    TIAN_YI[info.yearGanZhi.charAt(0)]?.includes(info.dayZhi)
  )
    reasons.push({ kind: "吉", text: `流年${info.yearGanZhi.charAt(0)}干天乙貴人臨日（二宅通用日課貴人）` });

  // 演禽宿曜（預設關）
  if (on("yanqin")) {
    const yq = yanQin(info, event);
    if (yq) reasons.push(yq);
  }

  // 斗首化曜（預設關；須座山）
  if (on("doushou") && ZAO_ZUO_EVENTS.includes(event) && opts.mountainZhi) {
    reasons.push(...douShou(info, opts.mountainZhi));
  }

  // 仙命諸忌（原書第八期）：葬事有亡命則判
  if (on("xianming") && ZANG_EVENTS.includes(event) && opts.xianMingZhi) {
    reasons.push(...xianMingJi(info, opts.xianMingGan, opts.xianMingZhi));
  }

  // 年家八座、劍鋒（原書第八期安葬凶神年支表）：八座日勿用；占山者作注
  if (on("bazuo") && ZANG_EVENTS.includes(event)) {
    reasons.push(...baZuoJi(info, event, opts.mountainZhi));
  }

  // 地啞年例（原書第八期）：喪葬課值地啞日，俗以制重喪三喪之屬
  if (on("dikong") && ZANG_EVENTS.includes(event) && isDiKong(info.yearGanZhi.charAt(1), info.lunarMonth, info.lunarDay)) {
    reasons.push({ kind: "注", text: "地空日（原書：地空年例）——空亡凶日，惟金火日或三合可制權用（葬事）" });
  }
  if (on("diya") && SAN_SANG_EVENTS.includes(event) && isDiYa(info.yearGanZhi.charAt(1), info.lunarMonth, info.lunarDay)) {
    reasons.push({ kind: "注", text: "地啞日（原書：地啞年例）——俗以制重喪、三喪之屬，喪葬課可權用" });
  }

  // 開市周堂（原書第七期）
  if (on("kaishizhou") && event === "kaishi") {
    const zt = kaiShiZhouTang(info.lunarDay, info.lunarMonthDayCount);
    if (zt.bad)
      reasons.push({ kind: "凶", text: `開市周堂值「${zt.name}」（原書圈點凶位），忌用` });
    else
      reasons.push({ kind: "吉", text: `開市周堂值「${zt.name}」，吉` });
  }

  // 入宅、安香周堂（原書 459-460 頁）；出火同忌二分二至
  if (on("zhaizhou") && (event === "ruzhai" || event === "anxiang" || event === "chuhuo")) {
    const zt =
      event === "chuhuo"
        ? null
        : event === "ruzhai"
          ? ruZhaiZhouTang(info.lunarDay, info.lunarMonthDayCount)
          : anXiangZhouTang(info.lunarDay, info.lunarMonthDayCount);
    if (zt && zt.bad)
      reasons.push({ kind: "凶", text: `${EVENT_NAMES[event]}周堂值「${zt.name}」（原書圈點凶位），忌用` });
    else if (zt)
      reasons.push({ kind: "吉", text: `${EVENT_NAMES[event]}周堂值「${zt.name}」，吉` });
    // 歸火入宅忌例：二分二至之日忌
    if (["春分", "秋分", "夏至", "冬至"].includes(info.jieQi))
      reasons.push({ kind: "凶", text: `二分二至日（${info.jieQi}），忌入宅歸火出火安香（原書：歸火入宅忌例）` });
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
    if (on("zhoutang")) {
      const zt = jiaQuZhouTang(info.lunarDay, info.lunarMonthDayCount);
      reasons.push({ kind: zt.ji, text: `嫁娶周堂值「${zt.name}」，原書：${zt.note}` });
      reasons.push({ kind: "注", text: `是日白虎值「${zt.baihu}」，麟符${zt.linfu === "免用" ? "免用" : `${zt.linfu}以制`}` });
    }
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
