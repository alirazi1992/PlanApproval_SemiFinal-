import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Dialog } from "../components/ui/Dialog";
import { Input } from "../components/ui/Input";
import { Donut } from "../components/charts/Donut";
import { AreaSpark } from "../components/charts/AreaSpark";
import { mockAvatars } from "../mocks/db";
import { WorkspaceProvider } from "../features/workspace/WorkspaceContext";

// ------------------ Types ------------------
type TimeRange = "today" | "7d" | "30d";

type Metric = {
  id: string;
  label: string;
  value: string;
  helper: string;
};

type QuickStat = {
  id: string;
  label: string;
  value: string;
  change: string;
  tone: "positive" | "negative";
};

type TaskItem = {
  id: string;
  title: string;
  owner: string;
  due: string;
  done?: boolean;
};

type CollabCalendarEvent = {
  id: string;
  /** تاریخ به‌صورت شمسی (YYYY-MM-DD) */
  date: string;
  label: string;
  channel: string;
  time: string;
  accent: string;
  badgeClass: string;
};

type CollabBoardItem = {
  id: string;
  utn: string;
  title: string;
  owner: string;
  status: string;
  statusClass: string;
  location: string;
  due: string;
  channel: string;
};

type CollabActionItem = {
  id: string;
  title: string;
  owner: string;
  due: string;
  channel: string;
  badgeClass: string;
};

type CollabTeamStream = {
  id: string;
  title: string;
  focus: string;
  owner: string;
  progress: number;
  progressClass: string;
  channel: string;
};

type FieldMissionForm = {
  title: string;
  location: string;
  date: DateObject | null;
  window: string;
  lead: string;
  notes: string;
};

type CollabQuickLink = {
  id: string;
  title: string;
  detail: string;
  badge: string;
  badgeClass: string;
};

type KnowledgeResource = {
  id: string;
  title: string;
  detail: string;
};

type SupportShortcut = {
  id: string;
  title: string;
  detail: string;
};

type WorkbenchFeature = {
  id: string;
  label: string;
  helper: string;
  count?: number;
};

type WorkbenchCallout = {
  id: string;
  label: string;
  detail: string;
};

type WorkbenchProject = {
  id: string;
  utn: string;
  title: string;
  owner: string;
  location: string;
  focus: string;
  due: string;
  progress: number;
  capa: string;
  risk: string;
  features: WorkbenchFeature[];
  callouts: WorkbenchCallout[];
};

type FeatureHighlight = {
  id: string;
  label: string;
  value: string;
  helper?: string;
  tone?: "positive" | "warning" | "negative";
};

type FeatureChecklist = {
  id: string;
  label: string;
  done: boolean;
  note?: string;
};

type FeatureAction = {
  id: string;
  label: string;
  helper?: string;
  intent: "primary" | "secondary";
};

type WorkbenchFeatureDetail = {
  summary: string;
  highlights: FeatureHighlight[];
  checklist: FeatureChecklist[];
  actions: FeatureAction[];
};

type WorkflowAssignment = {
  id: string;
  utn: string;
  title: string;
  tech: string;
  stage: string;
  sla: string;
};

type ReportQueueItem = {
  id: string;
  utn: string;
  subject: string;
  owner: string;
  stage: string;
  due: string;
  channel: string;
  completeness: number;
  attachments: number;
  sensitivity: string;
};

type DashboardHeaderTab = "general" | "teamCalendar" | "workbench";

const parseHeaderTab = (tabParam: string | null): DashboardHeaderTab => {
  if (tabParam === "teamCalendar" || tabParam === "workbench") {
    return tabParam;
  }

  return "general";
};

// ------------------ Data ------------------
const todayMetrics: Metric[] = [
  { id: "total", label: "کل گردش امروز", value: "۹۴ پرونده", helper: "همه فعالیت‌ها" },
  { id: "urgent", label: "ارجاع اضطراری", value: "۱۸", helper: "نیازمند اقدام فوری" },
  { id: "active", label: "در حال اقدام", value: "۳۲", helper: "پرونده‌های باز" },
  { id: "closed", label: "بسته شده", value: "۴۴", helper: "تحویل و نهایی شده" },
];

const weekMetrics: Metric[] = [
  { id: "total", label: "کل گردش ۷ روز اخیر", value: "۵۴۰ پرونده", helper: "همه فعالیت‌ها" },
  { id: "urgent", label: "ارجاع اضطراری", value: "۷۴", helper: "نیازمند اقدام فوری" },
  { id: "active", label: "در حال اقدام", value: "۱۵۸", helper: "میانگین روزانه ۲۲" },
  { id: "closed", label: "بسته شده", value: "۳۰۸", helper: "بسته شده در ۷ روز" },
];

const monthMetrics: Metric[] = [
  { id: "total", label: "کل گردش ۳۰ روز اخیر", value: "۲۲۴۰ پرونده", helper: "همه فعالیت‌ها" },
  { id: "urgent", label: "ارجاع اضطراری", value: "۲۹۶", helper: "میانگین روزانه ۱۰" },
  { id: "active", label: "در حال اقدام", value: "۵۹۰", helper: "پرونده‌های باز فعلی" },
  { id: "closed", label: "بسته شده", value: "۱۳۵۴", helper: "بسته شده در ۳۰ روز" },
];

const metricsByRange: Record<TimeRange, Metric[]> = {
  today: todayMetrics,
  "7d": weekMetrics,
  "30d": monthMetrics,
};

const quickStats: QuickStat[] = [
  { id: "sla", label: "پوشش SLA امروز", value: "۹۲٪", change: "+۴٪", tone: "positive" },
  { id: "handover", label: "تحویل‌های موفق", value: "۱۲", change: "+۲", tone: "positive" },
  { id: "alerts", label: "هشدارهای فعال", value: "۶", change: "-۱", tone: "positive" },
  { id: "backlog", label: "پرونده‌های معوق", value: "۸", change: "+۳", tone: "negative" },
];

const donutToday = [
  { label: "بازرسی میدانی", value: 32, color: "#2563eb" },
  { label: "تحلیل آزمایشگاهی", value: 18, color: "#0ea5e9" },
  { label: "مستندسازی", value: 26, color: "#f97316" },
  { label: "سایر فعالیت‌ها", value: 18, color: "#10b981" },
];

const donutWeek = [
  { label: "بازرسی میدانی", value: 180, color: "#2563eb" },
  { label: "تحلیل آزمایشگاهی", value: 110, color: "#0ea5e9" },
  { label: "مستندسازی", value: 130, color: "#f97316" },
  { label: "سایر فعالیت‌ها", value: 120, color: "#10b981" },
];

const donutMonth = [
  { label: "بازرسی میدانی", value: 720, color: "#2563eb" },
  { label: "تحلیل آزمایشگاهی", value: 430, color: "#0ea5e9" },
  { label: "مستندسازی", value: 520, color: "#f97316" },
  { label: "سایر فعالیت‌ها", value: 570, color: "#10b981" },
];

const donutByRange: Record<TimeRange, typeof donutToday> = {
  today: donutToday,
  "7d": donutWeek,
  "30d": donutMonth,
};

const sparkToday = [42, 50, 64, 58, 71, 69, 82, 88, 93, 90, 97, 103];
const sparkWeek = [380, 410, 430, 460, 480, 500, 540, 560, 590, 610, 640, 670];
const sparkMonth = [1200, 1400, 1500, 1600, 1700, 1800, 1900, 2050, 2150, 2200, 2300, 2400];

const sparkByRange: Record<TimeRange, number[]> = {
  today: sparkToday,
  "7d": sparkWeek,
  "30d": sparkMonth,
};

