import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { NetworkOverview } from "@/components/NetworkOverview";

export default function OverviewPage() {
  return (
    <div className="wrap">
      <header className="site-header">
        <Link href="/" className="brand-lockup">
          <BrandLogo variant="brandmark" height={44} priority />
          <div className="brand-copy">
            <h1>Network overview</h1>
            <p>Live visitor counts across all Silverleaf campuses.</p>
          </div>
        </Link>
        <div className="nav-row">
          <Link href="/" className="ghost-btn hub-link">
            All campuses
          </Link>
          <Link href="/check-out" className="ghost-btn">
            Visitor check-out
          </Link>
        </div>
      </header>
      <NetworkOverview />
    </div>
  );
}
