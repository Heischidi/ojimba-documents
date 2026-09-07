type BadgeVariant = "paid" | "pending" | "failed" | "refunded" | "cancelled" | "published" | "draft";

const variantMap: Record<BadgeVariant, string> = {
  paid: "badge-success",
  published: "badge-success",
  pending: "badge-warning",
  failed: "badge-error",
  refunded: "badge-info",
  cancelled: "badge-gray",
  draft: "badge-gray",
};

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const cls = variantMap[status as BadgeVariant] ?? "badge-gray";
  return (
    <span className={cls}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
