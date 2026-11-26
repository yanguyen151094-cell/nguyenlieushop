import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from '@/components/feature/ChatWidget';

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Header />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}