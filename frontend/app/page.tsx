"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api";
import { Product, formatPrice } from "@/types";
import { ShoppingBag, Download, Shield, Zap, ArrowRight, Star, CheckCircle2 } from "lucide-react";

// ── Navigation ────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container-lg flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
            <Download className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-gray-900 text-lg">DigiStore</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Products
          </Link>
          <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Contact
          </Link>
        </nav>
        <Link href="/products" className="btn-primary text-sm px-4 py-2">
          Browse Products
        </Link>
      </div>
    </header>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4">
      <div className="container-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Download className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-display font-bold text-white text-base">DigiStore</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Premium digital products delivered securely to your inbox after payment.
            </p>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-3">Product</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-3">Legal</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800 text-sm text-center">
          © {new Date().getFullYear()} DigiStore. All rights reserved. Payments powered by Paystack.
        </div>
      </div>
    </footer>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="card group flex flex-col overflow-hidden hover:-translate-y-1 transition-all duration-300 animate-fade-in"
    >
      <div className="relative h-48 bg-gradient-subtle overflow-hidden">
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-brand-600" />
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="badge-purple text-xs px-2 py-1">
            {product.mime_type?.split("/")[1]?.toUpperCase() || "FILE"}
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-gray-900 text-lg leading-snug mb-2 group-hover:text-brand-700 transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="text-brand-700 font-bold text-xl">
            {formatPrice(product.price, product.currency)}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-gray-400 group-hover:text-brand-600 transition-colors">
            Buy Now <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Homepage ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.list().then(setProducts).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Nav />
      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-brand-900 to-indigo-900 text-white py-24 md:py-36 px-4">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.3),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(79,70,229,0.2),transparent_60%)]" />
          <div className="container-md relative text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8 backdrop-blur-sm animate-fade-in">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span>Instant delivery after payment</span>
            </div>
            <h1 className="font-display font-extrabold text-4xl md:text-6xl lg:text-7xl leading-tight mb-6 animate-fade-in">
              Premium Digital
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Products
              </span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in">
              Courses, templates, guides, and tools — delivered securely to your email the moment payment clears.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
              <Link href="/products" className="btn-primary text-base px-8 py-4">
                Browse All Products
              </Link>
              <Link href="#how-it-works" className="btn-ghost text-white/80 hover:text-white hover:bg-white/10 text-base px-6 py-4">
                How It Works
              </Link>
            </div>
            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-gray-400">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Secure payments</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant delivery</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Private downloads</div>
            </div>
          </div>
        </section>

        {/* ── Featured Products ── */}
        <section className="section bg-gray-50">
          <div className="container-lg">
            <div className="text-center mb-12">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 mb-3">
                Featured Products
              </h2>
              <p className="text-gray-500 text-lg">High-quality digital resources hand-picked for you.</p>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="card h-72 skeleton" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No products available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
            {products.length > 0 && (
              <div className="text-center mt-10">
                <Link href="/products" className="btn-secondary">
                  View All Products <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="section">
          <div className="container-md">
            <div className="text-center mb-12">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 mb-3">
                How It Works
              </h2>
              <p className="text-gray-500 text-lg">3 simple steps to your digital product</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: "01", icon: ShoppingBag, title: "Pick a Product", desc: "Browse our catalog and select the digital product you want." },
                { step: "02", icon: Zap, title: "Pay Securely", desc: "Complete payment via Paystack. Your transaction is protected." },
                { step: "03", icon: Download, title: "Download Instantly", desc: "Receive a secure download link in your email within seconds." },
              ].map(({ step, icon: Icon, title, desc }) => (
                <div key={step} className="text-center group">
                  <div className="relative inline-flex items-center justify-center mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-brand-50 group-hover:bg-brand-100 transition-colors flex items-center justify-center">
                      <Icon className="w-7 h-7 text-brand-600" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
                      {step.slice(-1)}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust Section ── */}
        <section className="section bg-brand-600">
          <div className="container-md text-center text-white">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-90" />
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
              Your Purchase is Fully Protected
            </h2>
            <p className="text-brand-100 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              Files are stored privately on encrypted cloud storage. Download links are unique, time-limited, 
              and tied to your email. No public file access — ever.
            </p>
            <Link href="/products" className="inline-flex items-center gap-2 bg-white text-brand-700 font-semibold px-8 py-4 rounded-xl hover:bg-brand-50 transition-colors">
              Shop Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
