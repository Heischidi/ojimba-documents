"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { adminProductsApi } from "@/lib/api";
import { formatPrice, formatDate } from "@/types";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Plus,
  Search,
  Package,
  Edit,
  Trash2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = async (q?: string) => {
    setLoading(true);
    try {
      const data = await adminProductsApi.list({ search: q, limit: 100 });
      setProducts(data.items);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search || undefined);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await adminProductsApi.delete(id);
      toast.success("Product deleted.");
      load();
    } catch {
      toast.error("Failed to delete product.");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    setToggling(id);
    try {
      await adminProductsApi.update(id, { is_active: !current });
      toast.success(`Product ${!current ? "published" : "unpublished"}.`);
      load();
    } catch {
      toast.error("Failed to update product.");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="max-w-6xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {total} product{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <button type="submit" className="btn-secondary px-4 text-sm">Search</button>
      </form>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-brand-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">No products</p>
          <p className="text-sm text-gray-500 mb-5">
            Add your first product to get started.
          </p>
          <Link href="/admin/products/new" className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Product", "Price", "Status", "File", "Created", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {p.thumbnail_url ? (
                            <Image
                              src={p.thumbnail_url}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="font-semibold text-gray-900 hover:text-brand-600 transition-colors"
                          >
                            {p.name}
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      {formatPrice(p.price, p.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={p.is_active ? "published" : "draft"} />
                    </td>
                    <td className="px-5 py-3.5">
                      {p.file_name ? (
                        <span className="font-mono text-xs text-gray-600 truncate block max-w-[140px]">
                          {p.file_name}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="w-3.5 h-3.5" />
                          No file
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-400">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(p.id, p.is_active)}
                          disabled={toggling === p.id}
                          title={p.is_active ? "Unpublish" : "Publish"}
                          className="p-1.5 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                        >
                          {toggling === p.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : p.is_active ? (
                            <ToggleRight className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deleting === p.id}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          {deleting === p.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
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
