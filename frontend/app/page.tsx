"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api";
import { Product, formatPrice } from "@/types";
import {
  ShoppingBag,
  Download,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";

// ── Navigation ────────────────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Download className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <span className="font-bold text-gray-900 text-xl tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            DigiStore
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/products" className="text-sm font-medium text-gray-600 hover:text-violet-700 transition-colors">
            Products
          </Link>
          <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-violet-700 transition-colors">
            How it Works
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/35 hover:-translate-y-0.5 transition-all duration-200"
          >
            Browse Products
            <ArrowRight style={{ width: 15, height: 15 }} />
          </Link>
        </div>

        <button className="md:hidden p-2 rounded-lg text-gray-600" onClick={() => setOpen(!open)}>
          {open ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
          <Link href="/products" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setOpen(false)}>Products</Link>
          <Link href="#how-it-works" className="block text-sm font-medium text-gray-700 py-2" onClick={() => setOpen(false)}>How it Works</Link>
          <Link
            href="/products"
            className="block text-center px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold"
            onClick={() => setOpen(false)}
          >
            Browse Products
          </Link>
        </div>
      )}
    </header>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: "#0f0f1a" }} className="text-gray-400 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Download className="text-white" style={{ width: 16, height: 16 }} />
              </div>
              <span className="font-bold text-white text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>DigiStore</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs text-gray-500">
              Premium digital products delivered securely to your inbox the moment payment clears.
            </p>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-4">Store</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/products" className="hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-4">Legal</p>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800 text-sm text-center text-gray-600">
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
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
    >
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-violet-50 to-indigo-50">
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
              <ShoppingBag className="text-violet-600" style={{ width: 28, height: 28 }} />
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 border border-violet-200">
            {product.mime_type?.split("/")[1]?.toUpperCase() || "FILE"}
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-gray-900 text-lg leading-snug mb-2 group-hover:text-violet-700 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
          {product.name}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <span className="text-violet-700 font-bold text-xl">
            {formatPrice(product.price, product.currency)}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-gray-400 group-hover:text-violet-600 transition-colors">
            Buy Now <ArrowRight style={{ width: 15, height: 15 }} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="h-48 animate-shimmer" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/4 rounded-lg animate-shimmer" />
        <div className="h-4 w-full rounded-lg animate-shimmer" />
        <div className="h-4 w-2/3 rounded-lg animate-shimmer" />
        <div className="h-6 w-1/3 rounded-lg animate-shimmer mt-4" />
      </div>
    </div>
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
        <section
          className="relative overflow-hidden text-white py-28 md:py-40 px-4"
          style={{ background: "linear-gradient(135deg, #0f0720 0%, #1a0a3b 40%, #0c1260 100%)" }}
        >
          {/* Glowing orbs */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)", transform: "translate(30%, -30%)" }} />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #4f46e5, transparent 70%)", transform: "translate(-30%, 30%)" }} />

          <div className="max-w-4xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 border border-white/20 rounded-full px-4 py-2 text-sm mb-8 animate-fade-in" style={{ background: "rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
              <Zap className="text-yellow-400" style={{ width: 14, height: 14 }} />
              <span className="text-gray-200">Instant delivery after payment</span>
            </div>

            <h1
              className="font-black text-5xl md:text-7xl leading-[1.05] mb-6 animate-fade-in"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Premium Digital{" "}
              <span
                className="block"
                style={{ background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
              >
                Products
              </span>
            </h1>

            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-delay">
              Courses, templates, guides, and tools — delivered securely to your email the moment payment clears.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-delay">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}
              >
                Browse All Products <ArrowRight style={{ width: 18, height: 18 }} />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base text-gray-200 border border-white/20 hover:bg-white/10 transition-all duration-200"
              >
                How It Works
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-14 text-sm text-gray-400">
              {[
                { icon: CheckCircle2, text: "Secure Paystack payments" },
                { icon: Zap, text: "Instant email delivery" },
                { icon: Shield, text: "Private encrypted downloads" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="text-emerald-400" style={{ width: 16, height: 16 }} />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stats Banner ── */}
        <section className="py-8 border-y border-gray-100 bg-white">
          <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center">
            {[
              { value: "100%", label: "Secure payments" },
              { value: "<60s", label: "Delivery time" },
              { value: "5★", label: "Customer rating" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-black text-violet-700" style={{ fontFamily: "Outfit, sans-serif" }}>{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Featured Products ── */}
        <section className="py-20 md:py-28 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 mb-4">
                Our Catalogue
              </span>
              <h2 className="font-black text-4xl md:text-5xl text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
                Featured Products
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto">
                High-quality digital resources crafted to help you grow faster.
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="text-violet-400" style={{ width: 36, height: 36 }} />
                </div>
                <p className="text-gray-400 text-lg font-medium">Products coming soon!</p>
                <p className="text-gray-400 text-sm mt-1">Check back later for amazing digital resources.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.slice(0, 6).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {products.length > 0 && (
              <div className="text-center mt-12">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-violet-700 border-2 border-violet-200 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
                >
                  View All Products <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section id="how-it-works" className="py-20 md:py-28 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 mb-4">
                Simple Process
              </span>
              <h2 className="font-black text-4xl md:text-5xl text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
                How It Works
              </h2>
              <p className="text-gray-500 text-lg">3 simple steps to get your digital product</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  step: "01",
                  icon: ShoppingBag,
                  title: "Pick a Product",
                  desc: "Browse our catalog and select the digital product that fits your needs.",
                  color: "from-violet-500 to-violet-700",
                  bg: "bg-violet-50",
                  text: "text-violet-600",
                },
                {
                  step: "02",
                  icon: Zap,
                  title: "Pay Securely",
                  desc: "Complete your purchase via Paystack. 100% safe and encrypted.",
                  color: "from-indigo-500 to-indigo-700",
                  bg: "bg-indigo-50",
                  text: "text-indigo-600",
                },
                {
                  step: "03",
                  icon: Download,
                  title: "Download Instantly",
                  desc: "Receive a private, time-limited download link in your email in seconds.",
                  color: "from-emerald-500 to-emerald-700",
                  bg: "bg-emerald-50",
                  text: "text-emerald-600",
                },
              ].map(({ step, icon: Icon, title, desc, color, bg, text }) => (
                <div
                  key={step}
                  className="relative p-8 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-all duration-300 group"
                >
                  <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center mb-6`}>
                    <Icon className={text} style={{ width: 26, height: 26 }} />
                  </div>
                  <div
                    className={`absolute top-6 right-6 w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-sm font-black shadow-md`}
                  >
                    {step.slice(-1)}
                  </div>
                  <h3 className="font-bold text-xl text-gray-900 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                    {title}
                  </h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trust CTA ── */}
        <section
          className="py-20 px-4 text-white"
          style={{ background: "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)" }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6 border border-white/20">
              <Shield style={{ width: 30, height: 30 }} />
            </div>
            <h2 className="font-black text-4xl md:text-5xl mb-5" style={{ fontFamily: "Outfit, sans-serif" }}>
              Your Purchase is Fully Protected
            </h2>
            <p className="text-violet-200 text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Files are stored on encrypted cloud storage. Download links are unique, time-limited, and tied to your email. No public file access — ever.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
              style={{ color: "#6d28d9" }}
            >
              Start Shopping <ArrowRight style={{ width: 18, height: 18 }} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
