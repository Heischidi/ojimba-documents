const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorData: any;
    try {
      errorData = await res.json();
    } catch {
      throw new ApiError("NETWORK_ERROR", `HTTP ${res.status}`, res.status);
    }
    const err = errorData?.error || errorData?.detail;
    throw new ApiError(
      err?.code || "API_ERROR",
      err?.message || "Something went wrong.",
      res.status
    );
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

const defaultHeaders = {
  "Content-Type": "application/json",
};

// ── Public Product API ────────────────────────────────────────────────────────
export const productsApi = {
  list: (): Promise<any[]> =>
    fetch(`${API_BASE}/api/products`, { credentials: "include" }).then((r) =>
      handleResponse(r)
    ),

  getBySlug: (slug: string): Promise<any> =>
    fetch(`${API_BASE}/api/products/slug/${slug}`, { credentials: "include" }).then(
      (r) => handleResponse(r)
    ),

  getById: (id: string): Promise<any> =>
    fetch(`${API_BASE}/api/products/${id}`, { credentials: "include" }).then((r) =>
      handleResponse(r)
    ),
};

// ── Payment API ───────────────────────────────────────────────────────────────
export const paymentsApi = {
  initialize: (data: {
    product_id: string;
    customer_email: string;
    customer_name?: string;
  }): Promise<{ authorization_url: string; order_reference: string; order_id: string }> =>
    fetch(`${API_BASE}/api/payments/initialize`, {
      method: "POST",
      headers: defaultHeaders,
      credentials: "include",
      body: JSON.stringify(data),
    }).then((r) => handleResponse(r)),

  verify: (reference: string): Promise<{ status: string; order_reference: string; amount: number; currency: string }> =>
    fetch(`${API_BASE}/api/payments/verify/${reference}`, {
      credentials: "include",
    }).then((r) => handleResponse(r)),
};

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string): Promise<{ success: boolean; admin: any }> =>
    fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: defaultHeaders,
      credentials: "include",
      body: JSON.stringify({ email, password }),
    }).then((r) => handleResponse(r)),

  logout: (): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).then((r) => handleResponse(r)),

  me: (): Promise<any> =>
    fetch(`${API_BASE}/api/auth/me`, { credentials: "include" }).then((r) =>
      handleResponse(r)
    ),
};

// ── Admin Products API ────────────────────────────────────────────────────────
export const adminProductsApi = {
  list: (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<any> => {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.set("skip", String(params.skip));
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    if (params?.is_active !== undefined) qs.set("is_active", String(params.is_active));
    return fetch(`${API_BASE}/api/admin/products?${qs}`, {
      credentials: "include",
    }).then((r) => handleResponse(r));
  },

  get: (id: string): Promise<any> =>
    fetch(`${API_BASE}/api/admin/products/${id}`, { credentials: "include" }).then(
      (r) => handleResponse(r)
    ),

  create: (data: { name: string; description?: string; price: number; currency?: string; paystack_subaccount?: string }): Promise<any> =>
    fetch(`${API_BASE}/api/admin/products`, {
      method: "POST",
      headers: defaultHeaders,
      credentials: "include",
      body: JSON.stringify(data),
    }).then((r) => handleResponse(r)),

  update: (id: string, data: any): Promise<any> =>
    fetch(`${API_BASE}/api/admin/products/${id}`, {
      method: "PATCH",
      headers: defaultHeaders,
      credentials: "include",
      body: JSON.stringify(data),
    }).then((r) => handleResponse(r)),

  delete: (id: string): Promise<void> =>
    fetch(`${API_BASE}/api/admin/products/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).then((r) => handleResponse(r)),

  uploadFile: (id: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_BASE}/api/admin/products/${id}/upload-file`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((r) => handleResponse(r));
  },

  uploadThumbnail: (id: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_BASE}/api/admin/products/${id}/upload-thumbnail`, {
      method: "POST",
      credentials: "include",
      body: formData,
    }).then((r) => handleResponse(r));
  },
};

// ── Admin Orders API ──────────────────────────────────────────────────────────
export const adminOrdersApi = {
  list: (params?: { skip?: number; limit?: number; search?: string; status?: string }): Promise<any> => {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.set("skip", String(params.skip));
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    return fetch(`${API_BASE}/api/admin/orders?${qs}`, { credentials: "include" }).then(
      (r) => handleResponse(r)
    );
  },

  get: (id: string): Promise<any> =>
    fetch(`${API_BASE}/api/admin/orders/${id}`, { credentials: "include" }).then(
      (r) => handleResponse(r)
    ),

  resendEmail: (id: string): Promise<{ success: boolean; email_sent: boolean }> =>
    fetch(`${API_BASE}/api/admin/orders/${id}/resend-email`, {
      method: "POST",
      credentials: "include",
    }).then((r) => handleResponse(r)),

  revokeAccess: (id: string): Promise<{ success: boolean }> =>
    fetch(`${API_BASE}/api/admin/orders/${id}/revoke-access`, {
      method: "POST",
      credentials: "include",
    }).then((r) => handleResponse(r)),
};

// ── Admin Dashboard API ───────────────────────────────────────────────────────
export const adminDashboardApi = {
  stats: (): Promise<any> =>
    fetch(`${API_BASE}/api/admin/dashboard/stats`, { credentials: "include" }).then(
      (r) => handleResponse(r)
    ),
};

// ── Admin Customers API ───────────────────────────────────────────────────────
export const adminCustomersApi = {
  list: (params?: { skip?: number; limit?: number; search?: string }): Promise<any> => {
    const qs = new URLSearchParams();
    if (params?.skip !== undefined) qs.set("skip", String(params.skip));
    if (params?.limit !== undefined) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    return fetch(`${API_BASE}/api/admin/customers?${qs}`, { credentials: "include" }).then(
      (r) => handleResponse(r)
    );
  },
};
