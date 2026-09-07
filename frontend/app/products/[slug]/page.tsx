import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatFileSize } from "@/types";
import {
  Download,
  ArrowLeft,
  FileText,
  HardDrive,
  ShieldCheck,
  Zap,
  Mail,
  CheckCircle2,
  Package,
} from "lucide-react";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/products/slug/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description:
      product.description || `Buy ${product.name} — instant download after payment.`,
    openGraph: {
      title: product.name,
      description: product.description || "",
      images: product.thumbnail_url ? [{ url: product.thumbnail_url }] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const fileType = product.mime_type?.split("/")[1]?.toUpperCase() || "FILE";

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="container-lg py-3.5">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/products" className="hover:text-gray-700 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Products
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium truncate max-w-[200px]">
                {product.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Main */}
        <div className="container-lg py-10 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-10 xl:gap-16">

            {/* LEFT — Image + file info */}
            <div>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                {product.thumbnail_url ? (
                  <Image
                    src={product.thumbnail_url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-900/80 text-white backdrop-blur-sm">
                    {fileType}
                  </span>
                </div>
              </div>

              {/* File details card */}
              {(product.file_name || product.file_size || product.mime_type) && (
                <div className="mt-4 card p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    File Details
                  </p>
                  <div className="space-y-2.5">
                    {product.file_name && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500 min-w-0">Name:</span>
                        <span className="text-gray-900 font-medium truncate">{product.file_name}</span>
                      </div>
                    )}
                    {product.file_size && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <HardDrive className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">Size:</span>
                        <span className="text-gray-900 font-medium">{formatFileSize(product.file_size)}</span>
                      </div>
                    )}
                    {product.mime_type && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">Format:</span>
                        <span className="text-gray-900 font-medium uppercase">{fileType}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT — Product info */}
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-4">
                {product.name}
              </h1>

              {product.description && (
                <p className="text-gray-600 text-lg leading-relaxed mb-8">
                  {product.description}
                </p>
              )}

              {/* Purchase card */}
              <div className="card-elevated p-6 mb-6">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  <span className="text-gray-400 text-sm">one-time</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Digital download — no subscription required.
                </p>

                <Link
                  href={`/checkout/${product.id}`}
                  className="btn-primary w-full py-3.5 text-base justify-center mb-4"
                >
                  <Download className="w-5 h-5" />
                  Buy &amp; Download — {formatPrice(product.price, product.currency)}
                </Link>

                <div className="flex flex-col gap-2">
                  {[
                    { icon: ShieldCheck, text: "Secure payment via Paystack" },
                    { icon: Zap, text: "Download link sent instantly" },
                    { icon: Mail, text: "Delivered directly to your email" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                      <Icon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>

              {/* How delivery works */}
              <div className="card p-5">
                <p className="text-sm font-semibold text-gray-700 mb-4">
                  How delivery works
                </p>
                <div className="space-y-3">
                  {[
                    "Enter your email address and click Pay",
                    "Complete your payment securely via Paystack",
                    "Receive a private download link in your inbox",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-gray-600">
                      <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
