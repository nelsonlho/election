// 合婚（男女合卦）——《剋擇講義》第二期
// 排山掌訣（書 130-131）＋體卦起法（書 144-145）：
//   女命干支入中宮，陽女順飛（中→乾→兌→艮→離→坎→坤→震→巽），
//   陰女逆飛（中→巽→震→坤→坎→離→艮→兌→乾），
//   六十甲子逐位飛泊，男命所泊之宮＝男卦（下卦）。
//   女卦（上卦）：陽女寄艮、陰女寄坤。
//   男泊中宮：陽男作坤、陰男作離。
// 驗證：庚辰女×壬申男→震宮（原書「泊在震宮之第七卦」）；
//   乙丑女行九格（書 139 對照表）全合。

import { GAN, ZHI } from "./almanac";

export type Gua = "乾" | "兌" | "離" | "震" | "巽" | "坎" | "艮" | "坤";

// 六十甲子序
export function jiaZiIndex(gan: string, zhi: string): number {
  const g = GAN.indexOf(gan as (typeof GAN)[number]);
  const z = ZHI.indexOf(zhi as (typeof ZHI)[number]);
  if (g < 0 || z < 0) return -1;
  // 序 n 滿足 n≡g (mod 10)、n≡z (mod 12)
  for (let n = g; n < 60; n += 10) if (n % 12 === z) return n;
  return -1;
}

// 陽女順飛宮序（自中宮始）；陰女逆飛宮序
const YANG_SEQ: (Gua | "中")[] = ["中", "乾", "兌", "艮", "離", "坎", "坤", "震", "巽"];
const YIN_SEQ: (Gua | "中")[] = ["中", "巽", "震", "坤", "坎", "離", "艮", "兌", "乾"];

// 上卦名（內外合稱）：上卦＋下卦 → 卦名
const GUA_XIANG: Record<Gua, string> = {
  乾: "天", 兌: "澤", 離: "火", 震: "雷", 巽: "風", 坎: "水", 艮: "山", 坤: "地",
};
// 八純卦
const PURE: Record<Gua, string> = {
  乾: "乾為天", 兌: "兌為澤", 離: "離為火", 震: "震為雷",
  巽: "巽為風", 坎: "坎為水", 艮: "艮為山", 坤: "坤為地",
};
// 六十四卦名（上卦→下卦→名）
const HEXAGRAM: Record<Gua, Record<Gua, string>> = {
  乾: { 乾: "乾為天", 兌: "天澤履", 離: "天火同人", 震: "天雷无妄", 巽: "天風姤", 坎: "天水訟", 艮: "天山遯", 坤: "天地否" },
  兌: { 乾: "澤天夬", 兌: "兌為澤", 離: "澤火革", 震: "澤雷隨", 巽: "澤風大過", 坎: "澤水困", 艮: "澤山咸", 坤: "澤地萃" },
  離: { 乾: "火天大有", 兌: "火澤睽", 離: "離為火", 震: "火雷噬嗑", 巽: "火風鼎", 坎: "火水未濟", 艮: "火山旅", 坤: "火地晉" },
  震: { 乾: "雷天大壯", 兌: "雷澤歸妹", 離: "雷火豐", 震: "震為雷", 巽: "雷風恆", 坎: "雷水解", 艮: "雷山小過", 坤: "雷地豫" },
  巽: { 乾: "風天小畜", 兌: "風澤中孚", 離: "風火家人", 震: "風雷益", 巽: "巽為風", 坎: "風水渙", 艮: "風山漸", 坤: "風地觀" },
  坎: { 乾: "水天需", 兌: "水澤節", 離: "水火既濟", 震: "水雷屯", 巽: "水風井", 坎: "坎為水", 艮: "水山蹇", 坤: "水地比" },
  艮: { 乾: "山天大畜", 兌: "山澤損", 離: "山火賁", 震: "山雷頤", 巽: "山風蠱", 坎: "山水蒙", 艮: "艮為山", 坤: "山地剝" },
  坤: { 乾: "地天泰", 兌: "地澤臨", 離: "地火明夷", 震: "地雷復", 巽: "地風升", 坎: "地水師", 艮: "地山謙", 坤: "坤為地" },
};

// 一卦管三山（書 147 註、202 頁）：女命地支取用卦之上卦
const ZHI_GUA: Record<string, Gua> = {
  子: "坎", 丑: "艮", 寅: "艮", 卯: "震", 辰: "巽", 巳: "巽",
  午: "離", 未: "坤", 申: "坤", 酉: "兌", 戌: "乾", 亥: "乾",
};

// 京房八宮卦管局（書 143）：六十四卦所屬之宮
const PALACE_OF: Record<string, Gua> = {};
const PALACE_LIST: [Gua, string[]][] = [
  ["乾", ["乾為天", "天風姤", "天山遯", "天地否", "風地觀", "山地剝", "火地晉", "火天大有"]],
  ["坎", ["坎為水", "水澤節", "水雷屯", "水火既濟", "澤火革", "雷火豐", "地火明夷", "地水師"]],
  ["艮", ["艮為山", "山火賁", "山天大畜", "山澤損", "火澤睽", "天澤履", "風澤中孚", "風山漸"]],
  ["震", ["震為雷", "雷地豫", "雷水解", "雷風恆", "地風升", "水風井", "澤風大過", "澤雷隨"]],
  ["巽", ["巽為風", "風天小畜", "風火家人", "風雷益", "天雷无妄", "火雷噬嗑", "山雷頤", "山風蠱"]],
  ["離", ["離為火", "火山旅", "火風鼎", "火水未濟", "山水蒙", "風水渙", "天水訟", "天火同人"]],
  ["坤", ["坤為地", "地雷復", "地澤臨", "地天泰", "雷天大壯", "澤天夬", "水天需", "水地比"]],
  ["兌", ["兌為澤", "澤水困", "澤地萃", "澤山咸", "水山蹇", "地山謙", "雷山小過", "雷澤歸妹"]],
];
for (const [palace, names] of PALACE_LIST) for (const n of names) PALACE_OF[n] = palace;

