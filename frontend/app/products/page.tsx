"use client";

import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api";
import { Product } from "@/types";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";
import ProductCard from "@/components/ui/ProductCard";
import { Search, SlidersHorizontal, Package, AlertCircle } from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    productsApi
      .list()
      .then((data) => {
        setProducts(data);
        setFiltered(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
    );
  }, [search, products]);

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gray-50">
        {/* Page header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container-lg py-10">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Digital Products
            </h1>
            <p className="text-gray-500 mt-1.5">
              Resources designed to help you learn, build and grow.
            </p>
          </div>
        </div>

        <div className="container-lg py-8">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 w-full"
                aria-label="Search products"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {!loading && !error && (
                <span className="font-medium text-gray-700">
                  {filtered.length} product{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          {/* States */}
          {error ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                We couldn't load the products right now.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 overflow-hidden bg-white"
                >
                  <div className="h-44 skeleton" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 skeleton" />
                    <div className="h-3 w-full skeleton" />
                    <div className="h-3 w-2/3 skeleton" />
                    <div className="h-5 w-1/3 skeleton mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {search ? "No products found" : "No products yet"}
              </h3>
              <p className="text-sm text-gray-500">
                {search
                  ? "Try adjusting your search terms."
                  : "Check back soon — new products are on the way."}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="btn-ghost mt-4 text-brand-600"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
