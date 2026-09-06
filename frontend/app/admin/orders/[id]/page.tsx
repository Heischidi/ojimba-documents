"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminOrdersApi } from "@/lib/api";
import { formatDate, formatPrice } from "@/types";
import { ArrowLeft, Mail, ShieldX, Loader2, CheckCircle2, XCircle, Clock, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    paid: "badge-success", pending: "badge-warning",
    failed: "badge-error", refunded: "badge-info", cancelled: "badge-gray",
  };
  return <span className={`badge text-sm ${classes[status] || "badge-gray"}`}>{status}</span>;
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    adminOrdersApi.get(id).then(setOrder).finally(() => setLoading(false));
  }, [id]);

  const handleResend = async () => {
    setResending(true);
    try {
      const result = await adminOrdersApi.resendEmail(id);
      if (result.email_sent) {
        toast.success("Download email resent successfully.");
      } else {
        toast.warning("Order updated but email delivery failed. Check email logs.");
      }
      const updated = await adminOrdersApi.get(id);
      setOrder(updated);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend.");
    } finally {
      setResending(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Revoke all download access for this order?")) return;
    setRevoking(true);
    try {
      await adminOrdersApi.revokeAccess(id);
      toast.success("Download access revoked.");
      const updated = await adminOrdersApi.get(id);
      setOrder(updated);
    } catch {
      toast.error("Failed to revoke access.");
    } finally {
      setRevoking(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;
  if (!order) return <div>Order not found.</div>;

  const activeToken = order.download_tokens?.find((t: any) => !t.revoked_at);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/orders" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Order Detail</h1>
          <p className="font-mono text-gray-500 text-sm">{order.reference}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Customer */}
        <div className="card p-5 col-span-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer</p>
          <p className="font-semibold text-gray-900">{order.customer_name || "—"}</p>
          <p className="text-gray-500 text-sm">{order.customer_email}</p>
        </div>

        {/* Amount */}
        <div className="card p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Amount</p>
          <p className="font-display font-bold text-2xl text-brand-700">
            ₦{(order.amount / 100).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">via {order.payment_provider}</p>
        </div>
      </div>

      {/* Product */}
      <div className="card p-5 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Product</p>
        <p className="font-semibold text-gray-900">{order.product?.name || "Unknown"}</p>
        {order.product?.slug && (
          <Link href={`/products/${order.product.slug}`} target="_blank" className="text-xs text-brand-600 hover:underline">
            View product →
          </Link>
        )}
      </div>

      {/* Payment */}
      <div className="card p-5 mb-5 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Reference</span>
          <span className="font-mono text-gray-700">{order.payment_reference || "—"}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Created</span>
          <span className="text-gray-700">{formatDate(order.created_at)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Last Updated</span>
          <span className="text-gray-700">{formatDate(order.updated_at)}</span>
        </div>
      </div>

      {/* Download tokens */}
      {order.download_tokens?.length > 0 && (
        <div className="card p-5 mb-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Download Tokens</p>
          <div className="space-y-2">
            {order.download_tokens.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  {t.revoked_at ? (
                    <XCircle className="w-4 h-4 text-red-400" />
                  ) : new Date(t.expires_at) < new Date() ? (
                    <Clock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="text-gray-600">{t.download_count}/{t.max_downloads} downloads</span>
                </div>
                <div className="text-gray-400 text-xs">
                  {t.revoked_at ? "Revoked" : `Expires ${formatDate(t.expires_at)}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Email logs */}
      {order.email_logs?.length > 0 && (
        <div className="card p-5 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Email History</p>
          <div className="space-y-2">
            {order.email_logs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 text-sm">
                {log.status === "sent" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                )}
                <div>
                  <span className="text-gray-700 font-medium">{log.email_type.replace("_", " ")}</span>
                  <span className="text-gray-400 text-xs ml-2">{log.sent_at ? formatDate(log.sent_at) : "failed"}</span>
                  {log.error_message && <p className="text-red-500 text-xs mt-0.5">{log.error_message}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin actions */}
      {order.status === "paid" && (
        <div className="card p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Admin Actions</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleResend}
              disabled={resending}
              className="btn-primary text-sm"
            >
              {resending ? <><Loader2 className="w-4 h-4 animate-spin" /> Resending…</> : <><Mail className="w-4 h-4" /> Resend Download Email</>}
            </button>
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="btn-secondary text-sm text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              {revoking ? <><Loader2 className="w-4 h-4 animate-spin" /> Revoking…</> : <><ShieldX className="w-4 h-4" /> Revoke Access</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
