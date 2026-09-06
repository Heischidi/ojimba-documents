"use client";

import { useEffect, useState } from "react";
import { adminCustomersApi } from "@/lib/api";
import { formatDate } from "@/types";
import { Users, Search, Loader2 } from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async (q?: string) => {
    setLoading(true);
    try {
      const data = await adminCustomersApi.list({ search: q, limit: 100 });
      setCustomers(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm">{total} unique customers</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(search || undefined); }} className="flex gap-2 mb-6 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search by email…" value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 py-2" />
        </div>
        <button type="submit" className="btn-secondary px-4 py-2 text-sm">Search</button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>
      ) : customers.length === 0 ? (
        <div className="card flex flex-col items-center py-20 text-gray-400">
          <Users className="w-12 h-12 mb-3 opacity-30" />
          <p>No customers yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-600">Customer</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Orders</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Total Spent</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Last Purchase</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.email} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{c.name || "—"}</p>
                      <p className="text-gray-500 text-xs">{c.email}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-700">{c.total_orders}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">₦{(c.total_spent_naira || 0).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-gray-500">{c.last_purchase ? formatDate(c.last_purchase) : "—"}</td>
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
