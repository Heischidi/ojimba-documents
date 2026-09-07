"use client";

import Link from "next/link";
import { XCircle, ArrowLeft, RotateCcw } from "lucide-react";
import Nav from "@/components/ui/Nav";

export default function PaymentFailedPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gray-50">
        <div className="container-sm px-4 py-16 md:py-24">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
              Payment wasn't completed
            </h1>
            <p className="text-gray-500 text-lg max-w-md mb-10 leading-relaxed">
              Your payment was not completed. No charges were made to your
              account. You can try again whenever you're ready.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/products"
                className="btn-primary inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </Link>
              <Link
                href="/products"
                className="btn-secondary inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Products
              </Link>
            </div>

            <p className="mt-8 text-sm text-gray-400">
              Need help?{" "}
              <Link
                href="/contact"
                className="text-brand-600 hover:underline font-medium"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
