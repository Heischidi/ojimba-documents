"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminOrdersApi } from "@/lib/api";
import { formatDate } from "@/types";
import { Search, ShoppingCart, Eye, Loader2 } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    paid: "badge-success", pending: "badge-warning",
    failed: "badge-error", refunded: "badge-info", cancelled: "badge-gray",
  };
  return <span className={classes[status] || "badge-gray"}>{status}</span>;
}

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

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search || undefined, status || undefined); };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{total} orders total</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Email or reference…" value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 py-2" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input py-2 w-36">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button type="submit" className="btn-secondary px-4 py-2 text-sm">Search</button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : orders.length === 0 ? (
        <div className="card flex flex-col items-center py-20 text-gray-400">
          <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-lg font-semibold">No orders found</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-600">Reference</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Customer</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Product</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Amount</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Date</th>
                  <th className="px-5 py-3 font-semibold text-gray-600" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-gray-700">{o.reference}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-[180px] truncate">{o.customer_email}</td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium max-w-[180px] truncate">{o.product?.name || "—"}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">₦{(o.amount / 100).toLocaleString()}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${o.id}`} className="btn-ghost py-1.5 px-2.5 text-xs">
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
