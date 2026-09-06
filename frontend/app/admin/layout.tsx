"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { authApi, ApiError } from "@/lib/api";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Settings,
  LogOut, Download, Menu, X, ChevronRight
} from "lucide-react";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Orders" },
  { href: "/admin/customers", icon: Users, label: "Customers" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    authApi.me().then(setAdmin).catch(() => {
      router.push("/admin/login");
    });
  }, [router]);

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/admin/login");
  };

  if (!admin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (href: string, exact: boolean = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-gray-900 text-gray-300">
      {/* Logo */}
      <div className="px-4 h-16 flex items-center gap-2 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
          <Download className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-display font-bold text-white text-sm">DigiStore</p>
          <p className="text-gray-500 text-xs">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
              isActive(href, exact)
                ? "bg-brand-600 text-white shadow-sm"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <Icon className="w-4.5 h-4.5 flex-shrink-0" />
            {label}
            {isActive(href, exact) && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
          </Link>
        ))}
      </nav>

      {/* Admin info + Logout */}
      <div className="px-2 pb-4 border-t border-gray-800 pt-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
            {admin.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{admin.name}</p>
            <p className="text-gray-500 text-xs truncate">{admin.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col flex-shrink-0 fixed inset-y-0 left-0 z-40">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 inset-y-0 w-60">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-display font-bold text-gray-900">DigiStore Admin</span>
          <div className="w-5" />
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
