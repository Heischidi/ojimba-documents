"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, Download } from "lucide-react";

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="container-lg flex items-center h-16 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Download className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-gray-900 text-lg">DigiStore</span>
          </Link>
        </div>
      </header>
      <main className="container-sm px-4 py-24 text-center">
        <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="font-display font-extrabold text-4xl text-gray-900 mb-3">Payment Failed</h1>
        <p className="text-gray-500 text-lg mb-8 max-w-sm mx-auto leading-relaxed">
          Your payment was not completed. No charges were made to your account.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/products" className="btn-primary">
            Try Again
          </Link>
          <Link href="/contact" className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Contact Support
          </Link>
        </div>
      </main>
    </div>
  );
}
