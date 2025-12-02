// src/src/pages/Calendar.tsx
import React, { useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import jalaliday from "jalaliday";
import isBetween from "dayjs/plugin/isBetween";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import weekday from "dayjs/plugin/weekday";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";

dayjs.extend(jalaliday);
dayjs.extend(isBetween);
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.extend(weekday);

// Persian locale + Jalali calendar
dayjs.locale("fa");
const toJ = (d?: Dayjs) => (d ?? dayjs()).calendar("jalali");

// ---------- Types ----------
type Stage =
  | "ثبت اولیه"
  | "در حال بررسی"
  | "بازگشت برای اصلاح"
  | "تایید اولیه"
  | "صدور گواهی";

interface Person {
  id: string;
  name: string;
  role: "مهندس" | "بازرس" | "مدیر پروژه" | "کارفرما";
  avatar?: string;
}

interface Project {
  id: string;
  code: string; // UTN
  title: string;
}

type ItemKind = "جلسه" | "واگذاری" | "مهلت" | "رویداد";

interface CalendarItem {
  id: string;
  kind: ItemKind;
  title: string;
  projectId?: string;
  personId?: string;
  stage?: Stage;
  // date OR range:
  date?: string; // ISO
  start?: string; // ISO
  end?: string; // ISO
  note?: string;
}

// ---------- Mock Data (replace with your API later) ----------
const PEOPLE: Person[] = [
  {
    id: "u1",
    name: "سارا احمدی",
    role: "مدیر پروژه",
    avatar: "https://i.pravatar.cc/48?img=5",
  },
  {
    id: "u2",
    name: "علی رضایی",
    role: "مهندس",
    avatar: "https://i.pravatar.cc/48?img=11",
  },
  {
    id: "u3",
    name: "محمد مرادی",
    role: "بازرس",
    avatar: "https://i.pravatar.cc/48?img=15",
  },
];

const PROJECTS: Project[] = [
  { id: "p1", code: "UTN-24051", title: "بهینه‌سازی اسکلت کشتی ۵۰۰۰ تنی" },
  { id: "p2", code: "UTN-24072", title: "بازطراحی سامانه رانش واحد A12" },
  { id: "p3", code: "UTN-24093", title: "بازآرایی شبکه برق اضطراری" },
];

const PROJECT_STATUS: Record<string, string> = {
  p1: "در حال بررسی اسناد طراحی",
  p2: "در انتظار تایید کیفیت",
  p3: "جلسه مشترک با کارفرما",
};

const initialItems: CalendarItem[] = [
  {
    id: "i1",
    kind: "جلسه",
    title: "جلسه هماهنگی پروژه",
    projectId: "p1",
    personId: "u1",
    date: dayjs().calendar("jalali").hour(10).minute(0).toDate().toISOString(),
    note: "بررسی ریسک‌ها و مسیر تایید",
  },
  {
    id: "i2",
    kind: "واگذاری",
    title: "واگذاری تحلیل بدنه",
    projectId: "p1",
    personId: "u2",
    start: dayjs().calendar("jalali").subtract(1, "day").toDate().toISOString(),
    end: dayjs().calendar("jalali").add(2, "day").toDate().toISOString(),
    stage: "در حال بررسی",
  },
  {
    id: "i3",
    kind: "مهلت",
    title: "ددلاین اصلاحات",
    projectId: "p2",
    personId: "u3",
    date: dayjs().calendar("jalali").add(3, "day").toDate().toISOString(),
    stage: "بازگشت برای اصلاح",
  },
  {
    id: "i4",
    kind: "رویداد",
    title: "بازدید کارگاهی",
    projectId: "p3",
    personId: "u3",
    date: dayjs().calendar("jalali").add(1, "week").hour(9).toDate().toISOString(),
    note: "همراه با تیم کنترل کیفیت",
  },
  {
    id: "i5",
    kind: "مهلت",
    title: "ارسال بسته تحلیل بدنه",
    projectId: "p1",
    personId: "u2",
    date: dayjs().calendar("jalali").add(6, "day").hour(16).toDate().toISOString(),
    stage: "تایید اولیه",
  },
];

// ---------- Helpers ----------
const WEEKDAYS_FA = ["ش", "ی", "د", "س", "چ", "پ", "ج"]; // Saturday first
const COLORS: Record<ItemKind, string> = {
  جلسه: "#2563eb",
  واگذاری: "#10b981",
  مهلت: "#ef4444",
  رویداد: "#8b5cf6",
};

function sameDay(a: Dayjs, b: Dayjs) {
  return a.startOf("day").isSame(b.startOf("day"));
}

function inRange(day: Dayjs, startISO?: string, endISO?: string) {
  if (!startISO || !endISO) return false;
  const s = dayjs(startISO);
  const e = dayjs(endISO);
  // TS doesn't know about isBetween, but runtime is fine because we extended the plugin
  return (day as any).isBetween(s.startOf("day"), e.endOf("day"), "day", "[]");
}

function formatJ(dateISO?: string) {
  if (!dateISO) return "";
  return toJ(dayjs(dateISO)).format("YYYY/MM/DD HH:mm");
}

// ---------- Calendar Component ----------
function CalendarView() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(toJ());
  const [items, setItems] = useState<CalendarItem[]>(initialItems);
  const [openDayISO, setOpenDayISO] = useState<string | null>(null);

  // New/Edit modal state
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<CalendarItem>>({
    kind: "جلسه",
    title: "",
    personId: PEOPLE[0].id,
    projectId: PROJECTS[0].id,
    stage: "ثبت اولیه",
    date: toJ().toDate().toISOString(),
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  // Days grid (6 weeks) — start from Saturday
  const jStartOfMonth = toJ(currentMonth).startOf("month");
  // Compute Saturday offset manually (Dayjs: 0=Sunday,...6=Saturday)
  const jsDay = jStartOfMonth.day(); // 0..6
  const offsetToSaturday = (jsDay + 1) % 7; // maps Sat(6)->0, Sun(0)->1, ...
  const gridStart = jStartOfMonth.subtract(offsetToSaturday, "day");
  const days: Dayjs[] = Array.from({ length: 42 }, (_, i) =>
    gridStart.add(i, "day")
  );

  const handlePrev = () => setCurrentMonth((m) => toJ(m).subtract(1, "month"));
  const handleNext = () => setCurrentMonth((m) => toJ(m).add(1, "month"));
  const handleToday = () => setCurrentMonth(toJ());

  const dayItems = useMemo(() => {
    // map ISO yyyy-mm-dd to items in that day
    const map = new Map<string, CalendarItem[]>();
    for (const it of items) {
      for (const d of days) {
        const iso = d.toDate().toISOString().slice(0, 10);
        const fallsIn =
          (it.date && sameDay(d, dayjs(it.date))) ||
          inRange(d, it.start, it.end);
        if (fallsIn) {
          const arr = map.get(iso) ?? [];
          arr.push(it);
          map.set(iso, arr);
        }
      }
    }
    return map;
  }, [items, days]);

  const openForDay = (d: Dayjs) => setOpenDayISO(d.toDate().toISOString());

  const startEditing = (it?: CalendarItem, defaultDate?: Dayjs) => {
    if (it) {
      setEditingId(it.id);
      setDraft({ ...it });
    } else {
      setEditingId(null);
      setDraft({
        id: undefined,
        kind: "جلسه",
        title: "",
        personId: PEOPLE[0].id,
        projectId: PROJECTS[0].id,
        stage: "ثبت اولیه",
        date: (defaultDate ?? toJ()).toDate().toISOString(),
        note: "",
      });
    }
    setFormOpen(true);
  };

  const saveDraft = () => {
    if (!draft.title || !draft.kind) return;
    if (editingId) {
      setItems((prev) =>
        prev.map((x) =>
          x.id === editingId
            ? { ...(x as CalendarItem), ...(draft as CalendarItem) }
            : x
        )
      );
    } else {
      const id = "i" + Math.random().toString(36).slice(2, 8);
      setItems((prev) => [...prev, { ...(draft as CalendarItem), id }]);
    }
    setFormOpen(false);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const monthTitle = toJ(currentMonth).format("YYYY MMMM");

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-right space-y-1">
          <p className="text-sm text-gray-500">هماهنگی تقویمی و برنامه‌ریزی تیمی</p>
          <h1 className="text-xl font-bold text-gray-900">تقویم پروژه‌های جاری</h1>
          <p className="text-sm text-gray-500">
            رویدادها، جلسات و مهلت‌ها در یک نمای ماهانه. برای هر پروژه برنامه روزانه را باز کنید یا مستقیم به جزئیات بروید.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button
            className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
            onClick={() => navigate("/projects")}
          >
            مشاهده پروژه‌ها
          </button>
          <button
            className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm"
            onClick={() => navigate(`/projects/${PROJECTS[0].id}`)}
          >
            تحلیل پروژه نمونه
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:opacity-90 text-sm"
            onClick={() => startEditing(undefined, toJ(currentMonth))}
          >
            + افزودن رویداد
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.8fr,1fr] items-start">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
          {/* Header controls */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={handlePrev}
              >
                ▶
              </button>
              <button
                className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={handleToday}
              >
                امروز
              </button>
              <button
                className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                onClick={handleNext}
              >
                ◀
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{monthTitle}</h2>
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: COLORS["جلسه"] }} /> جلسه</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: COLORS["واگذاری"] }} /> واگذاری</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: COLORS["مهلت"] }} /> مهلت</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: COLORS["رویداد"] }} /> رویداد</span>
            </div>
          </div>

          {/* Week header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEKDAYS_FA.map((w) => (
              <div
                key={w}
                className="text-center text-sm text-gray-500 py-2 select-none"
              >
                {w}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((d) => {
              const isoKey = d.toDate().toISOString().slice(0, 10);
              const list = dayItems.get(isoKey) ?? [];
              const inThisMonth = d.month() === toJ(currentMonth).month();
              const isToday = sameDay(d, toJ());

              return (
                <div
                  key={d.valueOf()}
                  onClick={() => openForDay(d)}
                  className={[
                    "rounded-lg border p-2 min-h-[120px] flex flex-col cursor-pointer transition-colors",
                    inThisMonth
                      ? "bg-white border-gray-200 hover:bg-blue-50"
                      : "bg-gray-50 border-gray-100 text-gray-400",
                    isToday ? "ring-2 ring-blue-500" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={[
                        "text-sm font-semibold",
                        inThisMonth ? "text-gray-800" : "text-gray-400",
                      ].join(" ")}
                    >
                      {toJ(d).format("D")}
                    </span>
                    {/* dot count */}
                    {list.length > 0 && (
                      <span className="text-[11px] text-gray-500">
                        {list.length} مورد
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-1 overflow-hidden">
                    {list.slice(0, 3).map((it) => (
                      <div
                        key={it.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDayISO(d.toDate().toISOString());
                        }}
                        className="text-[11px] px-1.5 py-1 rounded-md text-white truncate"
                        style={{ backgroundColor: COLORS[it.kind] }}
                        title={it.title}
                      >
                        <span className="font-semibold">{it.kind}</span>
                        <span className="mx-1">•</span>
                        {it.title}
                      </div>
                    ))}
                    {list.length > 3 && (
                      <div className="text-[11px] text-blue-600">+ بیشتر…</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              پروژه‌های موجود در تقویم
            </h3>
            <div className="space-y-3">
              {PROJECTS.map((project) => {
                const nextItem = items
                  .filter((it) => it.projectId === project.id)
                  .sort((a, b) => {
                    const aDate = dayjs(a.date ?? a.start ?? dayjs());
                    const bDate = dayjs(b.date ?? b.start ?? dayjs());
                    return aDate.valueOf() - bDate.valueOf();
                  })[0];

                return (
                  <div
                    key={project.id}
                    className="p-3 rounded-xl border border-gray-100 bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      <span className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-xs font-semibold">
                        {project.code}
                      </span>
                      <button
                        className="text-[11px] text-blue-600 hover:text-blue-800"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        باز کردن پرونده
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{project.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {PROJECT_STATUS[project.id]}
                    </p>
                    {nextItem ? (
                      <p className="text-xs text-gray-600 mt-2">
                        رویداد بعدی: {nextItem.title} · {formatJ(nextItem.date ?? nextItem.start)}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2">
                        برای این پروژه هنوز رویدادی تنظیم نشده است.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Day Modal */}
      {openDayISO && (
        <Modal onClose={() => setOpenDayISO(null)}>
          <DayDetail
            iso={openDayISO}
            items={items}
            people={PEOPLE}
            projects={PROJECTS}
            onAdd={() => {
              startEditing(undefined, dayjs(openDayISO));
            }}
            onEdit={(it) => startEditing(it)}
            onRemove={removeItem}
          />
        </Modal>
      )}

      {/* Create/Edit Modal */}
      {formOpen && (
        <Modal onClose={() => setFormOpen(false)}>
          <EditForm
            draft={draft}
            setDraft={setDraft}
            people={PEOPLE}
            projects={PROJECTS}
            onCancel={() => setFormOpen(false)}
            onSave={saveDraft}
            onRangeToggle={(checked) => {
              if (checked) {
                setDraft((d) => ({
                  ...d,
                  start: d.date ?? toJ().toDate().toISOString(),
                  end: dayjs(d.date ?? toJ().toISOString())
                    .add(1, "day")
                    .toDate()
                    .toISOString(),
                  date: undefined,
                }));
              } else {
                setDraft((d) => ({
                  ...d,
                  date: d.start ?? toJ().toDate().toISOString(),
                  start: undefined,
                  end: undefined,
                }));
              }
            }}
            isEditing={!!editingId}
          />
        </Modal>
      )}
    </div>
  );
}

export function Calendar() {
  return (
    <AppShell>
      <CalendarView />
    </AppShell>
  );
}

export default Calendar;

// ---------- Modal ----------
function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-base font-bold text-gray-900">جزئیات روز</h3>
          <button
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
            onClick={onClose}
            aria-label="بستن"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ---------- Day Detail ----------
function DayDetail({
  iso,
  items,
  people,
  projects,
  onAdd,
  onEdit,
  onRemove,
}: {
  iso: string;
  items: CalendarItem[];
  people: Person[];
  projects: Project[];
  onAdd: () => void;
  onEdit: (it: CalendarItem) => void;
  onRemove: (id: string) => void;
}) {
  const day = dayjs(iso);
  const inDay = items.filter(
    (it) =>
      (it.date && day.startOf("day").isSame(dayjs(it.date).startOf("day"))) ||
      inRange(day, it.start, it.end)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {toJ(day).format("dddd، YYYY/MM/DD")}
        </div>
        <button
          className="px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:opacity-90"
          onClick={onAdd}
        >
          + افزودن
        </button>
      </div>

      {inDay.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          رویدادی برای این روز ثبت نشده است.
        </div>
      ) : (
        <div className="space-y-3">
          {inDay.map((it) => {
            const p = people.find((x) => x.id === it.personId);
            const pr = projects.find((x) => x.id === it.projectId);
            return (
              <div
                key={it.id}
                className="border rounded-xl p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ background: COLORS[it.kind] }}
                    />
                    <div className="font-semibold text-gray-900">
                      {it.title}
                    </div>
                    <span className="text-xs text-gray-500">({it.kind})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 text-sm rounded-lg border hover:bg-gray-50"
                      onClick={() => onEdit(it)}
                    >
                      ویرایش
                    </button>
                    <button
                      className="px-2 py-1 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => onRemove(it.id)}
                    >
                      حذف
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  {pr ? (
                    <>
                      پروژه: <span className="font-medium">{pr.title}</span>{" "}
                      <span className="text-gray-400">({pr.code})</span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div>
                    مسئول:{" "}
                    {p ? <span className="font-medium">{p.name}</span> : "—"}
                  </div>
                  {it.stage && (
                    <div>
                      مرحله: <span className="font-medium">{it.stage}</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  {it.date
                    ? `زمان: ${formatJ(it.date)}`
                    : `بازه: ${formatJ(it.start)}  →  ${formatJ(it.end)}`}
                </div>

                {it.note && (
                  <div className="text-sm text-gray-700 border-t pt-2">
                    {it.note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------- Edit Form ----------
function EditForm({
  draft,
  setDraft,
  people,
  projects,
  onCancel,
  onSave,
  onRangeToggle,
  isEditing,
}: {
  draft: Partial<CalendarItem>;
  setDraft: React.Dispatch<React.SetStateAction<Partial<CalendarItem>>>;
  people: Person[];
  projects: Project[];
  onCancel: () => void;
  onSave: () => void;
  onRangeToggle: (checked: boolean) => void;
  isEditing: boolean;
}) {
  const isRange = !!(draft.start && draft.end);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">نوع</label>
          <select
            value={draft.kind ?? "جلسه"}
            onChange={(e) =>
              setDraft((d) => ({ ...d, kind: e.target.value as ItemKind }))
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white"
          >
            <option>جلسه</option>
            <option>واگذاری</option>
            <option>مهلت</option>
            <option>رویداد</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">عنوان</label>
          <input
            value={draft.title ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2"
            placeholder="عنوان رویداد…"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">پروژه</label>
          <select
            value={draft.projectId ?? projects[0].id}
            onChange={(e) =>
              setDraft((d) => ({ ...d, projectId: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">شخص مسئول</label>
          <select
            value={draft.personId ?? people[0].id}
            onChange={(e) =>
              setDraft((d) => ({ ...d, personId: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white"
          >
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">مرحله</label>
          <select
            value={draft.stage ?? "ثبت اولیه"}
            onChange={(e) =>
              setDraft((d) => ({ ...d, stage: e.target.value as Stage }))
            }
            className="w-full rounded-lg border border-gray-200 px-3 py-2 bg-white"
          >
            <option>ثبت اولیه</option>
            <option>در حال بررسی</option>
            <option>بازگشت برای اصلاح</option>
            <option>تایید اولیه</option>
            <option>صدور گواهی</option>
          </select>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <input
            id="range"
            type="checkbox"
            checked={isRange}
            onChange={(e) => onRangeToggle(e.target.checked)}
          />
          <label htmlFor="range" className="text-sm text-gray-700">
            بازه زمانی (شروع تا پایان)
          </label>
        </div>

        {!isRange ? (
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">
              تاریخ/زمان
            </label>
            <input
              type="datetime-local"
              value={toInputLocal(draft.date)}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  date: fromInputLocal(e.target.value),
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
            />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm text-gray-600 mb-1">شروع</label>
              <input
                type="datetime-local"
                value={toInputLocal(draft.start)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    start: fromInputLocal(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">پایان</label>
              <input
                type="datetime-local"
                value={toInputLocal(draft.end)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    end: fromInputLocal(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2"
              />
            </div>
          </>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">یادداشت</label>
        <textarea
          value={draft.note ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          className="w-full rounded-lg border border-gray-200 px-3 py-2"
          rows={3}
          placeholder="توضیحات تکمیلی…"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
          onClick={onCancel}
        >
          انصراف
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:opacity-90"
        >
          {isEditing ? "ذخیره تغییرات" : "افزودن"}
        </button>
      </div>
    </form>
  );
}

// ---------- datetime-local helpers ----------
function toInputLocal(iso?: string) {
  if (!iso) return "";
  const d = dayjs(iso);
  return d.format("YYYY-MM-DDTHH:mm");
}
function fromInputLocal(value: string) {
  return dayjs(value).toDate().toISOString();
}
