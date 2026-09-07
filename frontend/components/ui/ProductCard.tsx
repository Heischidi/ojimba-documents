import Link from "next/link";
import Image from "next/image";
import { Package, ArrowRight } from "lucide-react";
import { Product, formatPrice } from "@/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const fileType = product.mime_type?.split("/")[1]?.toUpperCase() || "FILE";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-md transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-gray-50 overflow-hidden flex-shrink-0">
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Package className="w-10 h-10 text-gray-300" />
          </div>
        )}
        {/* File type badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-900/80 text-white backdrop-blur-sm">
            {fileType}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1.5 line-clamp-2 group-hover:text-brand-600 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-1">
            {product.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <span className="font-bold text-gray-900 text-lg">
            {formatPrice(product.price, product.currency)}
          </span>
          <span className="text-xs font-semibold text-brand-600 flex items-center gap-1 group-hover:gap-1.5 transition-all">
            Buy now <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
