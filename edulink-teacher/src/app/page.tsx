'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('teacher_token');
    if (token) {
      router.replace('/dashboard');
    } else {
      setChecking(false);
    }
  }, []);

  if (checking) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}><div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e5e7eb', borderTopColor: '#10A7DA', animation: 'spin 1s linear infinite' }} /></div>;
  }

  router.replace('/login');
  return null;
}
