"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { productsApi } from "@/lib/api";
import { Product } from "@/types";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";
import ProductCard from "@/components/ui/ProductCard";
import {
  ShieldCheck,
  Zap,
  Mail,
  UserX,
  ShoppingBag,
  CreditCard,
  Download,
  ArrowRight,
  Package,
} from "lucide-react";

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="container-lg py-20 md:py-28">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Instant digital delivery
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
            Premium digital resources.{" "}
            <span className="text-brand-600">Delivered instantly.</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl mx-auto">
            Discover courses, templates, guides and tools designed to help you
            learn, build and grow — delivered to your inbox the moment you pay.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/products" className="btn-primary px-7 py-3 text-base">
              Browse Products <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#how-it-works" className="btn-secondary px-7 py-3 text-base">
              How It Works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Trust Bar ─────────────────────────────────────────────────────────────────
function TrustBar() {
  const items = [
    { icon: ShieldCheck, label: "Secure payment" },
    { icon: Zap, label: "Instant delivery" },
    { icon: Mail, label: "Link sent by email" },
    { icon: UserX, label: "No account required" },
  ];
  return (
    <section className="bg-gray-50 border-b border-gray-100">
      <div className="container-lg py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {items.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-gray-500">
              <Icon className="w-4 h-4 text-brand-500 flex-shrink-0" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Featured Products ─────────────────────────────────────────────────────────
function FeaturedProducts({ products, loading }: { products: Product[]; loading: boolean }) {
  return (
    <section className="bg-white">
      <div className="container-lg py-16 md:py-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Featured Products
            </h2>
            <p className="text-gray-500 mt-1.5">
              Hand-picked digital resources ready to download.
            </p>
          </div>
          {products.length > 0 && (
            <Link
              href="/products"
              className="hidden sm:flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
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
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">No products yet</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Digital products will appear here once they are published.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-10 text-center sm:hidden">
            <Link href="/products" className="btn-secondary">
              View All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ── How It Works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: "01",
      icon: ShoppingBag,
      title: "Choose a product",
      desc: "Browse the marketplace and select the resource you need.",
    },
    {
      n: "02",
      icon: CreditCard,
      title: "Pay securely",
      desc: "Complete payment through our secure provider, Paystack.",
    },
    {
      n: "03",
      icon: Download,
      title: "Get it instantly",
      desc: "Your private download link is sent directly to your email.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-gray-50 border-y border-gray-100">
      <div className="container-lg py-16 md:py-24">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-3">
            How It Works
          </h2>
          <p className="text-gray-500">Three simple steps to get your digital product.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map(({ n, icon: Icon, title, desc }, idx) => (
            <div key={n} className="relative flex flex-col items-center text-center">
              {/* Connector line */}
              {idx < 2 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+36px)] right-0 h-px bg-gray-200" />
              )}
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-5 relative">
                <Icon className="w-7 h-7 text-gray-900" />
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Security Section ──────────────────────────────────────────────────────────
function SecuritySection() {
  const features = [
    {
      icon: ShieldCheck,
      title: "Secure Payments",
      desc: "Your payment is processed through Paystack, a PCI-DSS compliant provider.",
    },
    {
      icon: Zap,
      title: "Instant Delivery",
      desc: "Receive your download link within seconds of payment confirmation.",
    },
    {
      icon: Mail,
      title: "Private Downloads",
      desc: "Links are unique, time-limited and tied to your email. Never public.",
    },
    {
      icon: UserX,
      title: "No Account Required",
      desc: "Just enter your email and purchase. No sign-up, no passwords.",
    },
  ];

  return (
    <section className="bg-gray-900">
      <div className="container-lg py-16 md:py-24">
        <div className="text-center mb-14">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
            Simple. Secure. Instant.
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            We've made it easy to buy and receive digital products without friction.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="p-6 rounded-xl bg-gray-800/50 border border-gray-700/50"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-brand-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 btn-secondary bg-white text-gray-900 hover:bg-gray-50 border-gray-200 px-7 py-3 text-base"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
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
        <Hero />
        <TrustBar />
        <FeaturedProducts products={products} loading={loading} />
        <HowItWorks />
        <SecuritySection />
      </main>
      <Footer />
    </>
  );
}
