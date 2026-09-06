"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, Loader2, XCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type DownloadState = "loading" | "redirecting" | "expired" | "revoked" | "limit" | "error";

export default function DownloadPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<DownloadState>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // Call the backend download endpoint — it returns a 302 redirect to a signed S3 URL
    // or an error JSON
    const attemptDownload = async () => {
      try {
        // Fetch the endpoint but don't follow the redirect automatically on mobile
        // Instead redirect the browser so the file downloads
        const res = await fetch(`${API_BASE}/api/download/${token}`, {
          method: "GET",
          redirect: "manual",
        });

        if (res.type === "opaqueredirect" || res.status === 302 || res.status === 301) {
          // Redirect browser to trigger download
          setState("redirecting");
          window.location.href = `${API_BASE}/api/download/${token}`;
          return;
        }

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const code = data?.error?.code || "";
          if (code === "TOKEN_EXPIRED") setState("expired");
          else if (code === "TOKEN_REVOKED") setState("revoked");
          else if (code === "DOWNLOAD_LIMIT_REACHED") setState("limit");
          else {
            setState("error");
            setErrorMsg(data?.error?.message || "Download failed.");
          }
          return;
        }

        // Fallback: redirect anyway
        setState("redirecting");
        window.location.href = `${API_BASE}/api/download/${token}`;
      } catch {
        // Network error — just redirect and let the backend handle it
        setState("redirecting");
        window.location.href = `${API_BASE}/api/download/${token}`;
      }
    };

    attemptDownload();
  }, [token]);

  const ErrorCard = ({ icon: Icon, color, title, message }: any) => (
    <div className="text-center py-16 animate-fade-in">
      <div className={`w-20 h-20 rounded-full ${color} flex items-center justify-center mx-auto mb-6`}>
        <Icon className="w-10 h-10" />
      </div>
      <h1 className="font-display font-bold text-3xl text-gray-900 mb-3">{title}</h1>
      <p className="text-gray-500 text-lg mb-8 max-w-sm mx-auto">{message}</p>
      <Link href="/contact" className="btn-primary">Contact Support</Link>
    </div>
  );

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
        {(state === "loading" || state === "redirecting") && (
          <div className="text-center py-24 animate-fade-in">
            {state === "loading" ? (
              <Loader2 className="w-12 h-12 animate-spin text-brand-600 mx-auto mb-4" />
            ) : (
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            )}
            <h1 className="font-display font-bold text-2xl text-gray-900 mb-2">
              {state === "loading" ? "Preparing Your Download…" : "Download Starting!"}
            </h1>
            <p className="text-gray-500">
              {state === "loading"
                ? "Validating your access token…"
                : "Your file is downloading. If it doesn't start automatically, click the link below."}
            </p>
            {state === "redirecting" && (
              <a
                href={`${API_BASE}/api/download/${token}`}
                className="btn-primary mt-6 inline-flex"
              >
                <Download className="w-4 h-4" /> Click here to download
              </a>
            )}
          </div>
        )}

        {state === "expired" && (
          <ErrorCard
            icon={AlertTriangle}
            color="bg-amber-50 text-amber-500"
            title="Link Expired"
            message="This download link has expired. Please contact support to request a new link."
          />
        )}

        {state === "revoked" && (
          <ErrorCard
            icon={XCircle}
            color="bg-red-50 text-red-500"
            title="Link Revoked"
            message="This download link has been revoked. Please contact support if you believe this is an error."
          />
        )}

        {state === "limit" && (
          <ErrorCard
            icon={XCircle}
            color="bg-orange-50 text-orange-500"
            title="Download Limit Reached"
            message="You've reached the maximum number of downloads for this link. Contact support for assistance."
          />
        )}

        {state === "error" && (
          <ErrorCard
            icon={XCircle}
            color="bg-red-50 text-red-500"
            title="Download Failed"
            message={errorMsg || "Something went wrong. Please contact support."}
          />
        )}
      </main>
    </div>
  );
}