// 八宮五行
const GUA_WU_XING: Record<Gua, string> = {
  乾: "金", 兌: "金", 離: "火", 震: "木", 巽: "木", 坎: "水", 艮: "土", 坤: "土",
};
const SHENG: Record<string, string> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const KE: Record<string, string> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

export interface HeGuaResult {
  femaleGua: Gua; // 女卦（上）
  maleGua: Gua; // 男卦（下）
  malePalace: string; // 男所泊之宮（中宮寄卦前）
  tiGua: string; // 體卦名
}

// 干支陰陽：干序偶數（甲丙戊庚壬）為陽
function isYang(gan: string): boolean {
  return GAN.indexOf(gan as (typeof GAN)[number]) % 2 === 0;
}

export function heGua(
  femaleGan: string,
  femaleZhi: string,
  maleGan: string,
  maleZhi: string,
): HeGuaResult | null {
  const f = jiaZiIndex(femaleGan, femaleZhi);
  const m = jiaZiIndex(maleGan, maleZhi);
  if (f < 0 || m < 0) return null;
  const yangF = isYang(femaleGan);
  const femaleGua: Gua = yangF ? "艮" : "坤"; // 陽女寄艮、陰女寄坤
  const seq = yangF ? YANG_SEQ : YIN_SEQ;
  const palace = seq[((m - f) % 60 + 60) % 60 % 9];
  const maleGua: Gua =
    palace === "中" ? (isYang(maleGan) ? "坤" : "離") : palace; // 陽男中宮作坤、陰男作離
  return {
    femaleGua,
    maleGua,
    malePalace: palace === "中" ? "中宮" : `${palace}宮`,
    tiGua: HEXAGRAM[femaleGua][maleGua],
  };
}

// ── 合婚總判（書 148-149）──────────────────────────────
// 體卦管前三十年、用卦管後三十年（一爻五年，共六十年）。
// 用卦生體卦吉；體卦生用卦凶（洩暴），取日辰生體可解；比和吉。
// 生剋以卦所屬宮（京房八宮）之五行論——原書自證：
// 山雷頤係巽宮第七卦、風雷益係巽宮第四卦。
export interface HeHunResult {
  tiGua: string; // 體卦（前三十年）
  tiPalace: Gua;
  tiWuXing: string;
  yongGua: string; // 用卦（後三十年）
  yongPalace: Gua;
  yongWuXing: string;
  femaleGua: Gua;
  yongUpper: Gua;
  maleGua: Gua;
  malePalace: string;
  relation: "用生體" | "比和" | "用剋體" | "體生用" | "體剋用";
  verdict: "吉" | "凶" | "平";
  text: string;
}

export function heHun(
  femaleGan: string,
  femaleZhi: string,
  maleGan: string,
  maleZhi: string,
): HeHunResult | null {
  const base = heGua(femaleGan, femaleZhi, maleGan, maleZhi);
  if (!base) return null;
  const yongUpper = ZHI_GUA[femaleZhi];
  if (!yongUpper) return null;
  const yongGua = HEXAGRAM[yongUpper][base.maleGua];
  const tiPalace = PALACE_OF[base.tiGua];
  const yongPalace = PALACE_OF[yongGua];
  const ti = GUA_WU_XING[tiPalace];
  const yong = GUA_WU_XING[yongPalace];
  let relation: HeHunResult["relation"];
  let verdict: HeHunResult["verdict"];
  let text: string;
  if (yong === ti) {
    relation = "比和";
    verdict = "吉";
    text = "體用比和，同氣相扶，前後運一貫，吉。";
  } else if (SHENG[yong] === ti) {
    relation = "用生體";
    verdict = "吉";
    text = "用卦生體卦，後運滋養前運，原書謂吉。";
  } else if (SHENG[ti] === yong) {
    relation = "體生用";
    verdict = "凶";
    text = "體卦生用卦，謂之洩暴，凶——原書：須取日辰來生體卦則吉（擇日吊合可解）。";
  } else if (KE[yong] === ti) {
    relation = "用剋體";
    verdict = "凶";
    text = "用卦剋體卦，後運剋前運，凶——宜擇日辰生扶體卦以解。";
  } else {
    relation = "體剋用";
    verdict = "平";
    text = "體卦剋用卦——原書未明言吉凶，從權作平，仍宜擇吉日吊合。";
  }
  return {
    tiGua: base.tiGua,
    tiPalace,
    tiWuXing: ti,
    yongGua,
    yongPalace,
    yongWuXing: yong,
    femaleGua: base.femaleGua,
    yongUpper,
    maleGua: base.maleGua,
    malePalace: base.malePalace,
    relation,
    verdict,
    text,
  };
}
