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
import { Download, ShoppingBag, ArrowLeft, Loader2, Shield, Lock } from "lucide-react";

const checkoutSchema = z.object({
  customer_email: z.string().email("Please enter a valid email address."),
  customer_name: z.string().min(1, "Please enter your name.").optional().or(z.literal("")),
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
    productsApi.getById(productId).then(setProduct).catch(() => {
      toast.error("Product not found.");
      router.push("/products");
    }).finally(() => setLoading(false));
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

      // Redirect to Paystack
      window.location.href = result.authorization_url;
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Payment initialization failed. Please try again.";
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
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container-lg flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Download className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-gray-900 text-lg">DigiStore</span>
          </Link>
          <Link href={`/products/${product.slug}`} className="btn-ghost text-sm flex items-center gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="container-sm py-12 px-4">
        <h1 className="font-display font-extrabold text-3xl text-gray-900 mb-8 text-center">
          Checkout
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Order summary */}
          <div className="md:col-span-2">
            <div className="card-elevated p-5 rounded-2xl">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Order Summary</p>
              <div className="flex gap-3 mb-5">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gradient-subtle flex-shrink-0">
                  {product.thumbnail_url ? (
                    <Image src={product.thumbnail_url} alt={product.name} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-brand-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm leading-snug">{product.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Digital download</p>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900 font-medium">{formatPrice(product.price, product.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-brand-700">{formatPrice(product.price, product.currency)}</span>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                <Shield className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                Secure payment powered by Paystack
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-3">
            <div className="card-elevated p-6 rounded-2xl">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="label" htmlFor="customer_name">Your Name <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                  <input
                    id="customer_name"
                    type="text"
                    placeholder="John Doe"
                    className="input"
                    {...register("customer_name")}
                  />
                </div>

                <div>
                  <label className="label" htmlFor="customer_email">Email Address *</label>
                  <input
                    id="customer_email"
                    type="email"
                    placeholder="you@example.com"
                    className={`input ${errors.customer_email ? "border-red-400 focus:ring-red-500/20 focus:border-red-400" : ""}`}
                    {...register("customer_email")}
                  />
                  {errors.customer_email && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.customer_email.message}</p>
                  )}
                  <p className="mt-1.5 text-xs text-gray-500">
                    Your download link will be sent to this email after payment.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={paying}
                  className="btn-primary w-full py-4 text-base justify-center"
                >
                  {paying ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting to Paystack…</>
                  ) : (
                    <><Lock className="w-5 h-5" /> Pay {formatPrice(product.price, product.currency)}</>
                  )}
                </button>
              </form>

              <div className="mt-5 flex flex-col gap-2">
                {["256-bit encrypted connection", "Powered by Paystack", "Instant delivery after payment"].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" /> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
