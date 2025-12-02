import React, { useState, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

interface FastPassFormData {
  firstName: string; // نام
  lastName: string; // نام خانوادگی
  nationalId: string; // شماره ملی
  birthDate: string; // تاریخ تولد (شمسی)
  mobile: string; // تلفن همراه
  email: string; // ایمیل
  requestTitle: string; // عنوان درخواست
  description: string; // توضیحات
}

type FastPassStatus = "new" | "inProgress" | "answered";

interface StoredFastPassInquiry {
  id: number;
  clientName: string;
  email: string;
  createdAt: string;
  title: string;
  status: FastPassStatus;
}

const FastPass: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FastPassFormData>({
    firstName: "",
    lastName: "",
    nationalId: "",
    birthDate: "",
    mobile: "",
    email: "",
    requestTitle: "",
    description: "",
  });

  const [birthDateObj, setBirthDateObj] = useState<DateObject | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBirthDateChange = (value: any) => {
    const v = Array.isArray(value) ? value[0] : value;
    const dateObj = v as DateObject | null;
    setBirthDateObj(dateObj);
    setFormData((prev) => ({
      ...prev,
      birthDate: dateObj ? dateObj.format("YYYY/MM/DD") : "",
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    console.log("FastPass form data:", formData);
    console.log("Files:", files);

    // ذخیره درخواست در localStorage تا در داشبورد مدیر در Fast Pass Inbox دیده شود
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("fastPassInbox");
        const list: StoredFastPassInquiry[] = raw ? JSON.parse(raw) : [];

        const newInquiry: StoredFastPassInquiry = {
          id: Date.now(),
          clientName: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          createdAt: new Date().toISOString(),
          title: formData.requestTitle || "درخواست Fast Pass",
          status: "new",
        };

        const updated = [newInquiry, ...list];
        window.localStorage.setItem("fastPassInbox", JSON.stringify(updated));
      }
    } catch (err) {
      console.warn("Fast Pass inbox localStorage error", err);
    }

    alert("درخواست Fast Pass ثبت شد و برای تیم اجرایی ارسال گردید.");

    // بعد از ثبت، کاربر را به داشبورد مشتری برگردان
    navigate("/dashboard/client");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-6"
      dir="rtl"
    >
      <Card className="w-full max-w-2xl p-8 rounded-3xl shadow-xl bg-white text-right">
        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between flex-row-reverse">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">فرم Fast Pass</h1>
            <p className="text-sm text-gray-600 mt-2">
              لطفاً اطلاعات زیر را برای ثبت درخواست Fast Pass تکمیل کنید.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/dashboard/client")}
          >
            بازگشت به داشبورد
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* مشخصات فردی */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="نام"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="مثال: علی"
              required
            />

            <Input
              label="نام خانوادگی"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="مثال: رضی"
              required
            />

            <Input
              label="شماره ملی"
              name="nationalId"
              value={formData.nationalId}
              onChange={handleChange}
              placeholder="مثال: ۰۰۱۲۳۴۵۶۷۸"
              required
            />

            {/* تاریخ تولد با تقویم شمسی */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                تاریخ تولد (تقویم شمسی)
              </label>
              <DatePicker
                value={birthDateObj}
                onChange={handleBirthDateChange}
                calendar={persian}
                locale={persian_fa}
                calendarPosition="bottom-center"
                format="YYYY/MM/DD"
                inputClass="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-right"
                containerClassName="w-full"
                placeholder="انتخاب تاریخ تولد"
              />
            </div>

            <Input
              label="تلفن همراه"
              name="mobile"
              type="tel"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="مثال: ۰۹۱۲۱۲۳۴۵۶۷"
              required
            />

            <Input
              label="ایمیل"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              dir="ltr"
              required
            />
          </div>

          {/* عنوان درخواست */}
          <Input
            label="عنوان درخواست"
            name="requestTitle"
            value={formData.requestTitle}
            onChange={handleChange}
            placeholder="مثال: دسترسی سریع به داشبورد پروژه‌ها"
            required
          />

          {/* توضیحات */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              توضیحات
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="توضیح مختصر درباره درخواست خود بنویسید..."
            />
          </div>

          {/* آپلود فایل (چند فایل) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              آپلود فایل (امکان آپلود چند فایل)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {files.length > 0 && (
              <ul className="mt-1 text-xs text-gray-600 space-y-1">
                {files.map((file, idx) => (
                  <li key={idx}>• {file.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-start">
            <Button type="submit" variant="primary" className="px-8">
              ثبت درخواست Fast Pass
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default FastPass;
