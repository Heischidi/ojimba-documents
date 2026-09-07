"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { adminProductsApi } from "@/lib/api";
import { ArrowLeft, Upload, Loader2, FileText, Image as ImageIcon, CheckCircle2 } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().optional(),
  price_naira: z.number({ invalid_type_error: "Price is required." }).positive("Price must be greater than 0."),
  currency: z.string().default("NGN"),
});

type ProductForm = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const [productId, setProductId] = useState<string | null>(null);
  const [step, setStep] = useState<"details" | "files" | "done">("details");
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [thumbUploaded, setThumbUploaded] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: { currency: "NGN" },
  });

  const onSubmitDetails = async (data: ProductForm) => {
    setSaving(true);
    try {
      const product = await adminProductsApi.create({
        name: data.name,
        description: data.description || undefined,
        price: Math.round(data.price_naira * 100), // convert to kobo
        currency: data.currency,
      });
      setProductId(product.id);
      setStep("files");
      toast.success("Product created! Now upload the digital file.");
    } catch (err: any) {
      toast.error(err.message || "Failed to create product.");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !productId) return;
    setUploadingFile(true);
    try {
      await adminProductsApi.uploadFile(productId, file);
      setFileUploaded(true);
      toast.success("Digital file uploaded successfully.");
    } catch (err: any) {
      toast.error(err.message || "File upload failed.");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !productId) return;
    setUploadingThumb(true);
    try {
      await adminProductsApi.uploadThumbnail(productId, file);
      setThumbUploaded(true);
      toast.success("Thumbnail uploaded.");
    } catch (err: any) {
      toast.error(err.message || "Thumbnail upload failed.");
    } finally {
      setUploadingThumb(false);
    }
  };

  const handlePublish = async () => {
    if (!productId) return;
    if (!fileUploaded) {
      toast.error("Please upload a digital file before publishing.");
      return;
    }
    try {
      await adminProductsApi.update(productId, { is_active: true });
      toast.success("Product published!");
      router.push("/admin/products");
    } catch {
      toast.error("Failed to publish.");
    }
  };

  const handleSaveDraft = () => {
    router.push("/admin/products");
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/products" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add Product</h1>
          <p className="text-gray-500 text-sm">Create a new digital product for your store</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {["details", "files", "done"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === s ? "bg-brand-600 text-white" :
              (["details", "files", "done"].indexOf(step) > i) ? "bg-emerald-500 text-white" :
              "bg-gray-200 text-gray-500"
            }`}>
              {(["details", "files", "done"].indexOf(step) > i) ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm font-medium hidden sm:block ${step === s ? "text-gray-900" : "text-gray-400"}`}>
              {s === "details" ? "Details" : s === "files" ? "Upload Files" : "Publish"}
            </span>
            {i < 2 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {step === "details" && (
        <div className="card-elevated p-6">
          <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-5">
            <div>
              <label className="label">Product Name *</label>
              <input type="text" placeholder="AI Engineering Course Notes" className={`input ${errors.name ? "input-error" : ""}`} {...register("name")} />
              {errors.name && <p className="field-error">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Description</label>
              <textarea rows={4} placeholder="What's included in this product…" className="input resize-none" {...register("description")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Price (₦) *</label>
                <input
                  type="number"
                  step="1"
                  placeholder="15000"
                  className={`input ${errors.price_naira ? "input-error" : ""}`}
                  {...register("price_naira", { valueAsNumber: true })}
                />
                {errors.price_naira && <p className="field-error">{errors.price_naira.message}</p>}
                <p className="mt-1 text-xs text-gray-400">Enter amount in Naira (e.g. 15000 for ₦15,000)</p>
              </div>
              <div>
                <label className="label">Currency</label>
                <select className="input" {...register("currency")}>
                  <option value="NGN">NGN — Nigerian Naira</option>
                  <option value="USD">USD — US Dollar</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full py-3 justify-center">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : "Continue to Files →"}
            </button>
          </form>
        </div>
      )}

      {step === "files" && (
        <div className="space-y-4">
          {/* Digital file upload */}
          <div className={`card p-6 border-2 ${fileUploaded ? "border-emerald-300 bg-emerald-50" : "border-dashed border-gray-300"}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${fileUploaded ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                {fileUploaded ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{fileUploaded ? "✓ Digital file uploaded" : "Upload Digital File *"}</p>
                <p className="text-sm text-gray-500 mb-3">PDF, DOCX, ZIP, MP4, XLSX, etc.</p>
                <label className={`btn-secondary text-sm cursor-pointer inline-flex items-center gap-2 ${uploadingFile ? "opacity-60 pointer-events-none" : ""}`}>
                  {uploadingFile ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</> : fileUploaded ? "Replace File" : "Choose File"}
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.ppt,.pptx,.mp4,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
                </label>
              </div>
            </div>
          </div>

          {/* Thumbnail upload */}
          <div className={`card p-6 border-2 ${thumbUploaded ? "border-emerald-300 bg-emerald-50" : "border-dashed border-gray-200"}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${thumbUploaded ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                {thumbUploaded ? <CheckCircle2 className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{thumbUploaded ? "✓ Thumbnail uploaded" : "Upload Thumbnail (optional)"}</p>
                <p className="text-sm text-gray-500 mb-3">JPG or PNG, recommended 600×600px</p>
                <label className={`btn-secondary text-sm cursor-pointer inline-flex items-center gap-2 ${uploadingThumb ? "opacity-60 pointer-events-none" : ""}`}>
                  {uploadingThumb ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</> : thumbUploaded ? "Replace Thumbnail" : "Choose Image"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} disabled={uploadingThumb} />
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handlePublish} className="btn-primary flex-1 py-3 justify-center">
              Publish Product
            </button>
            <button onClick={handleSaveDraft} className="btn-secondary px-6 py-3">
              Save as Draft
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
