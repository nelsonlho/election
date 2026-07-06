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
