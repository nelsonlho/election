"use client";

import { useEffect, useMemo, useState } from "react";
import { findAuspiciousDays, queryDay, personsOfYears, DayResult } from "@/lib/engine";
import { EventKey, EVENT_NAMES, EVENT_CATEGORIES, eventDef, layersForEvent, isLayerOn, DEFAULT_OFF_LAYERS, MOUNTAIN_WX, MOUNTAINS_24, Rating } from "@/lib/events";
import { JIANCHU } from "@/lib/jianchu";
import { yearZhiOfBirthYear, yearGanOfBirthYear, nianXiongFang, nianDaFang } from "@/lib/almanac";
import { heHun, hexagramLines } from "@/lib/hehun";
import type { Yao, Gua } from "@/lib/hehun";
import { evaluateHours } from "@/lib/hours";

type Tab = "search" | "day" | "hehun";

const RATING_STYLE: Record<Rating, string> = {
  吉: "bg-red-600 text-white",
  平: "bg-stone-400 text-white dark:bg-stone-600",
  凶: "bg-stone-800 text-stone-200 dark:bg-stone-950",
};

// 建除黃黑道徽章：黃道／可用（吉）金色，黑道／勿用（凶）玄色
function JianChuBadge({ name }: { name: string }) {
  const jc = JIANCHU[name as keyof typeof JIANCHU];
  if (!jc) return <span>{name}日</span>;
  const auspicious = jc.luck === "黃" || jc.luck === "可用";
  const label = jc.luck === "黃" ? "黃道" : jc.luck === "可用" ? "可用" : jc.luck === "黑" ? "黑道" : "勿用";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold ${
        auspicious
          ? "bg-amber-400 text-stone-900 dark:bg-amber-500"
          : "bg-stone-800 text-stone-100 dark:bg-stone-950 dark:text-stone-300"
      }`}
      title={jc.meaning}
    >
      {name}日・{label}
    </span>
  );
}

// 通書宜忌詞條：宜硃紅、忌玄墨
function Terms({ list, kind }: { list: string[]; kind: "宜" | "忌" }) {
  if (list.length === 0) return <span className="text-stone-400">—</span>;
  return (
    <span className="inline-flex flex-wrap gap-1 align-middle">
      {list.map((t) => (
        <span
          key={t}
          className={`rounded px-1.5 py-0.5 text-xs ${
            kind === "宜"
              ? "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900"
              : "bg-stone-200 text-stone-700 ring-1 ring-stone-300 dark:bg-stone-700 dark:text-stone-300 dark:ring-stone-600"
          }`}
        >
          {t}
        </span>
      ))}
    </span>
  );
}

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 日期工具：ISO 字串加天數、二日相距（含首尾）
function addDaysStr(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  const p2 = (x: number) => String(x).padStart(2, "0");
  return `${dt.getFullYear()}-${p2(dt.getMonth() + 1)}-${p2(dt.getDate())}`;
}
function spanDays(a: string, b: string): number {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000) + 1;
}

// 多命合參：自由文字中取西元四位年（頓號、逗號、空格皆可分隔）
function parseYears(s: string): number[] {
  return (s.match(/\d{4}/g) ?? []).map(Number);
}

// 生月選單（陽氣陰胎用——原書 107：以節氣為界）
const MONTH_NAMES = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二"];

function MonthSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <select
        className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">不指定</option>
        {MONTH_NAMES.map((n, i) => (
          <option key={i} value={String(i + 1)}>
            {n}月（節氣為界）
          </option>
        ))}
      </select>
    </label>
  );
}

// 座山選單（造作葬事——沖山三殺日課時課共用；正體五行併顯）
// 兼向副選單：座山之左右鄰山（原書 394-395 沖兼、三殺七山用）
function MountainSelect({
  value,
  onChange,
  jian,
  onJian,
}: {
  value: string;
  onChange: (v: string) => void;
  jian?: string;
  onJian?: (v: string) => void;
}) {
  const mi = MOUNTAINS_24.indexOf(value);
  const neighbors = mi >= 0 ? [MOUNTAINS_24[(mi + 23) % 24], MOUNTAINS_24[(mi + 1) % 24]] : [];
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">
        座山——宅舍或墳塋（可留空）
        {value && MOUNTAIN_WX[value] && (
          <span className="ml-2 text-red-600 dark:text-red-400">{value}山屬{MOUNTAIN_WX[value]}（正體五行）</span>
        )}
      </span>
      <div className="flex gap-2">
        <select
          className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onJian?.("");
          }}
        >
          <option value="">不指定</option>
          {([
            ["北（壬子癸）", ["壬", "子", "癸"]],
            ["東北（丑艮寅）", ["丑", "艮", "寅"]],
            ["東（甲卯乙）", ["甲", "卯", "乙"]],
            ["東南（辰巽巳）", ["辰", "巽", "巳"]],
            ["南（丙午丁）", ["丙", "午", "丁"]],
            ["西南（未坤申）", ["未", "坤", "申"]],
            ["西（庚酉辛）", ["庚", "酉", "辛"]],
            ["西北（戌乾亥）", ["戌", "乾", "亥"]],
          ] as [string, string[]][]).map(([label, ms]) => (
            <optgroup key={label} label={label}>
              {ms.map((z) => (
                <option key={z} value={z}>
                  {z}山
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {value && onJian && (
          <select
            className="w-28 shrink-0 rounded border border-stone-300 bg-white px-2 py-2 dark:border-stone-600 dark:bg-stone-900"
            value={jian ?? ""}
            onChange={(e) => onJian(e.target.value)}
            title="兼向——原書 394-395 沖兼、三殺七山之隅"
          >
            <option value="">不兼</option>
            {neighbors.map((z) => (
              <option key={z} value={z}>
                兼{z}
              </option>
            ))}
          </select>
        )}
      </div>
    </label>
  );
}

// 已輸之命列為籤，點×可除——使「可輸多人」一目瞭然
function MingChips({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const years = parseYears(value);
  if (years.length === 0) return null;
  const remove = (idx: number) => {
    let i = -1;
    onChange(value.replace(/\d{4}/g, (m) => (++i === idx ? "" : m)).replace(/[、,，\s]+$/, ""));
  };
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {years.map((y, i) => (
        <span
          key={`${y}-${i}`}
          className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-800 ring-1 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900"
        >
          {y}年　{yearGanOfBirthYear(y)}{yearZhiOfBirthYear(y)}命
          <button
            type="button"
            className="ml-0.5 font-bold text-red-400 hover:text-red-700"
            onClick={() => remove(i)}
            aria-label={`移除 ${y}`}
          >
            ×
          </button>
        </span>
      ))}
      <button
        type="button"
        className="text-xs text-stone-400 underline decoration-dotted hover:text-stone-600"
        onClick={() => onChange(value.trim() ? value.trim() + "、" : value)}
        title="再輸一年即可加人"
      >
        ＋再加一人
      </button>
    </div>
  );
}

// 偏好記存（綱領五）：localStorage、kezhai: 前綴、SSR 安全
function useStoredState(key: string, initial: string) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    const s = localStorage.getItem("kezhai:" + key);
    if (s !== null) setV(s);
  }, [key]);
  const set = (nv: string) => {
    setV(nv);
    try {
      localStorage.setItem("kezhai:" + key, nv);
    } catch {}
  };
  return [v, set] as const;
}

// 法度取捨（綱領二進階摺疊）：停用層存 localStorage（kezhai:offLayers，JSON 陣列）
function useDisabledLayers() {
  const [raw, setRaw] = useStoredState("offLayers", "[]");
  let off: string[] = [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) off = p.filter((x) => typeof x === "string");
  } catch {}
  const toggle = (key: string) => {
    const token = DEFAULT_OFF_LAYERS.includes(key) ? "enable:" + key : key;
    setRaw(JSON.stringify(off.includes(token) ? off.filter((k) => k !== token) : [...off, token]));
  };
  return { off, toggle };
}

function LayerToggles({ event, off, toggle }: { event: EventKey; off: string[]; toggle: (k: string) => void }) {
  return (
    <div className="sm:col-span-2">
      <span className="mb-1 block text-sm font-medium">法度取捨（預設全用）</span>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {layersForEvent(event).map((l) => (
          <label key={l.key} className="flex items-start gap-2 text-sm" title={l.desc}>
            <input
              type="checkbox"
              className="mt-1"
              checked={isLayerOn(l.key, off)}
              onChange={() => toggle(l.key)}
            />
            <span>
              {l.name}
              <span className="block text-xs text-stone-400">{l.desc}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

// 事類分科選擇（綱領三）：二層籤選——科籤一列、事籤一列，
// 廿餘事盡列而恆佔二行，點二下可達，選中恆顯
function EventPicker({ value, onChange }: { value: EventKey; onChange: (e: EventKey) => void }) {
  const currentCat =
    EVENT_CATEGORIES.find((c) => c.events.some((e) => e.key === value))?.category ??
    EVENT_CATEGORIES[0].category;
  const [cat, setCat] = useState(currentCat);
  // 外部（記存）改事類時，科籤隨之
  useEffect(() => setCat(currentCat), [currentCat]);
  const events = EVENT_CATEGORIES.find((c) => c.category === cat)?.events ?? [];
  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {EVENT_CATEGORIES.map((c) => (
          <button
            key={c.category}
            type="button"
            className={`rounded-t-md border-b-2 px-3 py-1.5 text-xs font-medium transition-colors ${
              cat === c.category
                ? "border-red-700 text-red-700 dark:border-red-400 dark:text-red-400"
                : "border-transparent text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
            }`}
            onClick={() => setCat(c.category)}
          >
            {c.category}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {events.map((ev) => (
          <button
            key={ev.key}
            type="button"
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              value === ev.key
                ? "bg-red-700 font-medium text-white"
                : "bg-stone-100 text-stone-700 ring-1 ring-stone-200 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-200 dark:ring-stone-600 dark:hover:bg-stone-600"
            }`}
            onClick={() => onChange(ev.key)}
          >
            {ev.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReasonList({ result }: { result: DayResult }) {
  return (
    <ul className="mt-2 space-y-1 text-sm">
      {result.evaluation.reasons.map((r, i) => (
        <li key={i} className="flex gap-2">
          <span
            className={
              r.kind === "吉"
                ? "shrink-0 text-red-600 dark:text-red-400"
                : r.kind === "凶"
                  ? "shrink-0 font-bold text-stone-900 dark:text-stone-100"
                  : "shrink-0 text-stone-500"
            }
          >
            {r.kind === "注" ? "○" : r.kind}
          </span>
          <span className="text-stone-700 dark:text-stone-300">{r.text}</span>
        </li>
      ))}
    </ul>
  );
}

function DayCard({
  result,
  hourOpts,
}: {
  result: DayResult;
  hourOpts?: { femaleZhi?: string; femaleGan?: string; persons?: { label: string; zhi: string; gan?: string }[]; xianMingZhi?: string; mountainZhi?: string; jianXiang?: string };
}) {
  const { info, evaluation } = result;
  const [open, setOpen] = useState(false);
  const goodHours = useMemo(() => {
    if (!open) return [];
    return evaluateHours(info, hourOpts ?? {}).filter((h) => h.rating === "吉");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, info.dayGanZhi, JSON.stringify(hourOpts)]);
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800">
      <button className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpen(!open)}>
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-sm font-bold ${RATING_STYLE[evaluation.rating]}`}>
              {evaluation.rating}
            </span>
            <span className="text-lg font-semibold">
              {info.solar.y}年{info.solar.m}月{info.solar.d}日
            </span>
            <span className="text-sm text-stone-500">星期{info.solar.week}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600 dark:text-stone-400">
            <span>農曆{info.lunarText}</span>
            <span>{info.dayGanZhi}日</span>
            <JianChuBadge name={info.zhiXing} />
            <span>{info.xiu}宿</span>
          </div>
        </div>
        <span className="mt-1 text-stone-400">{open ? "▲" : "▼"}</span>
      </button>
      <ReasonList result={result} />
      {open && (
        <div className="mt-3 space-y-1.5 border-t border-stone-100 pt-3 text-sm text-stone-600 dark:border-stone-700 dark:text-stone-400">
          <div>干支：{info.yearGanZhi}年　{info.monthGanZhi}月　{info.dayGanZhi}日</div>
          {JIANCHU[info.zhiXing as keyof typeof JIANCHU] && (
            <div>
              建除：{JIANCHU[info.zhiXing as keyof typeof JIANCHU].meaning}
            </div>
          )}
          <div>彭祖百忌：{info.pengZu}</div>
          <div>胎神占方：{info.taiShen}</div>
          <div>沖：{info.chongDesc}</div>
          <div>通書宜：<Terms list={info.yi} kind="宜" /></div>
          <div>通書忌：<Terms list={info.ji} kind="忌" /></div>
          <div>
            吉時：
            {goodHours.length === 0 ? (
              <span className="text-stone-400">是日無純吉之時，詳單日查</span>
            ) : (
              <span className="inline-flex flex-wrap gap-1 align-middle">
                {goodHours.map((h) => (
                  <span
                    key={h.zhi}
                    className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-700 ring-1 ring-red-200 dark:bg-red-950/60 dark:text-red-300 dark:ring-red-900"
                    title={h.reasons.map((r) => r.text).join("；")}
                  >
                    {h.reasons.some((r) => r.text.includes("登天門")) ? "★" : ""}
                    {h.ganZhi}時 {h.range}
                  </span>
                ))}
              </span>
            )}
            <span className="ml-1 text-xs text-stone-400">（★＝貴人登天門，時家最吉）</span>
          </div>
        </div>
      )}
    </div>
  );
}


function Pager({
  page,
  pageCount,
  onPage,
  children,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
  children?: React.ReactNode;
}) {
  if (pageCount <= 1 && !children) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-1 text-sm">
      {pageCount > 1 && (
        <>
          <button
            type="button"
            disabled={page === 0}
            className="rounded border border-stone-300 px-3 py-1 disabled:opacity-40 dark:border-stone-600"
            onClick={() => onPage(page - 1)}
          >
            ‹ 上一頁
          </button>
          <span className="text-stone-500">
            第 {page + 1} / {pageCount} 頁
          </span>
          <button
            type="button"
            disabled={page >= pageCount - 1}
            className="rounded border border-stone-300 px-3 py-1 disabled:opacity-40 dark:border-stone-600"
            onClick={() => onPage(page + 1)}
          >
            下一頁 ›
          </button>
        </>
      )}
      {children}
    </div>
  );
}

function SearchTab() {
  const [eventStr, setEventStr] = useStoredState("event", "jiaqu");
  const event = (eventStr in EVENT_NAMES ? eventStr : "jiaqu") as EventKey;
  const [femaleYear, setFemaleYear] = useStoredState("femaleYear", "");
  const [birthYear, setBirthYear] = useStoredState("birthYear", "");
  const [start, setStart] = useState(todayStr());
  const [daysStr, setDaysStr] = useStoredState("days", "90");
  const days = Number(daysStr) || 90;
  const [showPing, setShowPing] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSizeStr, setPageSizeStr] = useStoredState("pageSize", "10");
  const pageSize = [10, 20, 50].includes(Number(pageSizeStr)) ? Number(pageSizeStr) : 10;
  const [results, setResults] = useState<DayResult[] | null>(null);
  const [error, setError] = useState("");
  const [mountain, setMountain] = useStoredState("mountain", "");
  const [jianXiang, setJianXiang] = useStoredState("jianXiang", "");
  const [xianMing, setXianMing] = useStoredState("xianMing", "");
  const [femaleMonth, setFemaleMonth] = useStoredState("femaleMonth", "");
  const [birthMonth, setBirthMonth] = useStoredState("birthMonth", "");
  const { off, toggle } = useDisabledLayers();
  const ming = eventDef(event).mingInput;
  const isZaoZuo = ["dongtu", "xiuzao", "xiufang", "shangliang", "ruzhai", "anzang", "potu", "qizan", "xiufen", "juejing", "zuozao", "anmen", "libei", "kaishengfen", "xietu", "yixi", "qiji", "gaiwu"].includes(event);
  const isZang = ["anzang", "potu", "qizan", "xiufen", "rulian", "yijiu", "libei", "kaishengfen"].includes(event);

  const run = () => {
    setError("");
    if (ming === "female" && !/^\d{4}$/.test(femaleYear)) {
      setError("婚事（納采、嫁娶）須輸入女命生年（西元四位數）以推利月、沖煞");
      return;
    }
    const [y, m, d] = start.split("-").map(Number);
    setResults(
      findAuspiciousDays({
        start: new Date(y, m - 1, d),
        days,
        event,
        femaleBirthYear: femaleYear ? Number(femaleYear) : undefined,
        birthYears: parseYears(birthYear),
        mountainZhi: isZaoZuo && mountain ? mountain : undefined,
        jianXiang: isZaoZuo && mountain && jianXiang ? jianXiang : undefined,
        xianMingYear: isZang && /^\d{4}$/.test(xianMing) ? Number(xianMing) : undefined,
        femaleBirthMonth: event === "anchuang" && femaleMonth ? Number(femaleMonth) : undefined,
        birthMonth: event === "anchuang" && birthMonth ? Number(birthMonth) : undefined,
        disabledLayers: off,
      }),
    );
  };

  const shown = useMemo(
    () =>
      (results ?? []).filter((r) =>
        showPing ? r.evaluation.rating !== "凶" : r.evaluation.rating === "吉",
      ),
    [results, showPing],
  );
  useEffect(() => setPage(0), [results, showPing, pageSize]);
  const pageCount = Math.max(1, Math.ceil(shown.length / pageSize));
  const pageItems = shown.slice(page * pageSize, (page + 1) * pageSize);
  const sizeChips = (
    <span className="ml-2 flex items-center gap-1 text-xs text-stone-400">
      每頁
      {[10, 20, 50].map((n) => (
        <button
          key={n}
          type="button"
          className={`rounded-full px-2 py-0.5 transition-colors ${
            pageSize === n
              ? "bg-red-700 text-white"
              : "bg-stone-100 text-stone-600 ring-1 ring-stone-200 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:ring-stone-600"
          }`}
          onClick={() => setPageSizeStr(String(n))}
        >
          {n}
        </button>
      ))}
    </span>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800">
        <div className="space-y-3">
          <div className="block text-sm">
            <span className="mb-1 block font-medium">事類</span>
            <EventPicker value={event} onChange={(k) => setEventStr(k)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
          {ming === "female" && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">
                女命生年（西元）
                {/^\d{4}$/.test(femaleYear) && (
                  <span className="ml-2 text-red-600 dark:text-red-400">
                    {yearZhiOfBirthYear(Number(femaleYear))}命
                  </span>
                )}
              </span>
              <input
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
                placeholder="例：1998"
                inputMode="numeric"
                value={femaleYear}
                onChange={(e) => setFemaleYear(e.target.value)}
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="mb-1 block font-medium">
              {ming === "female" ? "男方等生年（可多人）" : "本命生年（可多人）"}
              {parseYears(birthYear).length > 1 && (
                <span className="ml-2 text-red-600 dark:text-red-400">
                  {parseYears(birthYear).length}命合參
                </span>
              )}
            </span>
            <input
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              placeholder={ming === "female" ? "例：1996（男方）" : "例：1990、1965"}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            />
            <MingChips value={birthYear} onChange={setBirthYear} />
          </label>
          {isZang && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">
                仙命（亡者生年，可留空）
                {/^\d{4}$/.test(xianMing) && (
                  <span className="ml-2 text-red-600 dark:text-red-400">
                    {yearGanOfBirthYear(Number(xianMing))}{yearZhiOfBirthYear(Number(xianMing))}命
                  </span>
                )}
              </span>
              <input
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
                placeholder="例：1938"
                inputMode="numeric"
                value={xianMing}
                onChange={(e) => setXianMing(e.target.value)}
              />
            </label>
          )}
          {event === "anchuang" && (
            <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">女命生年（陰胎，可留空）</span>
                <input
                  className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
                  placeholder="例：1998"
                  inputMode="numeric"
                  value={femaleYear}
                  onChange={(e) => setFemaleYear(e.target.value)}
                />
              </label>
              <MonthSelect label="女命生月（陰胎）" value={femaleMonth} onChange={setFemaleMonth} />
              <MonthSelect label="本命生月（陽氣）" value={birthMonth} onChange={setBirthMonth} />
            </>
          )}
          </div>
          <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">起始日</span>
            <input
              type="date"
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">
              終止日
              <span className="ml-2 text-xs font-normal text-stone-400">共{days}日</span>
            </span>
            <input
              type="date"
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              min={start}
              value={addDaysStr(start, days - 1)}
              onChange={(e) => {
                if (!e.target.value) return;
                const n = spanDays(start, e.target.value);
                setDaysStr(String(Math.min(366, Math.max(1, n))));
              }}
            />
            <div className="mt-1.5 flex flex-wrap gap-1">
              {([["卅日", 30], ["六十日", 60], ["九十日", 90], ["半年", 180], ["一年", 366]] as [string, number][]).map(
                ([label, n]) => (
                  <button
                    key={n}
                    type="button"
                    className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                      days === n
                        ? "bg-red-700 text-white"
                        : "bg-stone-100 text-stone-600 ring-1 ring-stone-200 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:ring-stone-600"
                    }`}
                    onClick={() => setDaysStr(String(n))}
                  >
                    {label}
                  </button>
                ),
              )}
            </div>
          </label>
          </div>
        </div>
        {/* 進階摺疊（綱領二）：宅舍座山（造作事）＋法度取捨 */}
        <details className="mt-3" open={off.length > 0 || (isZaoZuo && !!mountain)}>
          <summary className="cursor-pointer select-none text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300">
            進階選項{off.filter((k) => !k.startsWith("enable:")).length > 0 && <span className="ml-2 text-red-600 dark:text-red-400">（停用{off.filter((k) => !k.startsWith("enable:")).length}層）</span>}
          </summary>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {isZaoZuo && <MountainSelect value={mountain} onChange={setMountain} jian={jianXiang} onJian={setJianXiang} />}
            <LayerToggles event={event} off={off} toggle={toggle} />
          </div>
        </details>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          className="mt-4 w-full rounded-lg bg-red-700 py-2.5 font-semibold text-white hover:bg-red-800 sm:w-auto sm:px-8"
          onClick={run}
        >
          尋吉日
        </button>
      </div>

      {results && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {results.length}日之中，得吉日{" "}
              <span className="font-bold text-red-600 dark:text-red-400">
                {results.filter((r) => r.evaluation.rating === "吉").length}
              </span>{" "}
              日
            </p>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={showPing} onChange={(e) => setShowPing(e.target.checked)} />
              兼列平日
            </label>
          </div>
          {shown.length === 0 && (
            <p className="rounded-lg border border-stone-200 bg-white p-6 text-center text-stone-500 dark:border-stone-700 dark:bg-stone-800">
              範圍之內無吉日。可展範圍再尋。
            </p>
          )}
          <Pager page={page} pageCount={pageCount} onPage={setPage}>{sizeChips}</Pager>
          <div className="space-y-3">
            {pageItems.map((r) => (
              <DayCard
                key={`${r.info.solar.y}-${r.info.solar.m}-${r.info.solar.d}`}
                result={r}
                hourOpts={{
                  femaleZhi:
                    ming === "female" && /^\d{4}$/.test(femaleYear)
                      ? yearZhiOfBirthYear(Number(femaleYear))
                      : undefined,
                  femaleGan:
                    ming === "female" && /^\d{4}$/.test(femaleYear)
                      ? yearGanOfBirthYear(Number(femaleYear))
                      : undefined,
                  persons: personsOfYears(parseYears(birthYear)).map((p) => ({
                    label: `${p.year}（${p.zhi}）命`,
                    zhi: p.zhi,
                    gan: p.gan,
                  })),
                  xianMingZhi:
                    isZang && /^\d{4}$/.test(xianMing) ? yearZhiOfBirthYear(Number(xianMing)) : undefined,
                  mountainZhi: isZaoZuo && mountain ? mountain : undefined,
                  jianXiang: isZaoZuo && mountain && jianXiang ? jianXiang : undefined,
                }}
              />
            ))}
          </div>
          <Pager page={page} pageCount={pageCount} onPage={setPage}>{sizeChips}</Pager>
        </>
      )}
    </div>
  );
}

