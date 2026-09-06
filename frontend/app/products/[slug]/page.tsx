import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatFileSize } from "@/types";
import { Download, ArrowLeft, FileText, HardDrive, Shield } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getProduct(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/products/slug/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.description || `Buy ${product.name} — instant download after payment.`,
    openGraph: {
      title: product.name,
      description: product.description || "",
      images: product.thumbnail_url ? [{ url: product.thumbnail_url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container-lg flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Download className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-gray-900 text-lg">DigiStore</span>
          </Link>
          <Link href="/products" className="btn-ghost text-sm flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> All Products
          </Link>
        </div>
      </header>

      <main className="container-md py-12 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Image */}
          <div className="lg:col-span-2">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-subtle shadow-lg">
              {product.thumbnail_url ? (
                <Image src={product.thumbnail_url} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-3xl bg-brand-100 flex items-center justify-center">
                    <FileText className="w-12 h-12 text-brand-600" />
                  </div>
                </div>
              )}
            </div>
            {/* File details */}
            <div className="mt-4 card p-4 space-y-3">
              {product.file_name && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">File:</span>
                  <span className="text-gray-900 font-medium">{product.file_name}</span>
                </div>
              )}
              {product.file_size && (
                <div className="flex items-center gap-2 text-sm">
                  <HardDrive className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Size:</span>
                  <span className="text-gray-900 font-medium">{formatFileSize(product.file_size)}</span>
                </div>
              )}
              {product.mime_type && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Format:</span>
                  <span className="text-gray-900 font-medium uppercase">{product.mime_type.split("/")[1]}</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-3 flex flex-col">
            <h1 className="font-display font-extrabold text-3xl md:text-4xl text-gray-900 mb-4 leading-tight">
              {product.name}
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed mb-8 flex-1">
              {product.description}
            </p>

            {/* Price & CTA */}
            <div className="card-elevated p-6 rounded-2xl">
              <div className="flex items-baseline gap-2 mb-6">
                <span className="font-display font-extrabold text-4xl text-brand-700">
                  {formatPrice(product.price, product.currency)}
                </span>
                <span className="text-gray-400 text-sm">one-time</span>
              </div>
              <Link
                href={`/checkout/${product.id}`}
                className="btn-primary w-full text-base py-4 mb-4 justify-center"
              >
                <Download className="w-5 h-5" /> Buy & Download
              </Link>
              <div className="flex items-center gap-2 justify-center text-sm text-gray-500">
                <Shield className="w-4 h-4 text-emerald-500" />
                Secure payment · Instant delivery · Private download
              </div>
            </div>

            {/* How it works mini */}
            <div className="mt-6 card p-5 space-y-3">
              {[
                "Enter your email and click Pay",
                "Complete payment via Paystack",
                "Receive secure download link by email",
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
