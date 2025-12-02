// src/components/layout/Topbar.tsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import { Icon } from "../ui/Icon";
import { Dropdown } from "../ui/Dropdown";
import { cn } from "../../lib/utils/cn";

interface TopbarProps {
  onSearchClick?: () => void;
  // keep the prop if you still use it elsewhere, but we won't call it from the bell anymore
  onNotificationsClick?: () => void;
  unreadNotifications?: number;
}

export function Topbar({
  onSearchClick,
  unreadNotifications = 0,
}: TopbarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // 🔔 local state for the popup under the bell
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const adminNavItems = [
    { id: "dashboard", label: "داشبورد مدیران", path: "/dashboard" },
    { id: "projects", label: "پروژه‌ها", path: "/projects" },
    { id: "calendar", label: "تقویم تیمی", path: "/calendar" },
    { id: "audit", label: "گزارش‌های ممیزی", path: "/audit-logs" },
    { id: "security", label: "رخدادهای امنیتی", path: "/security-logs" },
    { id: "messenger", label: "پیام‌رسان", path: "/messenger" },
  ];

  const clientNavItems = [
    {
      id: "client-dashboard",
      label: "داشبورد مشتری",
      path: "/dashboard/client",
    },
  ];

  const technicianNavItems = [
    {
      id: "technician-dashboard",
      label: "داشبورد فنی",
      path: "/dashboard/technician",
    },
    {
      id: "technician-team-calendar",
      label: "تقویم تیمی",
      path: "/dashboard/technician?tab=teamCalendar",
    },
    {
      id: "technician-workbench",
      label: "میز کار",
      path: "/dashboard/technician?tab=workbench",
    },
    {
      id: "technician-messenger",
      label: "پیام‌رسان",
      path: "/messenger",
    },
  ];

  const navItems =
    user?.role === "client"
      ? clientNavItems
      : user?.role === "technician"
      ? technicianNavItems
      : adminNavItems;

  const isActivePath = (path: string) => {
    if (!path) return false;
    const [pathname, search] = path.split("?");
    if (search) {
      return location.pathname === pathname && location.search === `?${search}`;
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const userMenuItems = [
    {
      id: "profile",
      label: "پروفایل کاربری",
      icon: <Icon name="user" size={16} />,
      onClick: () => navigate("/settings/profile"),
    },
    {
      id: "settings",
      label: "تنظیمات امنیتی",
      icon: <Icon name="settings" size={16} />,
      onClick: () => navigate("/settings/security"),
    },
    {
      id: "logout",
      label: "خروج از حساب",
      icon: <Icon name="logout" size={16} />,
      onClick: () => {
        logout();
        navigate("/login");
      },
    },
  ];

  const notificationItems = [
    {
      id: "notif-1",
      title: "۳ پرونده در انتظار ارزیابی",
      description: "پرونده‌های جدید به میز کار اضافه شده‌اند.",
      onClick: () => navigate("/dashboard/technician?tab=workbench"),
    },
    {
      id: "notif-2",
      title: "به‌روزرسانی تقویم تیمی",
      description: "دو بازرسی میدانی برای فردا برنامه‌ریزی شده است.",
      onClick: () => navigate("/dashboard/technician?tab=teamCalendar"),
    },
  ];

  return (
    <div
      className="bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-[0_4px_18px_rgba(15,23,42,0.06)] sticky top-0 z-40"
      dir="rtl"
    >
      <div className="px-6 py-4 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* عنوان و ناوبری */}
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[13px] text-gray-500">
                سامانه کنترل پروژه‌های کلان
              </p>
              <h1 className="text-xl font-bold text-gray-900">مرکز عملیات</h1>
            </div>
            <nav className="flex items-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActivePath(item.path)
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* آیکن‌های جست‌وجو، اعلان و منوی کاربر */}
          <div className="flex flex-row-reverse items-center gap-3">
            {/* جست‌وجو */}
            <button
              type="button"
              onClick={onSearchClick}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              aria-label="جست‌وجو"
            >
              <Icon name="search" size={20} />
            </button>

            {/* اعلان‌ها – پاپ‌آپ فقط زیر خود زنگ */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotificationsOpen((open) => !open)}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors relative"
                aria-label="اعلان‌ها"
              >
                <Icon name="bell" size={20} />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full" />
                )}
              </button>

              {isNotificationsOpen && (
                <div
                  className="
                    absolute z-50
                    mt-2
                    left-1/2 -translate-x-1/2
                    w-80
                    bg-white border border-gray-200
                    rounded-2xl shadow-xl
                    py-2
                  "
                >
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">
                      اعلان‌ها
                    </span>
                    {unreadNotifications > 0 && (
                      <span className="text-[11px] text-amber-500">
                        {unreadNotifications} مورد جدید
                      </span>
                    )}
                  </div>

                  <div className="max-h-72 overflow-auto">
                    {notificationItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          item.onClick?.();
                          setIsNotificationsOpen(false);
                        }}
                        className="w-full text-right px-4 py-3 hover:bg-gray-50 flex flex-col gap-1"
                      >
                        <span className="text-xs font-semibold text-gray-900">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {item.description}
                        </span>
                      </button>
                    ))}

                    {notificationItems.length === 0 && (
                      <div className="px-4 py-6 text-center text-xs text-gray-400">
                        اعلان جدیدی وجود ندارد.
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/notifications");
                        setIsNotificationsOpen(false);
                      }}
                      className="w-full text-[11px] text-indigo-600 hover:text-indigo-700 text-right"
                    >
                      مشاهده همه اعلان‌ها
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* منوی کاربر */}
            <Dropdown
              trigger={
                <div className="flex flex-row-reverse items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-10 h-10 rounded-full border-2 border-gray-200 object-cover"
                  />
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.name}
                    </div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                </div>
              }
              items={userMenuItems}
              dir="rtl"
              align="left"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
