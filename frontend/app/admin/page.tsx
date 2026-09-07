"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminDashboardApi } from "@/lib/api";
import { formatPrice, formatDate } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Clock,
  ArrowRight,
  Loader2,
  Plus,
} from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconClass}`}>
          <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminDashboardApi.stats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Here's what's happening with your store.
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`₦${(stats?.total_revenue_naira || 0).toLocaleString()}`}
          icon={TrendingUp}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Successful Sales"
          value={stats?.paid_orders ?? 0}
          icon={ShoppingCart}
          iconClass="bg-brand-50 text-brand-600"
        />
        <StatCard
          label="Pending Orders"
          value={stats?.pending_orders ?? 0}
          icon={Clock}
          iconClass="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Total Products"
          value={stats?.total_products ?? 0}
          icon={Package}
          iconClass="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {!stats?.recent_orders?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
              <ShoppingCart className="w-6 h-6 text-gray-400" />
            </div>
            <p className="font-medium text-gray-600 text-sm">No orders yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Orders will appear here after customers make purchases.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Reference", "Customer", "Product", "Amount", "Status", "Date"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recent_orders.map((order: any) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-brand-600 hover:text-brand-700 text-xs font-semibold transition-colors"
                      >
                        {order.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-[160px] truncate">
                      {order.customer_email}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium max-w-[180px] truncate">
                      {order.product_name}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      ₦{(order.amount / 100).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
