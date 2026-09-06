// ── API Types ─────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number; // in kobo
  currency: string;
  thumbnail_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProductAdmin extends Product {
  file_key: string | null;
  updated_at: string;
}

export interface Order {
  id: string;
  reference: string;
  product_id: string;
  customer_email: string;
  customer_name: string | null;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded" | "cancelled";
  payment_provider: string;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface DownloadToken {
  id: string;
  expires_at: string;
  max_downloads: number;
  download_count: number;
  last_downloaded_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface EmailLog {
  id: string;
  email_type: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
}

export interface OrderDetail extends Order {
  download_tokens: DownloadToken[];
  email_logs: EmailLog[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface DashboardStats {
  total_products: number;
  total_revenue_kobo: number;
  total_revenue_naira: number;
  paid_orders: number;
  pending_orders: number;
  failed_orders: number;
  recent_orders: Array<{
    id: string;
    reference: string;
    customer_email: string;
    product_name: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  }>;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
}

// ── API Error ─────────────────────────────────────────────────────────────────
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// ── Utility ───────────────────────────────────────────────────────────────────
export function formatPrice(kobo: number, currency = "NGN"): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(naira);
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "N/A";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
