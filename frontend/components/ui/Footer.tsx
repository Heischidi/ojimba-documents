import Link from "next/link";
import { Package } from "lucide-react";

const footerLinks = {
  Store: [
    { href: "/products", label: "All Products" },
    { href: "/#how-it-works", label: "How It Works" },
  ],
  Support: [
    { href: "/contact", label: "Contact Us" },
    { href: "/download", label: "My Download" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="container-lg py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">DigiStore</span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-500 max-w-xs">
              Premium digital products delivered securely to your inbox the
              moment payment clears.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-white font-semibold text-sm mb-4">{heading}</p>
              <ul className="space-y-3">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} DigiStore. All rights reserved.</p>
          <p>Payments powered by Paystack</p>
        </div>
      </div>
    </footer>
  );
}
