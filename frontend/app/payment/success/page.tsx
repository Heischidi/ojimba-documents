"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { paymentsApi } from "@/lib/api";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  Mail,
  Loader2,
  Package,
} from "lucide-react";
import Nav from "@/components/ui/Nav";

function SuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "failed">("loading");
  const [orderRef, setOrderRef] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }

    const checkStatus = async () => {
      try {
        const data = await paymentsApi.verify(reference);
        setOrderRef(data.order_reference);
        if (data.status === "paid") {
          setStatus("paid");
        } else if (data.status === "pending") {
          setStatus("pending");
          setTimeout(checkStatus, 3000);
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    };

    checkStatus();
  }, [reference]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-5">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment…</h1>
        <p className="text-gray-500 text-sm">
          Please wait while we confirm your payment with our servers.
        </p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-5">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Processing</h1>
        <p className="text-gray-500 text-sm max-w-sm mb-6">
          Your payment is being processed. This page will update automatically.
        </p>
        <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Not Confirmed</h1>
        <p className="text-gray-500 text-sm max-w-sm mb-8">
          We could not confirm your payment. If you were charged, please contact support.
        </p>
        <Link href="/products" className="btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-16 text-center animate-fade-in">
      {/* Success icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>

      <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
        Payment Successful
      </h1>
      <p className="text-gray-500 text-lg mb-2">
        Your purchase is confirmed.
      </p>
      {orderRef && (
        <p className="text-sm text-gray-400 mb-8">
          Order reference:{" "}
          <span className="font-mono font-semibold text-gray-700">{orderRef}</span>
        </p>
      )}

      {/* Email notice */}
      <div className="w-full max-w-md card p-5 mb-8 text-left">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm mb-1">
              Check your inbox
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              We've sent a secure download link to your email. If you don't see
              it, check your spam or promotions folder.
            </p>
          </div>
        </div>
      </div>

      <Link
        href="/products"
        className="btn-secondary inline-flex items-center gap-2"
      >
        Browse More Products <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gray-50">
        <div className="container-sm px-4 py-8">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
              </div>
            }
          >
            <SuccessContent />
          </Suspense>
        </div>
      </main>
    </>
  );
}
