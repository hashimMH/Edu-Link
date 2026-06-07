import { Suspense } from 'react';
import LiveClassPage from './page';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-[#0F172A] flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#10A7DA]" /></div>}><LiveClassPage /></Suspense>;
}
