"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { adminProductsApi } from "@/lib/api";
import { formatPrice, formatDate } from "@/types";
import { Plus, Search, Package, Edit, Trash2, CheckCircle2, XCircle, Loader2, ToggleLeft } from "lucide-react";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await adminProductsApi.update(id, { is_active: !current });
      toast.success(`Product ${!current ? "published" : "unpublished"}.`);
      load();
    } catch {
      toast.error("Failed to update product.");
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} products total</p>
        </div>
        <Link href="/admin/products/new" className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 py-2"
          />
        </div>
        <button type="submit" className="btn-secondary px-4 py-2 text-sm">Search</button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
          <Package className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-lg font-semibold mb-1">No products</p>
          <p className="text-sm mb-4">Add your first product to get started.</p>
          <Link href="/admin/products/new" className="btn-primary text-sm">Add Product</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-5 py-3 font-semibold text-gray-600">Product</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Price</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">File</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Created</th>
                  <th className="px-5 py-3 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {p.thumbnail_url ? (
                            <Image src={p.thumbnail_url} alt={p.name} fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Package className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <Link href={`/admin/products/${p.id}`} className="font-semibold text-gray-900 hover:text-brand-700 transition-colors">
                            {p.name}
                          </Link>
                          <p className="text-xs text-gray-400">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">
                      {formatPrice(p.price, p.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.is_active ? (
                        <span className="badge-success flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="badge-gray flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {p.file_name ? (
                        <span className="font-mono truncate block max-w-[140px]">{p.file_name}</span>
                      ) : (
                        <span className="text-red-400 italic">No file</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{formatDate(p.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleActive(p.id, p.is_active)}
                          title={p.is_active ? "Unpublish" : "Publish"}
                          className="p-1.5 rounded-lg hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors"
                        >
                          <ToggleLeft className="w-4 h-4" />
                        </button>
                        <Link href={`/admin/products/${p.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deleting === p.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          {deleting === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