function DayTab() {
  const [date, setDate] = useState(todayStr());
  const [femaleYear, setFemaleYear] = useStoredState("femaleYear", "");
  const [birthYear, setBirthYear] = useStoredState("birthYear", "");
  const [dayCat, setDayCat] = useStoredState("dayCat", "全部");
  const [dayRating, setDayRating] = useState("全");
  const [xianMing, setXianMing] = useStoredState("xianMing", "");
  const [femaleMonth, setFemaleMonth] = useStoredState("femaleMonth", "");
  const [birthMonth, setBirthMonth] = useStoredState("birthMonth", "");
  const [mountain, setMountain] = useStoredState("mountain", "");
  const [jianXiang, setJianXiang] = useStoredState("jianXiang", "");
  const { off } = useDisabledLayers();
  const showFemale = dayCat === "全部" || dayCat === "婚嫁家室";
  const showXian = dayCat === "全部" || dayCat === "造葬";
  const showMountain = dayCat === "全部" || dayCat === "居家造作" || dayCat === "造葬";

  const results = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return null;
    const fy = showFemale && /^\d{4}$/.test(femaleYear) ? Number(femaleYear) : undefined;
    const xy = showXian && /^\d{4}$/.test(xianMing) ? Number(xianMing) : undefined;
    const persons = personsOfYears(parseYears(birthYear));
    return (Object.keys(EVENT_NAMES) as EventKey[]).map((ev) =>
      queryDay(y, m, d, ev, {
        femaleBirthZhi: fy ? yearZhiOfBirthYear(fy) : undefined,
        femaleBirthGan: fy ? yearGanOfBirthYear(fy) : undefined,
        birthZhi: persons[0]?.zhi,
        birthGan: persons[0]?.gan,
        persons,
        xianMingZhi: xy ? yearZhiOfBirthYear(xy) : undefined,
        xianMingGan: xy ? yearGanOfBirthYear(xy) : undefined,
        femaleBirthMonth: fy && femaleMonth ? Number(femaleMonth) : undefined,
        birthMonth: persons[0] && birthMonth ? Number(birthMonth) : undefined,
        mountainZhi: showMountain && mountain ? mountain : undefined,
        jianXiang: showMountain && mountain && jianXiang ? jianXiang : undefined,
        disabledLayers: off,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, femaleYear, birthYear, xianMing, femaleMonth, birthMonth, mountain, jianXiang, showFemale, showXian, showMountain, JSON.stringify(off)]);

  const info = results?.[0]?.info;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {["全部", ...EVENT_CATEGORIES.map((c) => c.category)].map((c) => (
          <button
            key={c}
            type="button"
            className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
              dayCat === c
                ? "bg-red-700 font-medium text-white"
                : "bg-stone-100 text-stone-600 ring-1 ring-stone-200 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:ring-stone-600"
            }`}
            onClick={() => setDayCat(c)}
          >
            {c}
          </button>
        ))}
        <span className="mx-1 text-stone-300">｜</span>
        {["全", "吉", "平", "凶"].map((rt) => (
          <button
            key={rt}
            type="button"
            className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
              dayRating === rt
                ? "bg-stone-800 font-medium text-white dark:bg-stone-200 dark:text-stone-900"
                : "bg-stone-100 text-stone-600 ring-1 ring-stone-200 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:ring-stone-600"
            }`}
            onClick={() => setDayRating(rt)}
          >
            {rt}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">日期</span>
            <input
              type="date"
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          {showFemale && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">女命生年（婚事）</span>
              <input
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
                placeholder="例：1998"
                inputMode="numeric"
                value={femaleYear}
                onChange={(e) => setFemaleYear(e.target.value)}
              />
            </label>
          )}
          {showFemale && (
            <>
              <MonthSelect label="女命生月（安牀陰胎）" value={femaleMonth} onChange={setFemaleMonth} />
              <MonthSelect label="本命生月（安牀陽氣）" value={birthMonth} onChange={setBirthMonth} />
            </>
          )}
          <label className="block text-sm">
            <span className="mb-1 block font-medium">本命生年（可多人）</span>
            <input
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              placeholder="例：1990、1965"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            />
            <MingChips value={birthYear} onChange={setBirthYear} />
          </label>
          {showXian && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">仙命（亡者生年，可留空）</span>
              <input
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
                placeholder="例：1938"
                inputMode="numeric"
                value={xianMing}
                onChange={(e) => setXianMing(e.target.value)}
              />
            </label>
          )}
          {showMountain && <MountainSelect value={mountain} onChange={setMountain} jian={jianXiang} onJian={setJianXiang} />}
        </div>
      </div>

      {info && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          <div className="text-lg font-semibold">
            {info.solar.y}年{info.solar.m}月{info.solar.d}日　星期{info.solar.week}
          </div>
          <div className="mt-1 text-sm text-stone-700 dark:text-stone-300">農曆{info.lunarText}</div>
          <div className="mt-2 grid gap-x-6 gap-y-1.5 text-sm text-stone-700 sm:grid-cols-2 dark:text-stone-300">
            <div>干支：{info.yearGanZhi}年 {info.monthGanZhi}月 {info.dayGanZhi}日</div>
            <div>二十八宿：{info.xiu}宿</div>
            <div>彭祖百忌：{info.pengZu}</div>
            <div>胎神占方：{info.taiShen}</div>
            <div>沖：{info.chongDesc}</div>
            <div className="sm:col-span-2">吉神方位：{info.jiFang}</div>
            <div className="sm:col-span-2">
              流年方位（{info.yearGanZhi}年）：{nianDaFang(info.yearGanZhi.charAt(1))}
              <span className="ml-1 text-xs text-stone-400">（歲內恆忌，造葬修方尤重）</span>
            </div>
            <div className="sm:col-span-2">
              流年凶方：{nianXiongFang(info.yearGanZhi.charAt(1))}
              <span className="ml-1 text-xs text-stone-400">（原書 106：安床置產諸事避之）</span>
            </div>
            <div className="sm:col-span-2">通書宜：<Terms list={info.yi} kind="宜" /></div>
            <div className="sm:col-span-2">通書忌：<Terms list={info.ji} kind="忌" /></div>
            {info.jieQi && <div>節氣：{info.jieQi}</div>}
          </div>
          {JIANCHU[info.zhiXing as keyof typeof JIANCHU] && (
            <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl font-bold">{info.zhiXing}</span>
                <JianChuBadge name={info.zhiXing} />
                <span className="text-xs text-stone-500 dark:text-stone-400">建除十二神</span>
              </div>
              <p className="mt-1.5 text-sm text-stone-700 dark:text-stone-300">
                {JIANCHU[info.zhiXing as keyof typeof JIANCHU].meaning}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-medium text-red-700 dark:text-red-400">宜</span>
                {JIANCHU[info.zhiXing as keyof typeof JIANCHU].yi}
                <span className="ml-4 font-medium text-stone-800 dark:text-stone-200">忌</span>
                {JIANCHU[info.zhiXing as keyof typeof JIANCHU].ji}
              </p>
            </div>
          )}
        </div>
      )}

      {info && (
        <HoursGrid
          info={info}
          femaleZhi={/^\d{4}$/.test(femaleYear) ? yearZhiOfBirthYear(Number(femaleYear)) : undefined}
          femaleGan={/^\d{4}$/.test(femaleYear) ? yearGanOfBirthYear(Number(femaleYear)) : undefined}
          persons={personsOfYears(parseYears(birthYear)).map((p) => ({ label: `${p.year}（${p.zhi}）命`, zhi: p.zhi, gan: p.gan }))}
          xianMingZhi={showXian && /^\d{4}$/.test(xianMing) ? yearZhiOfBirthYear(Number(xianMing)) : undefined}
          mountainZhi={showMountain && mountain ? mountain : undefined}
          jianXiang={showMountain && mountain && jianXiang ? jianXiang : undefined}
        />
      )}

      <div className="space-y-3">
        {results?.map((r, i) => {
          const key = (Object.keys(EVENT_NAMES) as EventKey[])[i];
          const cat = EVENT_CATEGORIES.find((c) => c.events.some((e) => e.key === key))?.category;
          if (dayCat !== "全部" && cat !== dayCat) return null;
          if (dayRating !== "全" && r.evaluation.rating !== dayRating) return null;
          return (
            <div
              key={i}
              className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800"
            >
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-sm font-bold ${RATING_STYLE[r.evaluation.rating]}`}>
                  {r.evaluation.rating}
                </span>
                <span className="text-lg font-semibold">{EVENT_NAMES[key]}</span>
                <span className="text-xs text-stone-400">{cat}</span>
              </div>
              <ReasonList result={r} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 卦圖：陽爻實畫、陰爻斷畫，自上而下列六爻（初爻在底）
const YAO_NAMES = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];

function HexagramFigure({ upper, lower, yaos }: { upper: Gua; lower: Gua; yaos: Yao[] }) {
  const lines = hexagramLines(upper, lower); // 自初而上
  return (
    <div className="space-y-1.5">
      {[5, 4, 3, 2, 1, 0].map((i) => {
        const y = yaos[i];
        const special = y && (y.liuQin === "官鬼" || y.liuQin === "子孫");
        return (
          <div key={i} className="flex items-center gap-3">
            <div className={`flex w-20 shrink-0 gap-1.5 ${special ? "text-amber-600 dark:text-amber-400" : "text-stone-800 dark:text-stone-200"}`}>
              {lines[i] ? (
                <span className="h-2 w-full rounded-sm bg-current" />
              ) : (
                <>
                  <span className="h-2 w-1/2 rounded-sm bg-current" style={{ marginRight: "0.35rem" }} />
                  <span className="h-2 w-1/2 rounded-sm bg-current" />
                </>
              )}
            </div>
            {yaos.length > 0 && (
              <>
                <span className="w-9 shrink-0 text-xs text-stone-400">{YAO_NAMES[i]}</span>
                {y && (
                  <span className={`text-sm ${special ? "font-medium text-amber-700 dark:text-amber-400" : "text-stone-600 dark:text-stone-400"}`}>
                    {y.ganZhi}　{y.liuQin}
                  </span>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// 合婚（原書第二期）：排山掌起體用二卦，體管前三十年、用管後三十年
function HehunTab() {
  const [femaleYear, setFemaleYear] = useStoredState("femaleYear", "");
  const [maleYear, setMaleYear] = useStoredState("hehunMale", "");
  const fy = /^\d{4}$/.test(femaleYear) ? Number(femaleYear) : undefined;
  const my = /^\d{4}$/.test(maleYear) ? Number(maleYear) : undefined;
  const result =
    fy && my
      ? heHun(yearGanOfBirthYear(fy), yearZhiOfBirthYear(fy), yearGanOfBirthYear(my), yearZhiOfBirthYear(my))
      : null;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">
              女命生年（西元）
              {fy && (
                <span className="ml-2 text-red-600 dark:text-red-400">
                  {yearGanOfBirthYear(fy)}{yearZhiOfBirthYear(fy)}命
                </span>
              )}
            </span>
            <input
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              placeholder="例：1998"
              inputMode="numeric"
              value={femaleYear}
              onChange={(e) => setFemaleYear(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">
              男命生年（西元）
              {my && (
                <span className="ml-2 text-red-600 dark:text-red-400">
                  {yearGanOfBirthYear(my)}{yearZhiOfBirthYear(my)}命
                </span>
              )}
            </span>
            <input
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              placeholder="例：1996"
              inputMode="numeric"
              value={maleYear}
              onChange={(e) => setMaleYear(e.target.value)}
            />
          </label>
        </div>
      </div>

      {result && (
        <>
          <div
            className={`rounded-lg border p-5 ${
              result.verdict === "吉"
                ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
                : result.verdict === "凶"
                  ? "border-stone-400 bg-stone-100 dark:border-stone-600 dark:bg-stone-800"
                  : "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-sm font-bold ${RATING_STYLE[result.verdict]}`}>
                {result.verdict}
              </span>
              <span className="text-lg font-bold">{result.relation}</span>
            </div>
            <p className="mt-2 text-sm text-stone-700 dark:text-stone-300">{result.text}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800">
              <div className="text-sm text-stone-500">體卦（過門後前三十年之運）</div>
              <div className="mt-1 font-serif text-2xl font-bold">{result.tiGua}</div>
              <div className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {result.tiPalace}宮・{result.tiWuXing}　｜　女{result.femaleGua}上・男{result.maleGua}下
                （男命泊{result.malePalace}）
              </div>
            </div>
            <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800">
              <div className="text-sm text-stone-500">用卦（後三十年之運）</div>
              <div className="mt-1 flex items-center gap-4">
                <div className="font-serif text-2xl font-bold">{result.yongGua}</div>
                <HexagramFigure upper={result.yongUpper} lower={result.maleGua} yaos={[]} />
              </div>
              <div className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {result.yongPalace}宮・{result.yongWuXing}　｜　女支{result.yongUpper}上・男{result.maleGua}下
                （一卦管三山）
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800">
            <div className="text-sm font-medium">
              體卦六爻　<span className="font-serif text-base">{result.tiGua}</span>
              <span className="ml-2 text-xs font-normal text-stone-400">
                渾天甲子，初爻在底，一爻管五年
              </span>
            </div>
            <div className="mt-3">
              <HexagramFigure upper={result.femaleGua} lower={result.maleGua} yaos={result.yaos} />
            </div>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              {result.guanYao.length || result.ziYao.length ? (
                <>
                  官鬼爻{result.guanYao.length ? `（${result.guanYao.join("、")}）` : "不現"}、
                  子孫爻{result.ziYao.length ? `（${result.ziYao.join("、")}）` : "不現"}——
                  原書例五：婚日勿沖刑此二爻。
                  {result.jiChongZhi.length > 0 && (
                    <>
                      故婚期<span className="font-medium text-red-700 dark:text-red-400">
                        忌{result.jiChongZhi.join("、")}日
                      </span>（沖爻之支）。
                    </>
                  )}
                </>
              ) : (
                "官鬼、子孫二爻不現於卦，選日依常法。"
              )}
            </p>
          </div>
          <p className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600 shadow-sm dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400">
            原書斷法（書 149）：體用二卦共管六十年，一爻管五年。查官子二爻受病何處，
            選日吊合以解救補助——遇祿、馬、貴人則吉；白虎、沖、刑、刃、空亡則凶。
            婚期請至「尋吉日」以女命入嫁娶並參。
          </p>
        </>
      )}
      {!result && (
        <p className="rounded-lg border border-stone-200 bg-white p-6 text-center text-stone-500 dark:border-stone-700 dark:bg-stone-800">
          入男女二命生年，依《剋擇講義》排山掌起體用二卦。
        </p>
      )}
    </div>
  );
}

// 十二時辰吉凶（時課之門）：貴登天門、祿貴馬合為吉；時破五不遇沖命埋兒為凶
function HoursGrid({
  info,
  femaleZhi,
  femaleGan,
  persons,
  xianMingZhi,
  mountainZhi,
  jianXiang,
}: {
  info: ReturnType<typeof queryDay>["info"];
  femaleZhi?: string;
  femaleGan?: string;
  persons: { label: string; zhi: string; gan?: string }[];
  xianMingZhi?: string;
  mountainZhi?: string;
  jianXiang?: string;
}) {
  const hours = useMemo(
    () => evaluateHours(info, { femaleZhi, femaleGan, persons, xianMingZhi, mountainZhi, jianXiang }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [info.dayGanZhi, info.solar.y, info.solar.m, info.solar.d, femaleZhi, femaleGan, xianMingZhi, mountainZhi, jianXiang, JSON.stringify(persons)],
  );
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800">
      <div className="text-sm font-medium">
        十二時辰吉凶
        <span className="ml-2 text-xs font-normal text-stone-400">
          貴登天門為時家最吉（原書 224）；命造欄有入則並判沖命、埋兒凶時；座山有入則並判時沖山、時三殺
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {hours.map((h) => (
          <div
            key={h.zhi}
            className={`rounded border p-2 text-sm ${
              h.rating === "吉"
                ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40"
                : h.rating === "凶"
                  ? "border-stone-300 bg-stone-100 dark:border-stone-600 dark:bg-stone-900"
                  : "border-stone-200 dark:border-stone-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {h.ganZhi}時
                <span className="ml-1 text-xs text-stone-400">{h.range}</span>
              </span>
              <span className={`rounded px-1.5 text-xs font-bold ${RATING_STYLE[h.rating]}`}>
                {h.rating}
              </span>
            </div>
            {h.reasons.length > 0 && (
              <div className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                {h.reasons.map((r) => r.text.split("（")[0]).join("・")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("search");
  const tabs: { key: Tab; label: string }[] = [
    { key: "search", label: "尋吉日" },
    { key: "day", label: "單日查" },
    { key: "hehun", label: "合婚" },
  ];
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 pb-16">
      <header className="py-6 text-center">
        <h1 className="font-serif text-3xl font-bold tracking-widest text-red-800 dark:text-red-400">
          剋擇擇日
        </h1>
        <p className="mt-1 text-sm text-stone-500">依《剋擇講義》・嫁娶　安牀　出行</p>
      </header>
      <nav className="mb-5 flex rounded-lg border border-stone-200 bg-white p-1 shadow-sm dark:border-stone-700 dark:bg-stone-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-red-700 text-white"
                : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-700"
            }`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === "search" && <SearchTab />}
      {tab === "day" && <DayTab />}
      {tab === "hehun" && <HehunTab />}
      <footer className="mt-10 text-center text-xs text-stone-400">
        擇日之法門派多有異同，本檢僅供參考。
      </footer>
    </main>
  );
}
