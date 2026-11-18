"use client";

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileTabBar } from './MobileTabBar';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumb?: { label: string; to?: string }[];
}

export function Layout({ children, title, breadcrumb }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 flex flex-col min-h-screen flex-1">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
          breadcrumb={breadcrumb}
        />
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
