import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CAMPUS_HUB } from "@/lib/campus-routes";

export default function HomePage() {
  return (
    <div className="hub-shell">
      <div className="hub-hero">
        <BrandLogo variant="brandmark" height={52} priority />
        <h1>Silverleaf Visitor Log</h1>
        <p>Choose your campus dashboard — no login required.</p>
      </div>
      <div className="campus-hub-grid">
        {CAMPUS_HUB.map((campus) => (
          <Link
            key={campus.slug}
            href={campus.href}
            className="campus-hub-card card"
            style={{ background: campus.gradient }}
          >
            <span className="campus-hub-name">{campus.name}</span>
            <span className="campus-hub-cta">Open front desk →</span>
          </Link>
        ))}
      </div>
      <div className="hub-quick-links">
        <Link href="/overview" className="hub-quick-link card">
          Network overview
        </Link>
        <Link href="/check-in" className="hub-quick-link card">
          Visitor check-in
        </Link>
        <Link href="/check-out" className="hub-quick-link card">
          Visitor check-out
        </Link>
        <Link href="/qr" className="hub-quick-link card">
          QR poster
        </Link>
      </div>
      <p className="footnote hub-footnote">
        Leadership can monitor all campuses from the network overview. Visitors can self check-in
        via QR or the check-in form, and sign out when leaving.
      </p>
    </div>
  );
}
