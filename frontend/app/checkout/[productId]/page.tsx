"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { productsApi, paymentsApi, ApiError } from "@/lib/api";
import { Product, formatPrice } from "@/types";
import {
  Package,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Lock,
  Mail,
  Zap,
} from "lucide-react";
import Nav from "@/components/ui/Nav";

const checkoutSchema = z.object({
  customer_email: z.string().email("Please enter a valid email address."),
  customer_name: z
    .string()
    .min(1, "Please enter your name.")
    .optional()
    .or(z.literal("")),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutForm>({ resolver: zodResolver(checkoutSchema) });

  useEffect(() => {
    productsApi
      .getById(productId)
      .then(setProduct)
      .catch(() => {
        toast.error("Product not found.");
        router.push("/products");
      })
      .finally(() => setLoading(false));
  }, [productId, router]);

  const onSubmit = async (data: CheckoutForm) => {
    if (!product) return;
    setPaying(true);
    try {
      const result = await paymentsApi.initialize({
        product_id: product.id,
        customer_email: data.customer_email,
        customer_name: data.customer_name || undefined,
      });
      window.location.href = result.authorization_url;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Payment initialization failed. Please try again.";
      toast.error(message);
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <>
      <Nav />
      <main className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="container-lg py-3.5">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link
                href={`/products/${product.slug}`}
                className="hover:text-gray-700 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {product.name}
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Checkout</span>
            </nav>
          </div>
        </div>

        <div className="container-md py-10 md:py-16 px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">

            {/* LEFT — Form */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">
                Complete your purchase
              </h1>
              <p className="text-gray-500 text-sm mb-8">
                You'll receive your download link by email after payment is confirmed.
              </p>

              <div className="card-elevated p-6 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="label" htmlFor="customer_name">
                      Your Name{" "}
                      <span className="text-gray-400 font-normal text-xs">(optional)</span>
                    </label>
                    <input
                      id="customer_name"
                      type="text"
                      placeholder="John Doe"
                      className="input"
                      {...register("customer_name")}
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="customer_email">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="customer_email"
                      type="email"
                      placeholder="you@example.com"
                      className={`input ${errors.customer_email ? "input-error" : ""}`}
                      {...register("customer_email")}
                    />
                    {errors.customer_email && (
                      <p className="field-error">
                        {errors.customer_email.message}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">
                      Your download link will be sent to this address.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={paying}
                    className="btn-primary w-full py-3.5 text-base justify-center"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />{" "}
                        Redirecting to Paystack…
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5" /> Pay{" "}
                        {formatPrice(product.price, product.currency)}
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-2.5">
                  {[
                    { icon: ShieldCheck, text: "256-bit encrypted connection" },
                    { icon: Package, text: "Powered by Paystack" },
                    { icon: Zap, text: "Instant delivery after payment" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                      <Icon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — Order Summary */}
            <div className="lg:sticky lg:top-24">
              <div className="card p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  Order Summary
                </p>

                <div className="flex gap-3 mb-5">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {product.thumbnail_url ? (
                      <Image
                        src={product.thumbnail_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm leading-snug">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Digital download</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(product.price, product.currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(product.price, product.currency)}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  Secure payment powered by Paystack
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
