"use client";

import { useEffect, useMemo, useState } from "react";
import { findAuspiciousDays, queryDay, DayResult } from "@/lib/engine";
import { EventKey, EVENT_NAMES, EVENT_CATEGORIES, eventDef, Rating } from "@/lib/events";
import { JIANCHU, JIANCHU_ORDER } from "@/lib/jianchu";
import { yearZhiOfBirthYear, yearGanOfBirthYear } from "@/lib/almanac";

type Tab = "search" | "day" | "theory";

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
  const ming = eventDef(event).mingInput;
  const isZaoZuo = ["dongtu", "xiuzao", "shangliang", "ruzhai"].includes(event);

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
        birthYear: birthYear ? Number(birthYear) : undefined,
        mountainZhi: isZaoZuo && mountain ? mountain : undefined,
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
          {ming === "female" ? (
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
          ) : (
            <label className="block text-sm">
              <span className="mb-1 block font-medium">本命生年（西元，可留空）</span>
              <input
                className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
                placeholder="例：1990"
                inputMode="numeric"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
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
        {/* 進階摺疊（綱領二）：造作事類可指宅舍座山（原書沖山、三殺例用） */}
        {isZaoZuo && (
          <details className="mt-3" open={!!mountain}>
            <summary className="cursor-pointer select-none text-sm text-stone-500 hover:text-stone-700 dark:hover:text-stone-300">
              進階選項
            </summary>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">宅舍座山（可留空）</span>
                <select
                  className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
                  value={mountain}
                  onChange={(e) => setMountain(e.target.value)}
                >
                  <option value="">不指定</option>
                  {["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"].map((z) => (
                    <option key={z} value={z}>
                      {z}山
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </details>
        )}
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

  const results = useMemo(() => {
    const [y, m, d] = date.split("-").map(Number);
    if (!y || !m || !d) return null;
    const fy = /^\d{4}$/.test(femaleYear) ? Number(femaleYear) : undefined;
    const by = /^\d{4}$/.test(birthYear) ? Number(birthYear) : undefined;
    return (Object.keys(EVENT_NAMES) as EventKey[]).map((ev) =>
      queryDay(y, m, d, ev, {
        femaleBirthZhi: fy ? yearZhiOfBirthYear(fy) : undefined,
        femaleBirthGan: fy ? yearGanOfBirthYear(fy) : undefined,
        birthZhi: by ? yearZhiOfBirthYear(by) : undefined,
        birthGan: by ? yearGanOfBirthYear(by) : undefined,
      }),
    );
  }, [date, femaleYear, birthYear]);

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
            <span className="mb-1 block font-medium">本命生年（可留空）</span>
            <input
              className="w-full rounded border border-stone-300 bg-white px-3 py-2 dark:border-stone-600 dark:bg-stone-900"
              placeholder="例：1990"
              inputMode="numeric"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
            />
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
      {tab === "theory" && <TheoryTab />}
      <footer className="mt-10 text-center text-xs text-stone-400">
        擇日之法門派多有異同，本檢僅供參考。
      </footer>
    </main>
  );
}
