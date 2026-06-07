import { Suspense } from 'react';
import UserDetailPage from './page';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mt-20" />}><UserDetailPage /></Suspense>;
}
