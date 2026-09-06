"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { adminProductsApi } from "@/lib/api";
import { formatPrice, formatFileSize, formatDate } from "@/types";
import { ArrowLeft, Loader2, Save, Upload, Image as ImageIcon, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceNaira, setPriceNaira] = useState("");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    adminProductsApi.get(id).then((p) => {
      setProduct(p);
      setName(p.name);
      setDescription(p.description || "");
      setPriceNaira(String(p.price / 100));
      setIsActive(p.is_active);
    }).catch(() => {
      toast.error("Product not found.");
      router.push("/admin/products");
    }).finally(() => setLoading(false));
  }, [id, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminProductsApi.update(id, {
        name,
        description: description || undefined,
        price: Math.round(parseFloat(priceNaira) * 100),
        is_active: isActive,
      });
      toast.success("Product updated.");
    } catch (err: any) {
      toast.error(err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const updated = await adminProductsApi.uploadFile(id, file);
      setProduct(updated);
      toast.success("File replaced.");
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const updated = await adminProductsApi.uploadThumbnail(id, file);
      setProduct(updated);
      toast.success("Thumbnail updated.");
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${product?.name}"? This cannot be undone.`)) return;
    try {
      await adminProductsApi.delete(id);
      toast.success("Product deleted.");
      router.push("/admin/products");
    } catch {
      toast.error("Delete failed.");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/products" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Edit Product</h1>
          <p className="text-gray-500 text-sm">{product?.slug}</p>
        </div>
        <div className="ml-auto flex gap-2">
          {product?.is_active && (
            <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer" className="btn-ghost text-sm flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Preview
            </a>
          )}
          <button onClick={handleDelete} className="btn-ghost text-sm text-red-500 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="card-elevated p-6 rounded-2xl space-y-4">
          <h2 className="font-semibold text-gray-900">Product Details</h2>
          <div>
            <label className="label">Name</label>
            <input type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea rows={4} className="input resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label">Price (₦)</label>
            <input type="number" step="1" className="input" value={priceNaira} onChange={(e) => setPriceNaira(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setIsActive(!isActive)}
                className={`w-11 h-6 rounded-full transition-colors relative ${isActive ? "bg-brand-600" : "bg-gray-300"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm font-medium text-gray-700">{isActive ? "Published" : "Draft"}</span>
            </label>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 justify-center">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>

        {/* File section */}
        <div className="card p-5 rounded-2xl space-y-4">
          <h2 className="font-semibold text-gray-900">Digital File</h2>
          {product?.file_name ? (
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
              <p className="font-medium text-gray-900">{product.file_name}</p>
              <p className="text-gray-500">{formatFileSize(product.file_size)} · {product.mime_type}</p>
            </div>
          ) : (
            <p className="text-sm text-red-500 italic">No file uploaded yet.</p>
          )}
          <label className={`btn-secondary text-sm cursor-pointer ${uploadingFile ? "opacity-60 pointer-events-none" : ""}`}>
            {uploadingFile ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> {product?.file_name ? "Replace File" : "Upload File"}</>}
            <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
          </label>
        </div>

        {/* Thumbnail section */}
        <div className="card p-5 rounded-2xl space-y-4">
          <h2 className="font-semibold text-gray-900">Thumbnail</h2>
          {product?.thumbnail_url ? (
            <img src={product.thumbnail_url} alt="Thumbnail" className="w-24 h-24 rounded-xl object-cover" />
          ) : (
            <p className="text-sm text-gray-400 italic">No thumbnail.</p>
          )}
          <label className={`btn-secondary text-sm cursor-pointer ${uploadingThumb ? "opacity-60 pointer-events-none" : ""}`}>
            {uploadingThumb ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</> : <><ImageIcon className="w-4 h-4" /> {product?.thumbnail_url ? "Replace" : "Upload"} Thumbnail</>}
            <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploadingThumb} />
          </label>
        </div>
      </div>
    </div>
  );
}
