"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { productsApi } from "@/lib/api";
import { Product, formatPrice } from "@/types";
import { ShoppingBag, Search, ArrowRight, Download } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.list().then((data) => {
      setProducts(data);
      setFiltered(data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(products.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)));
  }, [search, products]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container-lg flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Download className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-gray-900 text-lg">DigiStore</span>
          </Link>
          <Link href="/" className="btn-ghost text-sm">← Back to Home</Link>
        </div>
      </header>

      <main className="container-lg py-12 px-4">
        <div className="mb-10">
          <h1 className="font-display font-extrabold text-4xl text-gray-900 mb-2">All Products</h1>
          <p className="text-gray-500 text-lg">Browse our full catalog of premium digital resources.</p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <div key={i} className="card h-72 skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-semibold mb-2">No products found</p>
            <p className="text-sm">Try adjusting your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="card group flex flex-col overflow-hidden hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative h-44 bg-gradient-subtle">
                  {product.thumbnail_url ? (
                    <Image src={product.thumbnail_url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-brand-100 flex items-center justify-center">
                        <ShoppingBag className="w-7 h-7 text-brand-600" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h2 className="font-display font-bold text-gray-900 text-base leading-snug mb-1.5 group-hover:text-brand-700 transition-colors line-clamp-2">
                    {product.name}
                  </h2>
                  <p className="text-gray-500 text-xs leading-relaxed mb-3 flex-1 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-brand-700 font-bold text-lg">{formatPrice(product.price, product.currency)}</span>
                    <span className="btn-primary py-1.5 px-3 text-xs">Buy Now</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