const priorityTasks: TaskItem[] = [
  { id: "alert-1", title: "پروژه بدنه UTN-2045 منتظر تایید طراحی است", owner: "سارا رحیمی", due: "امروز · ۱۵:۰۰" },
  { id: "alert-2", title: "ارسال خلاصه بازرسی برای یگان ۳", owner: "علی محمدی", due: "فردا · ۱۰:۳۰" },
  { id: "alert-3", title: "آماده‌سازی گزارش برای تماس مدیران", owner: "فاطمه کریمی", due: "جمعه · ۰۹:۰۰" },
];

const initialCollabCalendarEvents: CollabCalendarEvent[] = [
  {
    id: "cal-1403-07-23-1",
    date: "1403-07-23",
    label: "واکشی کابل بدنه",
    channel: "میدانی",
    time: "۰۸:۳۰",
    accent: "text-emerald-700",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    id: "cal-1403-07-23-2",
    date: "1403-07-23",
    label: "حضور QA مشترک",
    channel: "کنترل کیفیت",
    time: "۱۰:۱۵",
    accent: "text-blue-700",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    id: "cal-1403-07-24-1",
    date: "1403-07-24",
    label: "تحویل بردهای الکتریک",
    channel: "کارگاه",
    time: "۰۹:۴۵",
    accent: "text-indigo-700",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    id: "cal-1403-07-24-2",
    date: "1403-07-24",
    label: "هم‌ترازی سازه",
    channel: "QA",
    time: "۱۵:۰۰",
    accent: "text-slate-700",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  },
  {
    id: "cal-1403-07-25-1",
    date: "1403-07-25",
    label: "جلسه آنلاین مدیران",
    channel: "مدیریت",
    time: "۱۷:۳۰",
    accent: "text-amber-700",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    id: "cal-1403-07-26-1",
    date: "1403-07-26",
    label: "هماهنگی شیفت شب",
    channel: "میدانی",
    time: "۲۰:۰۰",
    accent: "text-emerald-700",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
];

const initialCollabBoardItems: CollabBoardItem[] = [
  { id: "board-1", utn: "UTN-2045", title: "بازرسی لرزش بدنه", owner: "ندا شریفی", status: "در جریان", statusClass: "bg-blue-50 text-blue-700 border-blue-200", location: "اسکله شهید بهشتی", due: "امروز · ۱۴:۰۰", channel: "میدانی" },
  { id: "board-2", utn: "UTN-1980", title: "تحلیل نشتی روغن", owner: "محمد رضوی", status: "در انتظار QA", statusClass: "bg-amber-50 text-amber-700 border-amber-200", location: "کارگاه جنوبی", due: "امروز · ۱۷:۰۰", channel: "QA" },
  { id: "board-3", utn: "UTN-2101", title: "بارگیری بردهای الکتریک", owner: "مهدی سلیمانی", status: "آماده ارسال", statusClass: "bg-emerald-50 text-emerald-700 border-emerald-200", location: "کارگاه مرکزی", due: "فردا · ۰۹:۳۰", channel: "کارگاه" },
  { id: "board-4", utn: "UTN-1766", title: "تکمیل مستندات سیستم عمومی", owner: "فاطمه کریمی", status: "نیازمند اطلاعات", statusClass: "bg-rose-50 text-rose-600 border-rose-200", location: "اتاق داده ایمن", due: "فردا · ۱۲:۰۰", channel: "مستندسازی" },
];

const initialCollabActionItems: CollabActionItem[] = [
  { id: "action-1", title: "ارسال گزارش لرزش به QA", owner: "ندا شریفی", due: "۲ ساعت دیگر", channel: "QA", badgeClass: "bg-rose-50 text-rose-600 border-rose-100" },
  { id: "action-2", title: "هم‌رسانی نقشه‌های اصلاحی", owner: "محمد رضوی", due: "پیش از پایان شیفت", channel: "کارگاه", badgeClass: "bg-amber-50 text-amber-700 border-amber-100" },
  { id: "action-3", title: "به‌روزرسانی وضعیت در برد مدیران", owner: "مهدی سلیمانی", due: "تا ساعت ۲۰", channel: "داشبورد مدیران", badgeClass: "bg-blue-50 text-blue-700 border-blue-100" },
];

const collabTeamStreams: CollabTeamStream[] = [
  { id: "stream-body", title: "هماهنگی بدنه", focus: "کابل‌کشی + تست لرزش", owner: "سارا رحیمی", progress: 72, progressClass: "bg-emerald-400", channel: "میدانی" },
  { id: "stream-electric", title: "شبکه الکتریک", focus: "بردهای کنترل و نرم‌افزار", owner: "مهدی سلیمانی", progress: 58, progressClass: "bg-indigo-400", channel: "کارگاه" },
  { id: "stream-field", title: "میدانی و بهره‌بردار", focus: "جلسات حضوری + هماهنگی QA", owner: "ندا شریفی", progress: 81, progressClass: "bg-blue-400", channel: "کنترل کیفیت" },
];

const collabQuickLinks: CollabQuickLink[] = [
  { id: "quick-1", title: "دعوت از QA برای تحویل مشترک", detail: "ارسال لینک جلسه آنلاین + یادآور SMS", badge: "QA", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { id: "quick-2", title: "اشتراک نقشه اصلاحی بدنه", detail: "اتاق داده ایمن · PDF + DWG", badge: "Data Room", badgeClass: "bg-blue-50 text-blue-700 border-blue-100" },
  { id: "quick-3", title: "ارسال وضعیت برای مدیر پروژه", detail: "داشبورد مدیران · گزارش لحظه‌ای", badge: "مدیریت", badgeClass: "bg-amber-50 text-amber-700 border-amber-100" },
];

const knowledgeBaseResources: KnowledgeResource[] = [
  { id: "kb-root-cause", title: "راهنمای تحلیل ریشه‌ای ارتعاش", detail: "چک‌لیست ۱۲ مرحله‌ای برای یافتن سریع منشأ ایراد" },
  { id: "kb-report-kit", title: "الگوی گزارش مدیران", detail: "نسخه آماده ارائه با نمودارهای مقایسه‌ای" },
  { id: "kb-field-validation", title: "بسته معتبرسازی میدانی", detail: "استانداردهای پذیرش برای تیم QA" },
];

const supportShortcuts: SupportShortcut[] = [
  { id: "ticket", title: "ثبت تیکت", detail: "برای هماهنگی با واحد پشتیبانی" },
  { id: "chat", title: "چت با مهندس آماده‌باش", detail: "میانگین پاسخ‌گویی ۶ دقیقه" },
  { id: "meeting", title: "رزرو جلسه هم‌آهنگی", detail: "انتخاب بازه ۳۰ دقیقه‌ای" },
  { id: "secure-room", title: "اتاق داده ایمن", detail: "آپلود نقشه‌ها و مدارک حجیم" },
];

const workbenchProjects: WorkbenchProject[] = [
  {
    id: "utn-2045-workbench",
    utn: "UTN-2045",
    title: "بازرسی لرزش بدنه",
    owner: "ندا شریفی",
    location: "اسکله شهید بهشتی",
    focus: "لرزش بدنه + هم‌ترازی کابل",
    due: "امروز · ۱۸:۰۰",
    progress: 68,
    capa: "CAPA-311 · ۲ گام باز",
    risk: "ریسک لرزش ۲.۱g",
    features: [
      { id: "overview", label: "نمای کلی", helper: "طرح + وضعیت لحظه‌ای" },
      { id: "docs", label: "مدارک", helper: "DWG + PDF مهر شده", count: 4 },
      { id: "inspections", label: "بازرسی‌ها", helper: "Field + Lab", count: 1 },
      { id: "capa", label: "CAPA", helper: "اقدام اصلاحی", count: 2 },
    ],
    callouts: [
      { id: "bulkhead", label: "عرشه A3", detail: "انحراف ۱.۴ میلی‌متر" },
      { id: "sensor", label: "سنسور لرزش", detail: "کالیبراسیون تا ۱۸:۰۰" },
      { id: "docs", label: "DWG", detail: "نسخه ۳ · ۴ پیوست" },
    ],
  },
  {
    id: "utn-1980-workbench",
    utn: "UTN-1980",
    title: "تحلیل نشتی سیستم روغن",
    owner: "محمد رضوی",
    location: "اتاق ماشین‌آلات · کیش",
    focus: "بازرسی میدانی + آزمایشگاه",
    due: "فردا · ۰۹:۴۵",
    progress: 54,
    capa: "CAPA-118 تایید شده",
    risk: "ریسک آلودگی ۱.۸٪",
    features: [
      { id: "overview", label: "نمای کلی", helper: "روند فشار + دما" },
      { id: "docs", label: "مدارک", helper: "گزارش تست آزمایشگاه", count: 6 },
      { id: "inspections", label: "بازرسی‌ها", helper: "UT/MT", count: 2 },
      { id: "capa", label: "CAPA", helper: "۲ اقدام اصلاحی", count: 2 },
    ],
    callouts: [
      { id: "valve", label: "شیر تغذیه", detail: "ΔP = ۰.۷ بار" },
      { id: "pump", label: "پمپ A2", detail: "نیازمند آب‌بندی" },
      { id: "lab", label: "نمونه آزمایش", detail: "ارسال به تهران" },
    ],
  },
];

const workbenchFeatureDetails: Record<string, Record<string, WorkbenchFeatureDetail>> = {
  "utn-2045-workbench": {
    overview: {
      summary:
        "بازرسی بدنه در فاز سوم قرار دارد و تمرکز اصلی روی هم‌ترازی سازه و تایید سنسورهای لرزش است.",
      highlights: [
        { id: "utn2045-overview-progress", label: "پیشرفت", value: "۶۸٪", helper: "براساس جدول پروژه", tone: "positive" },
        { id: "utn2045-overview-risk", label: "ریسک لرزش", value: "۲.۱g", helper: "حد آستانه ۲.۵g", tone: "warning" },
        { id: "utn2045-overview-capa", label: "CAPA-311", value: "۲ گام باز", helper: "در حال اقدام" },
      ],
      checklist: [
        { id: "utn2045-overview-check-1", label: "تایید نسخه ۳ نقشه در اتاق داده", done: true, note: "امضا شده توسط QA" },
        { id: "utn2045-overview-check-2", label: "ثبت قرائت حسگر لرزش (۴ نمونه)", done: false, note: "۲ نمونه باقی‌مانده" },
        { id: "utn2045-overview-check-3", label: "هماهنگی بازدید با بهره‌بردار", done: false },
      ],
      actions: [
        { id: "utn2045-overview-action-1", label: "ارسال Snapshot به مدیر پروژه", helper: "PDF + نمودار", intent: "primary" },
        { id: "utn2045-overview-action-2", label: "درخواست جلسه AsiaClass", helper: "هماهنگی آنلاین", intent: "secondary" },
      ],
    },
    docs: {
      summary: "۴ سند مهرشده و آماده استفاده در اختیار تیم قرار دارد.",
      highlights: [
        { id: "utn2045-docs-dwg", label: "DWG", value: "۲ نسخه", helper: "نسخه ۳" },
        { id: "utn2045-docs-pdf", label: "PDF", value: "۲ فایل", helper: "مهرشده", tone: "positive" },
        { id: "utn2045-docs-log", label: "LOG", value: "آخرین ۲۴س", helper: "به‌روزرسانی شد" },
      ],
      checklist: [
        { id: "utn2045-docs-check-1", label: "بازبینی PDF مهر شده", done: true },
        { id: "utn2045-docs-check-2", label: "آپلود نسخه DWG در اتاق داده", done: true },
        { id: "utn2045-docs-check-3", label: "الحاق لاگ QA به بسته مدارک", done: false },
      ],
      actions: [
        { id: "utn2045-docs-action-1", label: "آپلود فایل جدید", helper: "Drag & Drop", intent: "primary" },
        { id: "utn2045-docs-action-2", label: "اشتراک در اتاق داده ایمن", helper: "لینک ۷۲ ساعته", intent: "secondary" },
      ],
    },
    inspections: {
      summary: "یک بازرسی میدانی تکمیل شده و گزارش آزمایشگاهی در حال تهیه است.",
      highlights: [
        { id: "utn2045-inspection-field", label: "Field", value: "۱/۲", helper: "بازدید امروز" },
        { id: "utn2045-inspection-lab", label: "Lab", value: "۱/۲", helper: "تحلیل آزمایشگاهی" },
        { id: "utn2045-inspection-qa", label: "QA", value: "هماهنگ شد", helper: "هماهنگی مشترک" },
      ],
      checklist: [
        { id: "utn2045-inspection-check-1", label: "ثبت عکس‌های لرزش", done: true },
        { id: "utn2045-inspection-check-2", label: "نمونه‌گیری آزمایشگاهی", done: false },
        { id: "utn2045-inspection-check-3", label: "به‌روزرسانی وضعیت در برد", done: false },
      ],
      actions: [
        { id: "utn2045-inspection-action-1", label: "هماهنگی بازدید مشترک", helper: "QA + بهره‌بردار", intent: "secondary" },
        { id: "utn2045-inspection-action-2", label: "ثبت گزارش میدانی", helper: "۱۰ دقیقه", intent: "primary" },
      ],
    },
    capa: {
      summary: "دو اقدام اصلاحی باز مانده که باید قبل از تحویل بسته شود.",
      highlights: [
        { id: "utn2045-capa-open", label: "CAPA باز", value: "۲", helper: "۳ گام انجام شد" },
        { id: "utn2045-capa-risk", label: "ریسک", value: "۲.۱g", helper: "پایش لحظه‌ای", tone: "warning" },
      ],
      checklist: [
        { id: "utn2045-capa-check-1", label: "به‌روزرسانی ردیف CAPA-311", done: true },
        { id: "utn2045-capa-check-2", label: "تایید آزمایشگاه", done: false },
        { id: "utn2045-capa-check-3", label: "ارسال برای AsiaClass", done: false },
      ],
      actions: [
        { id: "utn2045-capa-action-1", label: "تعیین مسئولیت", helper: "ارجاع به QA", intent: "secondary" },
        { id: "utn2045-capa-action-2", label: "بستن CAPA", helper: "امضا دیجیتال", intent: "primary" },
      ],
    },
  },
  "utn-1980-workbench": {
    overview: {
      summary: "تحلیل نشتی سیستم روغن در حال انجام و تمرکز بر ریسک آلودگی است.",
      highlights: [
        { id: "utn1980-overview-progress", label: "پیشرفت", value: "۵۴٪", helper: "گزارش فنی" },
        { id: "utn1980-overview-risk", label: "ریسک آلودگی", value: "۱.۸٪", helper: "حد آستانه ۲٪", tone: "warning" },
        { id: "utn1980-overview-capa", label: "CAPA-118", value: "تایید شد", helper: "QA" },
      ],
      checklist: [
        { id: "utn1980-overview-check-1", label: "نمونه‌گیری آزمایشگاه", done: true },
        { id: "utn1980-overview-check-2", label: "قرائت فشار لحظه‌ای", done: false },
        { id: "utn1980-overview-check-3", label: "ارسال وضعیت به مدیر پروژه", done: false },
      ],
      actions: [
        { id: "utn1980-overview-action-1", label: "ارسال Snapshot", helper: "PDF + نمودار", intent: "primary" },
        { id: "utn1980-overview-action-2", label: "درخواست حضور کارگاه", helper: "جلسه آنلاین", intent: "secondary" },
      ],
    },
    docs: {
      summary: "۶ گزارش تست آزمایشگاهی آماده بررسی است.",
      highlights: [
        { id: "utn1980-docs-lab", label: "Lab", value: "۶ فایل", helper: "نمونه‌های امروز" },
        { id: "utn1980-docs-dwg", label: "DWG", value: "۱ نسخه", helper: "اصلاح شده" },
        { id: "utn1980-docs-pdf", label: "PDF", value: "۲ فایل", helper: "مهر شده", tone: "positive" },
      ],
      checklist: [
        { id: "utn1980-docs-check-1", label: "بارگذاری نتایج آزمایش", done: true },
        { id: "utn1980-docs-check-2", label: "به‌روزرسانی DWG در اتاق داده", done: false },
        { id: "utn1980-docs-check-3", label: "اشتراک بسته برای مدیریت", done: false },
      ],
      actions: [
        { id: "utn1980-docs-action-1", label: "آپلود فایل", helper: "Drag & Drop", intent: "primary" },
        { id: "utn1980-docs-action-2", label: "به‌اشتراک‌گذاری امن", helper: "لینک ۷۲ ساعته", intent: "secondary" },
      ],
    },
    inspections: {
      summary: "بازرسی UT/MT در حال انجام و یک مورد نیازمند QA مشترک است.",
      highlights: [
        { id: "utn1980-inspection-ut", label: "UT", value: "۱/۲", helper: "امروز" },
        { id: "utn1980-inspection-mt", label: "MT", value: "۰/۱", helper: "تا فردا" },
        { id: "utn1980-inspection-qa", label: "QA", value: "هماهنگی", helper: "بهره‌بردار" },
      ],
      checklist: [
        { id: "utn1980-inspection-check-1", label: "نمونه‌گیری جدید", done: false },
        { id: "utn1980-inspection-check-2", label: "بارگذاری عکس‌ها", done: false },
        { id: "utn1980-inspection-check-3", label: "بستن لاگ UT", done: true },
      ],
      actions: [
        { id: "utn1980-inspection-action-1", label: "تنظیم جلسه QA", helper: "۴۵ دقیقه", intent: "secondary" },
        { id: "utn1980-inspection-action-2", label: "ثبت گزارش UT", helper: "۱۰ دقیقه", intent: "primary" },
      ],
    },
    capa: {
      summary: "CAPA-118 تایید شده و باید برای نهایی‌سازی به مدیر پروژه ارسال شود.",
      highlights: [
        { id: "utn1980-capa-open", label: "CAPA باز", value: "۱", helper: "پایش" },
        { id: "utn1980-capa-risk", label: "ریسک", value: "۱.۸٪", helper: "پایش آلودگی", tone: "warning" },
      ],
      checklist: [
        { id: "utn1980-capa-check-1", label: "اشتراک CAPA با QA", done: true },
        { id: "utn1980-capa-check-2", label: "تایید فنی", done: false },
        { id: "utn1980-capa-check-3", label: "ثبت امضا دیجیتال", done: false },
      ],
      actions: [
        { id: "utn1980-capa-action-1", label: "ارسال برای QA", helper: "هماهنگی", intent: "secondary" },
        { id: "utn1980-capa-action-2", label: "نهایی‌سازی CAPA", helper: "امضا دیجیتال", intent: "primary" },
      ],
    },
  },
};

const initialWorkflowAssignments: WorkflowAssignment[] = [
  { id: "wf-1", utn: "UTN-2045", title: "بدنه / لرزش غیرعادی", tech: "سارا رحیمی", stage: "بازرسی میدانی", sla: "۲ ساعت" },
  { id: "wf-2", utn: "UTN-1980", title: "ماشین‌آلات / نشت روغن", tech: "محمد رضوی", stage: "در انتظار تحویل", sla: "تا پایان امروز" },
  { id: "wf-3", utn: "UTN-2101", title: "الکتریک / قطع مقطعی", tech: "مهدی سلیمانی", stage: "تحلیل آزمایشگاهی", sla: "فردا صبح" },
  { id: "wf-4", utn: "UTN-1766", title: "سیستم عمومی / به‌روزرسانی مدارک", tech: "فاطمه کریمی", stage: "مستندسازی", sla: "در حال اقدام" },
];

const initialReportQueue: ReportQueueItem[] = [
  { id: "report-1", utn: "UTN-2045", subject: "ممیزی لرزش بدنه · نسخه ۳", owner: "ندا شریفی", stage: "در انتظار تایید", due: "امروز · ۱۸:۰۰", channel: "QA", completeness: 78, attachments: 6, sensitivity: "محرمانه" },
  { id: "report-2", utn: "UTN-1980", subject: "تحلیل نشتی روغن و CAPA", owner: "محمد رضوی", stage: "در حال تحلیل", due: "امروز · ۲۱:۰۰", channel: "کارگاه", completeness: 52, attachments: 3, sensitivity: "عادی" },
  { id: "report-3", utn: "UTN-2101", subject: "خلاصه مدیریتی شبکه الکتریک", owner: "مهدی سلیمانی", stage: "آماده انتشار", due: "فردا · ۱۰:۰۰", channel: "مستندسازی", completeness: 91, attachments: 4, sensitivity: "عادی" },
  { id: "report-4", utn: "UTN-1766", subject: "به‌روزرسانی مستندات عمومی", owner: "فاطمه کریمی", stage: "ارسال شد", due: "دیروز · ۱۶:۰۰", channel: "بدنه", completeness: 100, attachments: 8, sensitivity: "محرمانه" },
];

// ------------------ Helpers ------------------
const rangeLabels: Record<TimeRange, string> = {
  today: "امروز",
  "7d": "۷ روز اخیر",
  "30d": "۳۰ روز اخیر",
};

const colorTone = (tone: QuickStat["tone"]) =>
  tone === "positive" ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50";

const highlightToneClass = (tone?: FeatureHighlight["tone"]) => {
  if (tone === "positive") return "text-emerald-700 bg-emerald-50 border-emerald-100";
  if (tone === "warning") return "text-amber-700 bg-amber-50 border-amber-100";
  if (tone === "negative") return "text-rose-700 bg-rose-50 border-rose-100";
  return "text-slate-700 bg-slate-50 border-slate-100";
};

const toPersianDateObject = (dateString: string) =>
  new DateObject({
    date: dateString,
    format: "YYYY-MM-DD",
    calendar: persian,
    locale: persian_fa,
  });

const formatPersianDate = (dateString: string, pattern = "dddd D MMMM") =>
  toPersianDateObject(dateString).format(pattern);

// ------------------ View ------------------
function TechnicianDashboardView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [headerTab, setHeaderTab] = useState<DashboardHeaderTab>(
    parseHeaderTab(searchParams.get("tab"))
  );
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [calendarValue, setCalendarValue] = useState<DateObject | null>(
    initialCollabCalendarEvents[0]
      ? toPersianDateObject(initialCollabCalendarEvents[0].date)
      : new DateObject({ calendar: persian, locale: persian_fa })
  );
  const [tasks, setTasks] = useState<TaskItem[]>(
    priorityTasks.map((task) => ({ ...task, done: false }))
  );
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", owner: "", due: "" });
  const [showFieldMissionDialog, setShowFieldMissionDialog] = useState(false);
  const [fieldMissionForm, setFieldMissionForm] = useState<FieldMissionForm>({
    title: "بازدید میدانی پروژه جدید",
    location: "کارگاه شمال شهر",
    date: new DateObject({ calendar: persian, locale: persian_fa }),
    window: "09:00 - 11:00",
    lead: mockAvatars[0]?.name ?? "",
    notes: "نیاز به هماهنگی با حراست و ایمنی سایت.",
  });
  const [scheduledMission, setScheduledMission] = useState<FieldMissionForm | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeWorkbench, setActiveWorkbench] = useState<string>(
    workbenchProjects[0]?.id ?? ""
  );
  const [activeFeatureTab, setActiveFeatureTab] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      workbenchProjects.map((project) => [project.id, project.features[0]?.id])
    )
  );
  const [selectedResource, setSelectedResource] = useState<KnowledgeResource | null>(
    null
  );
  const [activeSupportShortcut, setActiveSupportShortcut] =
    useState<SupportShortcut | null>(null);
  const [supportNote, setSupportNote] = useState<string>("");

  const activeFeature =
    activeFeatureTab[activeWorkbench] ?? workbenchProjects[0]?.features[0]?.id;

  const activeFeatureDetail =
    activeWorkbench && activeFeature
      ? workbenchFeatureDetails[activeWorkbench]?.[activeFeature]
      : undefined;

  useEffect(() => {
    setHeaderTab(parseHeaderTab(searchParams.get("tab")));
  }, [searchParams]);

  const showMessage = (message: string) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), 4200);
  };

  const handleAddTask = () => {
    if (!taskForm.title.trim()) return;
    setTasks((prev) => [
      {
        id: `task-${prev.length + 1}`,
        title: taskForm.title,
        owner: taskForm.owner || "تعیین نشده",
        due: taskForm.due || "بدون موعد",
        done: false,
      },
      ...prev,
    ]);
    setTaskForm({ title: "", owner: "", due: "" });
    setShowTaskForm(false);
    showMessage("کار جدید به فهرست اولویت‌ها اضافه شد.");
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  const handleOpenResource = (resource: KnowledgeResource) => {
    setSelectedResource(resource);
    showMessage(`منبع «${resource.title}» باز شد و آماده استفاده است.`);
  };

  const handleShortcutClick = (shortcut: SupportShortcut) => {
    setActiveSupportShortcut(shortcut);
    setSupportNote(`درخواست سریع از کانال «${shortcut.title}» ثبت شود.`);
    showMessage(`${shortcut.title} باز شد. مسئول مربوطه در جریان قرار گرفت.`);
  };

  const handleFeatureAction = (label: string) => {
    showMessage(`${label} اجرا شد و در سوابق فعالیت ثبت گردید.`);
  };

  const handleSubmitFieldMission = () => {
    if (!fieldMissionForm.title.trim() || !fieldMissionForm.location.trim()) {
      showMessage("عنوان و محل ماموریت را کامل کنید.");
      return;
    }

    const formattedDate =
      fieldMissionForm.date?.format?.("YYYY/MM/DD") ?? "بدون تاریخ مشخص";

    setScheduledMission(fieldMissionForm);
    setShowFieldMissionDialog(false);
    showMessage(
      `ماموریت «${fieldMissionForm.title}» برای ${formattedDate} در ${fieldMissionForm.window} ثبت شد.`
    );
  };

  const handleDownloadResource = () => {
    if (!selectedResource) return;
    showMessage(`فایل «${selectedResource.title}» دانلود و در صف بررسی قرار گرفت.`);
    setSelectedResource(null);
  };

  const handleShareResource = () => {
    if (!selectedResource) return;
    showMessage(`منبع «${selectedResource.title}» برای تیم میدانی ارسال شد.`);
    setSelectedResource(null);
  };

  const handleSendSupportRequest = () => {
    if (!activeSupportShortcut) return;
    showMessage(
      `پیام شما در «${activeSupportShortcut.title}» ارسال شد. پاسخ در کم‌تر از ۱۰ دقیقه ارائه می‌شود.`
    );
    setSupportNote("");
    setActiveSupportShortcut(null);
  };

  const metrics = metricsByRange[timeRange];
  const donutData = donutByRange[timeRange];
  const sparkData = sparkByRange[timeRange];

  const selectedDateKey = useMemo(
    () => calendarValue?.format("YYYY-MM-DD"),
    [calendarValue]
  );

  const dayEvents = useMemo(() => {
    if (!selectedDateKey) return initialCollabCalendarEvents;
    return initialCollabCalendarEvents.filter((event) => event.date === selectedDateKey);
  }, [selectedDateKey]);

  const upcomingCalendarEvents = useMemo(() => {
    const sorted = [...initialCollabCalendarEvents].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    if (!selectedDateKey) return sorted.slice(0, 4);

    return sorted.filter((event) => event.date >= selectedDateKey).slice(0, 4);
  }, [selectedDateKey]);

  const availableTechnicians = mockAvatars.slice(0, 5);
  const missionDateLabel =
    scheduledMission?.date?.format?.("YYYY/MM/DD") ?? "تاریخ در انتظار تعیین";

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6 text-right">
        {/* Header */}
        <header className="flex flex-wrap items-start justify-between gap-4 flex-row">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">درگاه کارشناسان</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">داشبورد عملیات میدانی</h1>
            <p className="text-gray-600 mt-1">
              تمام پرونده‌های در جریان، برنامه‌ریزی تیم فنی و گزارش‌های آماده انتشار را در یک نما ببینید.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-row">
            <Button
              variant="ghost"
              className="px-4 py-2 text-sm text-gray-700"
              onClick={() => navigate("/workspace", { state: { anchor: "desk" } })}
            >
              <Icon name="layers" size={16} className="ml-2" />
              بازگشت به مرور پروژه‌ها
            </Button>
            <Button
              variant="primary"
              className="px-5 py-2 text-sm"
              onClick={() => setShowFieldMissionDialog(true)}
            >
              <Icon name="calendar" size={16} className="ml-2" />
              رزرو ماموریت میدانی
            </Button>
          </div>
        </header>

        {statusMessage && (
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center justify-between flex-row">
            <div className="flex items-center gap-2 flex-row">
              <Icon name="check" className="ml-1" />
              <span className="text-sm font-medium">{statusMessage}</span>
            </div>
            <button
              type="button"
              className="text-xs text-emerald-700"
              onClick={() => setStatusMessage(null)}
            >
              بستن
            </button>
          </div>
        )}

        {scheduledMission && (
          <Card className="p-4 border-amber-200 bg-amber-50 text-right">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-sm text-amber-700">درخواست رزرو ماموریت میدانی ثبت شد</p>
                <h3 className="text-lg font-semibold text-gray-900">{scheduledMission.title}</h3>
                <div className="flex flex-wrap gap-3 text-sm text-gray-700 flex-row-reverse">
                  <span className="flex items-center gap-1 flex-row-reverse">
                    <Icon name="calendar" size={16} className="ml-1" />
                    {missionDateLabel} | {scheduledMission.window}
                  </span>
                  <span className="flex items-center gap-1 flex-row-reverse">
                    <Icon name="users" size={16} className="ml-1" />
                    مسئول: {scheduledMission.lead || "نامشخص"}
                  </span>
                  <span className="flex items-center gap-1 flex-row-reverse text-amber-800">
                    <Icon name="shield" size={16} className="ml-1" />
                    محل حضور: {scheduledMission.location}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{scheduledMission.notes}</p>
              </div>
              <div className="flex items-center gap-2 flex-row-reverse">
                <Button variant="ghost" className="text-sm" onClick={() => setShowFieldMissionDialog(true)}>
                  بروزرسانی جزئیات
                </Button>
                <Button variant="primary" className="text-sm" onClick={() => showMessage("جزئیات ماموریت به تیم اعلام شد.")}>
                  ارسال به تیم میدانی
                </Button>
              </div>
            </div>
          </Card>
        )}

        {headerTab === "general" && (
          <>
            {/* Top metrics */}
            <Card className="p-5 text-right">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4 flex-row">
                <div className="flex items-center gap-2 flex-row">
                  {(Object.keys(rangeLabels) as TimeRange[]).map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "primary" : "ghost"}
                      className={`px-3 py-1 text-sm ${timeRange === range ? "" : "text-gray-700"}`}
                      onClick={() => setTimeRange(range)}
                    >
                      {rangeLabels[range]}
                    </Button>
                  ))}
                </div>
                <div className="text-sm text-gray-500">نمای کلی عملکرد تیم</div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {metrics.map((item) => (
                  <div key={item.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50">
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <div className="mt-2 flex items-baseline justify-end gap-2">
                      <span className="text-2xl font-semibold text-gray-900">{item.value}</span>
                      <span className="text-xs text-gray-500">{item.helper}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="col-span-2 p-4 border border-gray-100 rounded-xl bg-white">
                  <div className="flex items-center justify-between mb-3 flex-row">
                    <p className="font-medium text-gray-800">حجم فعالیت</p>
                    <span className="text-sm text-gray-500">روند {rangeLabels[timeRange]}</span>
                  </div>
                  <AreaSpark data={sparkData} height={120} color="#2563eb" backgroundColor="#f8fafc" />
                </div>
                <div className="p-4 border border-gray-100 rounded-xl bg-white">
                  <div className="flex items-center justify-between mb-3 flex-row">
                    <p className="font-medium text-gray-800">توزیع فعالیت</p>
                    <span className="text-sm text-gray-500">{rangeLabels[timeRange]}</span>
                  </div>
                  <div className="flex items-center justify-center">
                    <Donut data={donutData} size={160} direction="rtl" centerLabel="مجموع کل" />
                  </div>
                  <div className="mt-3 space-y-2">
                    {donutData.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-sm flex-row">
                        <div className="flex items-center gap-2 flex-row">
                          <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                          <span className="text-gray-700">{item.label}</span>
                        </div>
                        <span className="text-gray-900 font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Secondary stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quickStats.map((stat) => (
                <Card key={stat.id} className="p-4 border border-gray-100 bg-white">
                  <div className="flex items-center justify-between mb-2 flex-row">
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <span className={`text-xs px-2 py-1 rounded-lg border ${colorTone(stat.tone)}`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 text-right">{stat.value}</div>
                </Card>
              ))}
            </div>
          </>
        )}

        {headerTab === "workbench" && (
          <Card className="p-5 border border-gray-100 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 flex-row">
              <h2 className="text-lg font-semibold text-gray-900">میزکار فنی (نسخه قبلی)</h2>
              <div className="flex flex-wrap gap-2 flex-row">
                {workbenchProjects.map((project) => (
                  <Button
                    key={project.id}
                    variant={activeWorkbench === project.id ? "primary" : "ghost"}
                    className="text-sm"
                    onClick={() => setActiveWorkbench(project.id)}
                  >
                    {project.utn}
                  </Button>
                ))}
              </div>
            </div>

            {workbenchProjects
              .filter((project) => project.id === activeWorkbench)
              .map((project) => (
                <div key={project.id} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-2">
                      <div className="flex items-center justify-between flex-row">
                        <div className="flex items-center gap-2 flex-row">
                          <span className="px-2 py-1 text-xs rounded-lg border border-gray-200">{project.utn}</span>
                          <p className="font-semibold text-gray-900">{project.title}</p>
                        </div>
                        <span className="text-xs text-gray-500">{project.due}</span>
                      </div>
                      <p className="text-sm text-gray-600">محل: {project.location}</p>
                      <p className="text-xs text-gray-500">تمرکز: {project.focus}</p>
                      <div className="flex items-center justify-between text-xs text-gray-700 flex-row">
                        <span>مالک: {project.owner}</span>
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                          {project.capa}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white rounded-full border border-gray-100 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                      <div className="text-sm font-medium text-gray-900 mb-2">جزئیات پرریسک</div>
                      <div className="space-y-2">
                        {project.callouts.map((callout) => (
                          <div
                            key={callout.id}
                            className="flex items-center justify-between text-sm text-gray-700 flex-row"
                          >
                            <span className="text-gray-600">{callout.label}</span>
                            <span className="px-2 py-1 rounded-lg border border-gray-200 bg-white">{callout.detail}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        {project.risk}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-3">
                      <div className="text-sm font-medium text-gray-900">ویژگی‌های فعال</div>
                      <div className="grid grid-cols-2 gap-2">
                        {project.features.map((feature) => (
                          <button
                            key={feature.id}
                            className={`p-3 rounded-lg border text-right transition flex flex-col items-start gap-1 ${
                              activeFeature === feature.id ? "border-indigo-200 bg-white shadow-sm" : "border-gray-100 bg-white"
                            }`}
                            onClick={() =>
                              setActiveFeatureTab((prev) => ({
                                ...prev,
                                [project.id]: feature.id,
                              }))
                            }
                          >
                            <span className="text-sm font-semibold text-gray-900">{feature.label}</span>
                            <span className="text-xs text-gray-500">{feature.helper}</span>
                            {feature.count !== undefined && (
                              <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-2 py-0.5">
                                {feature.count}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {activeFeatureDetail && (
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="lg:col-span-2 p-4 rounded-xl border border-gray-100 bg-white space-y-3">
                        <div className="flex items-center justify-between flex-row mb-2">
                          <h3 className="font-semibold text-gray-900">{project.features.find((f) => f.id === activeFeature)?.label}</h3>
                          <span className="text-xs text-gray-500">نسخه احیا شده از داشبورد قبلی</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-7">{activeFeatureDetail.summary}</p>
                        <div className="grid gap-2 md:grid-cols-3">
                          {activeFeatureDetail.highlights.map((highlight) => (
                            <div
                              key={highlight.id}
                              className={`p-3 rounded-lg border text-right ${highlightToneClass(highlight.tone)}`}
                            >
                              <div className="text-xs text-gray-500">{highlight.helper}</div>
                              <div className="text-lg font-semibold text-gray-900">{highlight.value}</div>
                              <div className="text-sm text-gray-700">{highlight.label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-2">
                          {activeFeatureDetail.checklist.map((item) => (
                            <label
                              key={item.id}
                              className="flex items-start gap-2 p-3 rounded-lg border border-gray-100 bg-gray-50 flex-row cursor-pointer"
                            >
                              <input type="checkbox" checked={item.done} readOnly className="mt-1" />
                              <div>
                                <p className={`text-sm font-medium ${item.done ? "line-through text-gray-500" : "text-gray-900"}`}>
                                  {item.label}
                                </p>
                                {item.note && <p className="text-xs text-gray-500">{item.note}</p>}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-gray-100 bg-white space-y-2">
                        <div className="text-sm font-semibold text-gray-900">اقدام فوری</div>
                        {activeFeatureDetail.actions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleFeatureAction(action.label)}
                            className={`w-full text-right px-3 py-2 rounded-lg border transition flex flex-col gap-0.5 ${
                              action.intent === "primary"
                                ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                                : "bg-gray-50 border-gray-100 text-gray-800 hover:border-gray-200"
                            }`}
                          >
                            <span className="text-sm font-semibold">{action.label}</span>
                            {action.helper && <span className="text-xs opacity-80">{action.helper}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </Card>
        )}

        {headerTab === "workbench" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-5 bg-white border border-gray-100 lg:col-span-2">
              <div className="flex items-center justify-between mb-4 flex-row">
                <h2 className="text-lg font-semibold text-gray-900">کارهای اولویت‌دار</h2>
                <Button
                  variant={showTaskForm ? "secondary" : "ghost"}
                  className="text-sm text-gray-700"
                  onClick={() => setShowTaskForm((prev) => !prev)}
                >
                  <Icon name={showTaskForm ? "x" : "plus"} size={16} className="ml-2" />
                  {showTaskForm ? "بستن فرم" : "افزودن"}
                </Button>
              </div>
              {showTaskForm && (
                <div className="mb-4 grid gap-3 md:grid-cols-3 bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-right"
                    placeholder="عنوان کار"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                  />
                  <input
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-right"
                    placeholder="مسئول"
                    value={taskForm.owner}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, owner: e.target.value }))}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-right"
                      placeholder="موعد"
                      value={taskForm.due}
                      onChange={(e) => setTaskForm((prev) => ({ ...prev, due: e.target.value }))}
                    />
                    <Button variant="primary" className="px-3" onClick={handleAddTask}>
                      ذخیره
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-start justify-between gap-3 flex-row ${
                      task.done ? "opacity-70" : ""
                    }`}
                  >
                    <div className="space-y-1">
                      <p className={`font-medium text-gray-900 ${task.done ? "line-through" : ""}`}>{task.title}</p>
                      <p className="text-sm text-gray-500">
                        مالک: {task.owner} · {task.due}
                      </p>
                    </div>
                    <Button
                      variant={task.done ? "secondary" : "ghost"}
                      className="text-sm text-gray-700"
                      onClick={() => handleToggleTask(task.id)}
                    >
                      <Icon name="check" size={16} className="ml-1" />
                      {task.done ? "بازگردانی" : "تکمیل"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 bg-white border border-gray-100">
              <div className="flex items-center justify-between mb-3 flex-row">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">تقویم فنی (شمسی)</h2>
                  <p className="text-xs text-gray-500 mt-1">انتخاب تاریخ شمسی و رویدادهای فنی</p>
                </div>
                <span className="text-sm text-gray-500">بازه هفتگی · فارسی</span>
              </div>
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD"
                value={calendarValue as any}
                onChange={(value) => setCalendarValue(value as DateObject)}
                className="w-full"
                containerClassName="w-full"
                inputClass="w-full rounded-xl border border-gray-200 px-3 py-2 text-right"
              />
              <div className="flex items-center justify-between text-xs text-gray-500 mt-3 flex-row">
                <span>
                  {selectedDateKey
                    ? `روز انتخابی: ${formatPersianDate(selectedDateKey, "dddd D MMMM YYYY")}`
                    : "یک روز در تقویم انتخاب کنید"}
                </span>
                <span className="text-emerald-700 font-medium">تقویم فارسی / شمسی</span>
              </div>
              <div className="mt-4 space-y-2">
                {dayEvents.length === 0 && (
                  <div className="p-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-600 text-center">
                    رویدادی برای تاریخ انتخاب‌شده ثبت نشده است.
                  </div>
                )}
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between flex-row"
                  >
                    <div className="space-y-1">
                      <p className="text-sm text-gray-900 font-medium">{event.label}</p>
                      <p className="text-xs text-gray-500">
                        {formatPersianDate(event.date)} · ساعت {event.time} · کانال: {event.channel}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg border ${event.badgeClass}`}>
                      {formatPersianDate(event.date, "YYYY/MM/DD")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2 flex-row">
                  <h4 className="text-sm font-semibold text-gray-900">رویدادهای بعدی</h4>
                  <span className="text-xs text-gray-500">مرتب‌شده بر اساس تاریخ شمسی</span>
                </div>
                <div className="space-y-2">
                  {upcomingCalendarEvents.map((event) => (
                    <div
                      key={`upcoming-${event.id}`}
                      className="p-3 rounded-lg border border-gray-100 bg-white flex items-center justify-between flex-row"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">{event.label}</p>
                        <p className="text-xs text-gray-500">
                          {formatPersianDate(event.date)} · {event.time} · {event.channel}
                        </p>
                      </div>
                      <span className={`text-[11px] px-2 py-1 rounded-lg border ${event.badgeClass}`}>
                        {formatPersianDate(event.date, "dddd D MMM")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {headerTab === "teamCalendar" && (
          <>
            {/* Collaboration */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="p-5 border border-gray-100 bg-white lg:col-span-2">
                <div className="flex items-center justify-between mb-4 flex-row">
                  <h2 className="text-lg font-semibold text-gray-900">برد هماهنگی تیمی</h2>
                  <Button variant="ghost" className="text-sm text-gray-700">
                    <Icon name="arrow-left" size={16} className="ml-2" />
                    مشاهده همه
                  </Button>
                </div>
                <div className="space-y-3">
                  {initialCollabBoardItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between flex-row">
                        <div className="flex items-center gap-2 flex-row">
                          <span className="text-xs px-2 py-1 rounded-lg border border-gray-200 text-gray-700">
                            {item.utn}
                          </span>
                          <p className="font-semibold text-gray-900">{item.title}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-lg border ${item.statusClass}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between text-sm text-gray-600 gap-2 flex-row">
                        <span>مالک: {item.owner}</span>
                        <span>محل: {item.location}</span>
                        <span>موعد: {item.due}</span>
                        <span className="text-gray-500">کانال: {item.channel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="p-5 border border-gray-100 bg-white">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">اقدامات فوری</h3>
                  <div className="space-y-2">
                    {initialCollabActionItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between flex-row"
                      >
                        <div className="space-y-1">
                          <p className="text-sm text-gray-900 font-medium">{item.title}</p>
                          <p className="text-xs text-gray-500">مسئول: {item.owner}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-lg border ${item.badgeClass}`}>{item.due}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-5 border border-gray-100 bg-white">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">جریان‌های تیمی</h3>
                  <div className="space-y-3">
                    {collabTeamStreams.map((stream) => (
                      <div key={stream.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm text-gray-700 flex-row">
                          <span className="font-medium text-gray-900">{stream.title}</span>
                          <span className="text-xs text-gray-500">{stream.owner}</span>
                        </div>
                        <p className="text-xs text-gray-500 text-right">{stream.focus}</p>
                        <div className="w-full h-2 bg-gray-100 rounded-full">
                          <div
                            className={`h-full rounded-full ${stream.progressClass}`}
                            style={{ width: `${stream.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Quick links & team */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="p-5 border border-gray-100 bg-white lg:col-span-2">
                <div className="flex items-center justify-between mb-4 flex-row">
                  <h2 className="text-lg font-semibold text-gray-900">میانبرهای همکاری</h2>
                  <span className="text-sm text-gray-500">ارسال سریع فایل و جلسه</span>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {collabQuickLinks.map((link) => (
                    <div
                      key={link.id}
                      className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-2"
                    >
                      <div className="flex items-center justify-between flex-row">
                        <p className="font-semibold text-gray-900">{link.title}</p>
                        <span className={`text-xs px-2 py-1 rounded-lg border ${link.badgeClass}`}>
                          {link.badge}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{link.detail}</p>
                      <Button variant="ghost" className="text-sm text-gray-700">
                        <Icon name="arrow-left" size={16} className="ml-2" />
                        شروع
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 border border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-3 flex-row">
                  <h3 className="text-base font-semibold text-gray-900">حضور شیفت</h3>
                  <span className="text-xs text-gray-500">۵ نفر آنلاین</span>
                </div>
                <div className="space-y-3">
                  {availableTechnicians.map((tech) => (
                    <div
                      key={tech.email}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100 flex-row"
                    >
                      <div className="flex items-center gap-3 flex-row">
                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden" aria-hidden>
                          {tech.imageUrl ? (
                            <img src={tech.imageUrl} alt={tech.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-700 font-semibold">
                              {tech.initials || tech.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tech.name}</p>
                          <p className="text-xs text-gray-500">{tech.role || "کارشناس فنی"}</p>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                        آماده
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {headerTab === "general" && (
          <>
            {/* Workflow & Reports */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-5 border border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-3 flex-row">
                  <h2 className="text-lg font-semibold text-gray-900">ارجاعات در جریان</h2>
                  <span className="text-sm text-gray-500">SLA زنده</span>
                </div>
                <div className="space-y-2">
                  {initialWorkflowAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-2 flex-row"
                    >
                      <div className="flex items-center gap-2 flex-row text-sm text-gray-900 font-medium">
                        <span className="px-2 py-1 rounded-lg border border-gray-200 text-xs">{assignment.utn}</span>
                        {assignment.title}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-600 flex-row">
                        <span>مسئول: {assignment.tech}</span>
                        <span className="text-gray-500">مرحله: {assignment.stage}</span>
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                          {assignment.sla}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 border border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-3 flex-row">
                  <h2 className="text-lg font-semibold text-gray-900">صف گزارش‌ها</h2>
                  <span className="text-sm text-gray-500">آماده انتشار</span>
                </div>
                <div className="space-y-2">
                  {initialReportQueue.map((report) => (
                    <div
                      key={report.id}
                      className="p-3 rounded-lg border border-gray-100 bg-gray-50 space-y-2"
                    >
                      <div className="flex items-center justify-between flex-row">
                        <div className="flex items-center gap-2 flex-row">
                          <span className="px-2 py-1 rounded-lg border border-gray-200 text-xs">{report.utn}</span>
                          <p className="font-medium text-gray-900">{report.subject}</p>
                        </div>
                        <span className="text-xs text-gray-500">{report.due}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 flex-row">
                        <span>مالک: {report.owner}</span>
                        <span>مرحله: {report.stage}</span>
                        <span>کانال: {report.channel}</span>
                        <span className="px-2 py-1 rounded-lg border border-gray-200">{report.sensitivity}</span>
                        <span className="text-emerald-700">{report.completeness}% تکمیل</span>
                        <span className="text-gray-500">پیوست: {report.attachments}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Knowledge & Support */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="p-5 border border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-3 flex-row">
                  <h2 className="text-lg font-semibold text-gray-900">منابع دانش</h2>
                  <span className="text-sm text-gray-500">به‌روز شده</span>
                </div>
                <div className="space-y-3">
                  {knowledgeBaseResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between flex-row"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{resource.title}</p>
                        <p className="text-sm text-gray-600">{resource.detail}</p>
                      </div>
                      <Button
                        variant="ghost"
                        className="text-sm text-gray-700"
                        onClick={() => handleOpenResource(resource)}
                      >
                        <Icon name="download" size={16} className="ml-2" />
                        باز کردن
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5 border border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-3 flex-row">
                  <h2 className="text-lg font-semibold text-gray-900">حمایت سریع</h2>
                  <span className="text-sm text-gray-500">کانال‌های تیم فنی</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {supportShortcuts.map((shortcut) => (
                    <button
                      key={shortcut.id}
                      className="p-3 rounded-xl border border-gray-100 bg-gray-50 text-right hover:border-gray-200 transition"
                      onClick={() => handleShortcutClick(shortcut)}
                    >
                      <p className="font-medium text-gray-900">{shortcut.title}</p>
                      <p className="text-sm text-gray-600">{shortcut.detail}</p>
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>

      <Dialog
        isOpen={showFieldMissionDialog}
        onClose={() => setShowFieldMissionDialog(false)}
        title="رزرو ماموریت میدانی"
      >
        <div className="space-y-4 text-right">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="عنوان ماموریت"
              value={fieldMissionForm.title}
              onChange={(e) =>
                setFieldMissionForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="مثلاً بازدید ایمنی یا تحویل تجهیز"
            />
            <Input
              label="محل حضور"
              value={fieldMissionForm.location}
              onChange={(e) =>
                setFieldMissionForm((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="لوکیشن دقیق را وارد کنید"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                تاریخ اجرای ماموریت
              </p>
              <DatePicker
                value={fieldMissionForm.date}
                onChange={(value) => {
                  if (Array.isArray(value)) return;
                  setFieldMissionForm((prev) => ({ ...prev, date: value }));
                }}
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD"
                calendarPosition="bottom-center"
                containerClassName="w-full"
                inputClass="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-right bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <Input
              label="بازه زمانی پیشنهادی"
              value={fieldMissionForm.window}
              onChange={(e) =>
                setFieldMissionForm((prev) => ({ ...prev, window: e.target.value }))
              }
              placeholder="مثلاً 09:00 تا 11:00"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                کارشناس مسئول
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-right bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                value={fieldMissionForm.lead}
                onChange={(e) =>
                  setFieldMissionForm((prev) => ({ ...prev, lead: e.target.value }))
                }
              >
                {availableTechnicians.map((tech) => (
                  <option key={tech.id} value={tech.name}>
                    {tech.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
                توضیحات هماهنگی
              </label>
              <textarea
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-right bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                rows={3}
                value={fieldMissionForm.notes}
                onChange={(e) =>
                  setFieldMissionForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="پیش‌نیازهای حضور، تجهیزات لازم یا هماهنگی با واحدها"
              />
            </div>
          </div>

          <div className="flex items-center justify-between flex-row-reverse">
            <div className="text-xs text-gray-500">
              رزرو موقت پس از تأیید به جدول زمان‌بندی تیم میدانی اضافه می‌شود.
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <Button variant="ghost" className="text-sm" onClick={() => setShowFieldMissionDialog(false)}>
                انصراف
              </Button>
              <Button variant="primary" className="text-sm" onClick={handleSubmitFieldMission}>
                ثبت و هماهنگی
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        title={selectedResource?.title ?? "منبع دانش"}
      >
        <div className="space-y-4 text-right">
          <p className="text-sm text-gray-700 leading-relaxed">
            {selectedResource?.detail ?? "نسخه به‌روز شده منبع دانش"}
          </p>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 space-y-2 text-sm text-gray-700">
            <div className="flex items-center justify-between flex-row-reverse">
              <span className="text-gray-500">وضعیت دسترسی</span>
              <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-100">
                آماده دانلود
              </span>
            </div>
            <div className="flex items-center gap-2 flex-row-reverse text-gray-600">
              <Icon name="shield" size={16} />
              دسترسی شما در اتاق داده ایمن ثبت شد و امکان اشتراک‌گذاری با تیم وجود دارد.
            </div>
          </div>
          <div className="flex justify-end gap-3 flex-row-reverse">
            <Button variant="ghost" className="text-sm" onClick={() => setSelectedResource(null)}>
              بستن
            </Button>
            <Button variant="secondary" className="text-sm" onClick={handleShareResource}>
              <Icon name="share" size={16} className="ml-2" />
              اشتراک‌گذاری با تیم
            </Button>
            <Button variant="primary" className="text-sm" onClick={handleDownloadResource}>
              <Icon name="download" size={16} className="ml-2" />
              دانلود و باز کردن
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={!!activeSupportShortcut}
        onClose={() => setActiveSupportShortcut(null)}
        title={activeSupportShortcut ? `حمایت سریع · ${activeSupportShortcut.title}` : "حمایت سریع"}
      >
        <div className="space-y-4 text-right">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700 space-y-2">
            <div className="flex items-center gap-2 flex-row-reverse">
              <Icon name="bolt" size={16} className="ml-1" />
              {activeSupportShortcut?.detail || "کانال آماده پاسخ‌گویی"}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2 flex-row-reverse">
              <Icon name="clock" size={14} />
              نوبت شما ثبت شد. میانگین پاسخ‌گویی کمتر از ۱۰ دقیقه است.
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 text-right">
              توضیح مختصر برای تیم پشتیبانی
            </label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-right bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
              rows={3}
              value={supportNote}
              onChange={(e) => setSupportNote(e.target.value)}
              placeholder="شرح مشکل، شماره UTN یا نیاز فوری را بنویسید"
            />
          </div>

          <div className="flex justify-between items-center flex-row-reverse">
            <div className="text-xs text-gray-500">
              به‌صورت خودکار لینک گفتگو و پیگیری برای شما فعال می‌شود.
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <Button variant="ghost" className="text-sm" onClick={() => setActiveSupportShortcut(null)}>
                انصراف
              </Button>
              <Button
                variant="secondary"
                className="text-sm"
                onClick={() => {
                  if (!activeSupportShortcut) return;
                  showMessage(
                    `یادداشت شما برای کانال ${activeSupportShortcut.title} ارسال شد.`
                  );
                }}
              >
                <Icon name="message" size={16} className="ml-2" />
                ارسال یادداشت
              </Button>
              <Button variant="primary" className="text-sm" onClick={handleSendSupportRequest}>
                <Icon name="arrow-left" size={16} className="ml-2" />
                باز کردن کانال
              </Button>
            </div>
          </div>
        </div>
      </Dialog>
    </AppShell>
  );
}

export function TechnicianDashboard() {
  return (
    <WorkspaceProvider>
      <TechnicianDashboardView />
    </WorkspaceProvider>
  );
}

export function TechnicianCalendar() {
  return <TechnicianDashboard />;
}

export default TechnicianDashboard;
