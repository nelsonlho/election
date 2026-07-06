"use client";

import { useEffect, useMemo, useState } from "react";
import { findAuspiciousDays, queryDay, personsOfYears, DayResult } from "@/lib/engine";
import { EventKey, EVENT_NAMES, EVENT_CATEGORIES, eventDef, layersForEvent, Rating } from "@/lib/events";
import { JIANCHU, JIANCHU_ORDER } from "@/lib/jianchu";
import { yearZhiOfBirthYear, yearGanOfBirthYear } from "@/lib/almanac";
import { heHun, hexagramLines } from "@/lib/hehun";
import type { Yao, Gua } from "@/lib/hehun";
import { evaluateHours } from "@/lib/hours";

type Tab = "search" | "day" | "hehun" | "theory";

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

// 多命合參：自由文字中取西元四位年（頓號、逗號、空格皆可分隔）
function parseYears(s: string): number[] {
  return (s.match(/\d{4}/g) ?? []).map(Number);
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
  const toggle = (key: string) =>
    setRaw(JSON.stringify(off.includes(key) ? off.filter((k) => k !== key) : [...off, key]));
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
              checked={!off.includes(l.key)}
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

// 事類分科選單（綱領三）：由 EVENT_CATEGORIES 自動生成
function EventSelect({ value, onChange }: { value: EventKey; onChange: (e: EventKey) => void }) {
  return (
    <select
      className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
      value={value}
      onChange={(e) => onChange(e.target.value as EventKey)}
    >
      {EVENT_CATEGORIES.map((c) => (
        <optgroup key={c.category} label={c.category}>
          {c.events.map((ev) => (
            <option key={ev.key} value={ev.key}>
              {ev.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
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

function DayCard({ result }: { result: DayResult }) {
  const { info, evaluation } = result;
  const [open, setOpen] = useState(false);
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
        </div>
      )}
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
  const [results, setResults] = useState<DayResult[] | null>(null);
  const [error, setError] = useState("");
  const [mountain, setMountain] = useStoredState("mountain", "");
  const [xianMing, setXianMing] = useStoredState("xianMing", "");
  const { off, toggle } = useDisabledLayers();
  const ming = eventDef(event).mingInput;
  const isZaoZuo = ["dongtu", "xiuzao", "shangliang", "ruzhai", "anzang", "potu"].includes(event);
  const isZang = event === "anzang" || event === "potu";

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
        xianMingYear: isZang && /^\d{4}$/.test(xianMing) ? Number(xianMing) : undefined,
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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">事類</span>
            <EventSelect value={event} onChange={(k) => setEventStr(k)} />
          </label>
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
              {ming === "female" ? "男方等生年（可多人，可留空）" : "本命生年（可多人，可留空）"}
              {parseYears(birthYear).length > 1 && (
                <span className="ml-2 text-red-600 dark:text-red-400">
                  {parseYears(birthYear).length}命合參
                </span>
              )}
            </span>
            <input
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              placeholder={ming === "female" ? "例：1996（男方；東家夥友亦可並列）" : "例：1990、1965（東家數人可並列）"}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            />
            <MingChips value={birthYear} onChange={setBirthYear} />
          </label>
          {isZang && (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">
                仙命——亡者生年（可留空）
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
            <span className="mb-1 block font-medium">尋日範圍</span>
            <select
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              value={days}
              onChange={(e) => setDaysStr(e.target.value)}
            >
              <option value={30}>三十日</option>
              <option value={60}>六十日</option>
              <option value={90}>九十日</option>
              <option value={180}>一百八十日</option>
              <option value={366}>一年</option>
            </select>
          </label>
        </div>
        {/* 進階摺疊（綱領二）：宅舍座山（造作事）＋法度取捨 */}
        <details className="mt-3" open={off.length > 0 || (isZaoZuo && !!mountain)}>
          <summary className="cursor-pointer select-none text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300">
            進階選項{off.length > 0 && <span className="ml-2 text-red-600 dark:text-red-400">（停用{off.length}層）</span>}
          </summary>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {isZaoZuo && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium">座山——宅舍或墳塋（可留空）</span>
                <select
                  className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
                  value={mountain}
                  onChange={(e) => setMountain(e.target.value)}
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
              </label>
            )}
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
          <div className="space-y-3">
            {shown.map((r) => (
              <DayCard key={`${r.info.solar.y}-${r.info.solar.m}-${r.info.solar.d}`} result={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DayTab() {
  const [date, setDate] = useState(todayStr());
  const [femaleYear, setFemaleYear] = useStoredState("femaleYear", "");
  const [birthYear, setBirthYear] = useStoredState("birthYear", "");
  const { off } = useDisabledLayers();

  const results = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return null;
    const fy = /^\d{4}$/.test(femaleYear) ? Number(femaleYear) : undefined;
    const persons = personsOfYears(parseYears(birthYear));
    return (Object.keys(EVENT_NAMES) as EventKey[]).map((ev) =>
      queryDay(y, m, d, ev, {
        femaleBirthZhi: fy ? yearZhiOfBirthYear(fy) : undefined,
        femaleBirthGan: fy ? yearGanOfBirthYear(fy) : undefined,
        birthZhi: persons[0]?.zhi,
        birthGan: persons[0]?.gan,
        persons,
        disabledLayers: off,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, femaleYear, birthYear, JSON.stringify(off)]);

  const info = results?.[0]?.info;

  return (
    <div className="space-y-4">
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
          <label className="block text-sm">
            <span className="mb-1 block font-medium">女命生年（嫁娶，可留空）</span>
            <input
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              placeholder="例：1998"
              inputMode="numeric"
              value={femaleYear}
              onChange={(e) => setFemaleYear(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">本命生年（可多人，可留空）</span>
            <input
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              placeholder="例：1990、1965"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            />
            <MingChips value={birthYear} onChange={setBirthYear} />
          </label>
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
          persons={personsOfYears(parseYears(birthYear)).map((p) => ({ label: `${p.year}（${p.zhi}）命`, zhi: p.zhi }))}
        />
      )}

      <div className="space-y-3">
        {results?.map((r, i) => (
          <div
            key={i}
            className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800"
          >
            <div className="flex items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-sm font-bold ${RATING_STYLE[r.evaluation.rating]}`}>
                {r.evaluation.rating}
              </span>
              <span className="text-lg font-semibold">
                {EVENT_NAMES[(Object.keys(EVENT_NAMES) as EventKey[])[i]]}
              </span>
            </div>
            <ReasonList result={r} />
          </div>
        ))}
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
  persons,
}: {
  info: ReturnType<typeof queryDay>["info"];
  femaleZhi?: string;
  persons: { label: string; zhi: string }[];
}) {
  const hours = useMemo(
    () => evaluateHours(info, { femaleZhi, persons }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [info.dayGanZhi, info.solar.y, info.solar.m, info.solar.d, femaleZhi, JSON.stringify(persons)],
  );
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800">
      <div className="text-sm font-medium">
        十二時辰吉凶
        <span className="ml-2 text-xs font-normal text-stone-400">
          貴登天門為時家最吉（原書 224）；命造欄有入則並判沖命、埋兒凶時
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

function TheoryTab() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/40">
        <h2 className="text-lg font-bold">十二建除擇日理論</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          建除十二神——建、除、滿、平、定、執、破、危、成、收、開、閉——逐日輪值，隨月建而起：
          月建之日起「建」，翌日「除」，以次順行；交節之日重複前一神。十二神各司吉凶，為擇日之綱。
        </p>
        <p className="mt-3 rounded bg-white/70 p-3 text-center font-serif text-base dark:bg-stone-900/50">
          建滿平收黑，除危定執黃，
          <br />
          成開皆可用，破閉不相當。
        </p>
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
          黑者黑道，用事多凶；黃者黃道，用事多吉；成開百事可行；破閉大事勿用。
          然一日吉凶仍須合月家神煞、本命沖煞並參，不可執一而斷。
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {JIANCHU_ORDER.map((name) => {
          const jc = JIANCHU[name];
          const luckColor =
            jc.luck === "黃" || jc.luck === "可用"
              ? "bg-amber-400 text-stone-900 dark:bg-amber-500"
              : "bg-stone-800 text-stone-100 dark:bg-stone-950 dark:text-stone-300";
          return (
            <div
              key={name}
              className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-700 dark:bg-stone-800"
            >
              <div className="flex items-center gap-2">
                <span className="font-serif text-2xl font-bold">{name}</span>
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${luckColor}`}>{jc.luck}</span>
              </div>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{jc.meaning}</p>
              <p className="mt-2 text-sm">
                <span className="font-medium text-red-700 dark:text-red-400">宜</span>　{jc.yi}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-medium text-stone-800 dark:text-stone-200">忌</span>　{jc.ji}
              </p>
            </div>
          );
        })}
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
    { key: "theory", label: "建除理論" },
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
      {tab === "theory" && <TheoryTab />}
      <footer className="mt-10 text-center text-xs text-stone-400">
        擇日之法門派多有異同，本檢僅供參考。
      </footer>
    </main>
  );
}
