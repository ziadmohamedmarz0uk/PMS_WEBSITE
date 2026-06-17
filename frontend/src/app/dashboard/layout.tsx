'use client';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Clock, ArrowRightLeft, PackageSearch, LogOut, Globe, Pill, Store, UserCog, Menu, X, Receipt, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const { t, toggleLanguage, language, dir } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined' && !localStorage.getItem('auth_token')) {
            router.push('/login');
        }
    }, []);

    useEffect(() => {
        if (mounted && user && user.role === 'Cashier') {
            router.push('/pos');
        }
    }, [mounted, user, router]);

    if (!mounted || !user) return null;

    if (user.role === 'Cashier') {
        return null;
    }

    const navLinks = [
        { href: '/dashboard', label: t('overview'), icon: LayoutDashboard },
        { href: '/dashboard/invoices', label: t('invoices' as any) || 'Invoices', icon: Receipt },
        { href: '/dashboard/shifts', label: t('shift_logs'), icon: Clock },
        { href: '/dashboard/expenses', label: t('expenses' as any) || 'Expenses', icon: DollarSign },
        { href: '/dashboard/catalog/medicines', label: t('catalog' as any), icon: Pill },
        { href: '/dashboard/inventory', label: t('inventory_alerts'), icon: PackageSearch },
        { href: '/dashboard/transfers', label: t('stock_transfers'), icon: ArrowRightLeft },
        { href: '/dashboard/inventory/adjustments', label: t('stock_adjustments'), icon: PackageSearch },
    ];

    if (user.role === 'SuperAdmin') {
        navLinks.push(
            { href: '/dashboard/procurement', label: t('purchase_orders'), icon: PackageSearch },
            { href: '/dashboard/suppliers', label: t('suppliers'), icon: Users },
            { href: '/dashboard/users', label: t('users' as any), icon: UserCog },
            { href: '/dashboard/branches', label: t('branches' as any), icon: Store }
        );
    }

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans overflow-hidden" dir={dir}>
            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white text-slate-900 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 border-r border-slate-200 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-16 px-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">{t('pms')} <span className="font-normal text-slate-500">{t('admin')}</span></h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={toggleLanguage} className="text-slate-400 hover:text-slate-900 transition-colors" title="Change Language">
                            <Globe size={18} />
                        </button>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-900">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="px-6 py-4 border-b border-slate-100 hidden lg:block shrink-0">
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm border border-slate-200">
                            {user.name.charAt(0)}
                        </div>
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.role}</p>
                        </div>
                    </div>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href || (pathname.startsWith(link.href) && link.href !== '/dashboard');
                        return (
                            <Link 
                                key={link.href} 
                                href={link.href} 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'}`}
                            >
                                <Icon size={18} className={dir === 'rtl' ? 'ml-3' : 'mr-3'} />
                                <span>{link.label}</span>
                            </Link>
                        )
                    })}
                </nav>
                <div className="p-3 border-t border-slate-100 shrink-0">
                    <button onClick={handleLogout} className="flex items-center w-full space-x-3 px-3 py-2.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-sm font-medium">
                        <LogOut size={18} className={dir === 'rtl' ? 'ml-3' : 'mr-3'} />
                        <span>{t('logout')}</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full lg:w-[calc(100%-16rem)]">
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 lg:px-8 shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden"
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg font-bold text-slate-800 capitalize truncate max-w-[150px] lg:max-w-none">
                            {pathname.split('/').pop() === 'dashboard' ? t('overview') : navLinks.find(l => l.href === pathname)?.label || ''}
                        </h2>
                    </div>
                    <div className="flex items-center text-xs lg:text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm truncate max-w-[120px] lg:max-w-none">
                        {user.role === 'SuperAdmin' ? t('global_view') : `${t('branch_access')} ${user.branch_id}`}
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
