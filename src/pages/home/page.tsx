import PlatformBanner from './components/PlatformBanner';
import LiveAccountsStrip from './components/LiveAccountsStrip';
import CategorySection from './components/CategorySection';
import FeaturedProducts from './components/FeaturedProducts';
import LiveSection from './components/LiveSection';
import TrustSection from './components/TrustSection';
import CtaBand from './components/CtaBand';

export default function HomePage() {
  return (
    <div className="w-full">
      <PlatformBanner />
      <LiveAccountsStrip />
      <CategorySection />
      <FeaturedProducts />
      <LiveSection />
      <TrustSection />
      <CtaBand />
    </div>
  );
}