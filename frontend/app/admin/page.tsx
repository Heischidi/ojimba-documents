"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminDashboardApi } from "@/lib/api";
import { formatPrice, formatDate } from "@/types";
import { TrendingUp, Package, ShoppingCart, XCircle, Clock, ArrowRight, Loader2 } from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="card p-5 flex items-center gap-4 animate-fade-in">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="font-display font-bold text-2xl text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    paid: "badge-success",
    pending: "badge-warning",
    failed: "badge-error",
    refunded: "badge-info",
    cancelled: "badge-gray",
  };
  return <span className={classes[status] || "badge-gray"}>{status}</span>;
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
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back. Here's what's happening.</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary text-sm">
          + Add Product
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          label="Total Revenue"
          value={`₦${(stats?.total_revenue_naira || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Successful Sales"
          value={stats?.paid_orders || 0}
          icon={ShoppingCart}
          color="bg-brand-50 text-brand-600"
        />
        <StatCard
          label="Pending Orders"
          value={stats?.pending_orders || 0}
          icon={Clock}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Total Products"
          value={stats?.total_products || 0}
          icon={Package}
          color="bg-blue-50 text-blue-600"
        />
      </div>

      {/* Recent orders */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-display font-bold text-lg text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {stats?.recent_orders?.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No orders yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Reference</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Customer</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Product</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_orders?.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-brand-600 hover:text-brand-700 font-semibold text-xs">
                        {order.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 truncate max-w-[180px]">{order.customer_email}</td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium truncate max-w-[180px]">{order.product_name}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      ₦{(order.amount / 100).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(order.created_at)}</td>
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
