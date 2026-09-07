"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminOrdersApi } from "@/lib/api";
import { formatDate } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import { Search, ShoppingCart, Eye, Loader2 } from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (q?: string, s?: string) => {
    setLoading(true);
    try {
      const data = await adminOrdersApi.list({ search: q, status: s || undefined, limit: 100 });
      setOrders(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search || undefined, status || undefined);
  };

  return (
    <div className="max-w-6xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {total} order{total !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Email or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="input w-40"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button type="submit" className="btn-secondary px-4 text-sm">
          Search
        </button>
      </form>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <ShoppingCart className="w-7 h-7 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">No orders found</p>
          <p className="text-sm text-gray-500">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Reference", "Customer", "Product", "Amount", "Status", "Date", ""].map(
                    (h, i) => (
                      <th
                        key={i}
                        className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-gray-700">
                        {o.reference}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-[180px] truncate">
                      {o.customer_email}
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium max-w-[180px] truncate">
                      {o.product?.name || "—"}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      ₦{(o.amount / 100).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="btn-ghost py-1.5 px-2.5 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
