import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import BrandMark from '@/components/brand/BrandMark';

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  sideTitle: string;
  sidePoints: string[];
}

export default function AuthShell({ title, subtitle, children, sideTitle, sidePoints }: Props) {
  return (
    <div className="w-full min-h-[calc(100vh-72px)] bg-background-50 px-4 md:px-8 py-10 md:py-14">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">
        <div className="order-2 lg:order-1 rounded-lg border border-background-200 bg-background-50 p-6 md:p-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 cursor-pointer">
            <BrandMark size="sm" />
            <span className="font-heading text-sm font-extrabold tracking-tight text-foreground-950 whitespace-nowrap">
              YAMATO SHOP
            </span>
          </Link>

          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground-950">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-foreground-600">{subtitle}</p>

          <div className="mt-6">{children}</div>
        </div>

        <div className="order-1 lg:order-2 relative overflow-hidden rounded-lg bg-primary-950 p-6 md:p-8 min-h-[220px] lg:min-h-0">
          <img
            src="https://readdy.ai/api/search-image?query=abstract%20deep%20navy%20blue%20vertical%20gradient%20with%20soft%20glowing%20light%20streaks%20and%20floating%20particles%2C%20premium%20minimal%20fintech%20background%2C%20elegant%20dark%20atmosphere&width=900&height=1100&seq=accmarket-auth-01&orientation=portrait"
            alt="YAMATO SHOP - nền tảng tài khoản số"
            title="YAMATO SHOP - Sàn tài khoản số"
            className="absolute inset-0 w-full h-full object-cover object-top opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-950/85 via-primary-950/75 to-primary-900/60"></div>
          <div className="relative h-full flex flex-col justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-background-50/10 border border-background-50/20 text-[10px] font-bold uppercase tracking-[0.14em] text-background-100">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-dot-pulse"></span>
                Yamato Shop
              </span>
              <h2 className="mt-4 font-heading text-xl md:text-2xl font-extrabold leading-snug text-background-50">
                {sideTitle}
              </h2>
            </div>
            <ul className="space-y-3">
              {sidePoints.map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-background-200">
                  <i className="ri-check-line mt-0.5 text-accent-400 text-base leading-none"></i>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}