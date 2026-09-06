"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { paymentsApi, ApiError } from "@/lib/api";
import { CheckCircle2, Clock, ArrowRight, Mail, Loader2, Download } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "failed">("loading");
  const [orderRef, setOrderRef] = useState<string>("");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }

    // Poll the backend to confirm payment status
    // NEVER trust the URL alone — must verify server-side
    const checkStatus = async () => {
      try {
        const data = await paymentsApi.verify(reference);
        setOrderRef(data.order_reference);

        if (data.status === "paid") {
          setStatus("paid");
        } else if (data.status === "pending") {
          setStatus("pending");
          // Poll again after 3s
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
      <div className="text-center py-24">
        <Loader2 className="w-12 h-12 animate-spin text-brand-600 mx-auto mb-4" />
        <h1 className="font-display font-bold text-2xl text-gray-900 mb-2">Verifying Payment…</h1>
        <p className="text-gray-500">Please wait while we confirm your payment with our servers.</p>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="text-center py-24">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-3">Payment Processing</h1>
        <p className="text-gray-500 mb-6">
          Your payment is being processed. We're waiting for confirmation from Paystack.
          <br />This page will update automatically.
        </p>
        <Loader2 className="w-6 h-6 animate-spin text-brand-600 mx-auto" />
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="text-center py-24">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✗</span>
        </div>
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-3">Payment Not Confirmed</h1>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
          We could not confirm your payment at this time. If you were charged, please contact support.
        </p>
        <Link href="/products" className="btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      </div>
      <h1 className="font-display font-extrabold text-4xl text-gray-900 mb-3">Payment Successful! 🎉</h1>
      <p className="text-gray-600 text-lg mb-2">
        Your purchase was confirmed. Your download link has been sent to your email.
      </p>
      {orderRef && (
        <p className="text-sm text-gray-400 mb-8">Order reference: <span className="font-mono font-semibold text-gray-700">{orderRef}</span></p>
      )}

      <div className="card max-w-md mx-auto p-6 mb-8">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">Check your inbox</p>
            <p className="text-gray-500 text-xs mt-0.5">
              We've sent a secure download link to your email. Check your spam folder if you don't see it.
            </p>
          </div>
        </div>
      </div>

      <Link href="/products" className="btn-secondary inline-flex items-center gap-2">
        Browse More Products <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function PaymentSuccessPage() {
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
      <main className="container-sm px-4">
        <Suspense fallback={<div className="text-center py-24"><Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" /></div>}>
          <SuccessContent />
        </Suspense>
      </main>
    </div>
  );
}
