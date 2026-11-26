import { lazy, Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import SiteLayout from '@/components/layout/SiteLayout';
import HomePage from '@/pages/home/page';

const ProductsPage = lazy(() => import('@/pages/products/page'));
const ProductDetailPage = lazy(() => import('@/pages/product-detail/page'));
const DepositPage = lazy(() => import('@/pages/deposit/page'));
const AccountPage = lazy(() => import('@/pages/account/page'));
const VendorDashboardPage = lazy(() => import('@/pages/vendor/page'));
const AdminPage = lazy(() => import('@/pages/admin/page'));
const LoginPage = lazy(() => import('@/pages/auth/login/page'));
const RegisterPage = lazy(() => import('@/pages/auth/register/page'));
const AuthCallbackPage = lazy(() => import('@/pages/auth/callback/page'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password/page'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const PageFallback = () => (
  <div className="w-full px-4 md:px-8 py-10">
    <div className="h-14 w-48 rounded-md bg-background-100 animate-pulse"></div>
    <div className="mt-4 h-72 rounded-lg bg-background-100 animate-pulse"></div>
  </div>
);

const routes: RouteObject[] = [
  {
    path: '/',
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'san-pham',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProductsPage />
          </Suspense>
        ),
      },
      {
        path: 'san-pham/:id',
        element: (
          <Suspense fallback={<PageFallback />}>
            <ProductDetailPage />
          </Suspense>
        ),
      },
      {
        path: 'nap-tien',
        element: (
          <Suspense fallback={<PageFallback />}>
            <DepositPage />
          </Suspense>
        ),
      },
      {
        path: 'tai-khoan',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AccountPage />
          </Suspense>
        ),
      },
      {
        path: 'kenh-doi-tac',
        element: (
          <Suspense fallback={<PageFallback />}>
            <VendorDashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'quan-tri',
        element: (
          <Suspense fallback={<PageFallback />}>
            <AdminPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: '/dang-nhap',
    element: (
      <Suspense fallback={<PageFallback />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: '/dang-ky',
    element: (
      <Suspense fallback={<PageFallback />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: '/auth/callback',
    element: (
      <Suspense fallback={<PageFallback />}>
        <AuthCallbackPage />
      </Suspense>
    ),
  },
  {
    path: '/auth/reset-password',
    element: (
      <Suspense fallback={<PageFallback />}>
        <ResetPasswordPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<PageFallback />}>
        <NotFound />
      </Suspense>
    ),
  },
];

export default routes;