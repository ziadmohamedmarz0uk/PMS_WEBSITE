'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { 
    TrendingUp, 
    CreditCard, 
    AlertTriangle,
    DollarSign,
    Users
} from 'lucide-react';
import { ResponsiveContainer, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import axios from '@/lib/api/axios';
import Link from 'next/link';

export default function DashboardOverviewPage() {
    const { t, dir } = useTranslation();
    const { user } = useAuthStore();
    const router = useRouter();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // State for filters
    const [selectedBranch, setSelectedBranch] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<string>('');

    useEffect(() => {
        if (user && user.role === 'Cashier') {
            router.push('/pos');
        } else {
            fetchMetrics('', '');
        }
    }, [user, router]);

    const fetchMetrics = async (branchId = '', userId = '', showSpinner = true) => {
        if (showSpinner) {
            setLoading(true);
        } else {
            setRefreshing(true);
        }
        try {
            const params: any = {};
            if (branchId) params.branch_id = branchId;
            if (userId) params.user_id = userId;
            
            const res = await axios.get('/pos/dashboard/metrics', { params });
            if (res.data.success) {
                setMetrics(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch metrics', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleBranchChange = (branchId: string) => {
        setSelectedBranch(branchId);
        setSelectedUser(''); // Reset employee filter on branch change
        fetchMetrics(branchId, '', false);
    };

    const handleUserChange = (userId: string) => {
        setSelectedUser(userId);
        fetchMetrics(selectedBranch, userId, false);
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!metrics) return null;

    const cards = [
        {
            title: t('revenue_today' as any) || 'Revenue Today',
            value: `${Number(metrics.total_revenue_today).toFixed(2)}`,
            icon: DollarSign,
            textColor: 'text-emerald-500'
        },
        {
            title: t('profit_today' as any) || 'Profit Today',
            value: `${Number(metrics.total_profit_today).toFixed(2)}`,
            icon: TrendingUp,
            textColor: 'text-blue-500'
        },
        {
            title: t('sales_count' as any) || 'Sales Count',
            value: metrics.total_sales_today,
            icon: CreditCard,
            textColor: 'text-purple-500'
        },
        {
            title: t('critical_shortages' as any) || 'Critical Shortages',
            value: metrics.shortages_count,
            icon: AlertTriangle,
            textColor: 'text-red-500'
        }
    ];

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto" dir={dir}>
            {/* Header and Filter Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">{t('overview')}</h1>
                    <p className="text-slate-500 mt-1 text-sm">{t('welcome_back' as any)?.replace('{name}', user?.name || '')}</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                    {/* Branch Filter (SuperAdmin Only) */}
                    {user?.role === 'SuperAdmin' && metrics.branches && (
                        <div className="flex flex-col min-w-[160px]">
                            <span className="text-xs font-semibold text-slate-500 mb-1">{t('branch_filter' as any) || 'Branch'}</span>
                            <select
                                value={selectedBranch}
                                onChange={(e) => handleBranchChange(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm"
                            >
                                <option value="">{t('all_branches' as any) || 'All Branches'}</option>
                                {metrics.branches.map((b: any) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Employee Filter (SuperAdmin and BranchManager) */}
                    {(user?.role === 'SuperAdmin' || user?.role === 'BranchManager') && metrics.users && (
                        <div className="flex flex-col min-w-[180px]">
                            <span className="text-xs font-semibold text-slate-500 mb-1">{t('employee_filter' as any) || 'Employee / Cashier'}</span>
                            <select
                                value={selectedUser}
                                onChange={(e) => handleUserChange(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-800 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm"
                            >
                                <option value="">{t('all_employees' as any) || 'All Employees'}</option>
                                {metrics.users
                                    .filter((u: any) => !selectedBranch || String(u.branch_id) === String(selectedBranch))
                                    .map((u: any) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name} ({u.role === 'BranchManager' ? (t('admin') || 'Manager') : (t('cashier') || 'Cashier')})
                                        </option>
                                    ))}
                            </select>
                        </div>
                    )}

                    {/* Subtle refresh spinner */}
                    {refreshing && (
                        <div className="self-end pb-2.5">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col hover:border-slate-300 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                                <Icon className={`${card.textColor} opacity-80`} size={20} />
                            </div>
                            <div>
                                <h3 className="text-3xl font-semibold text-slate-900 tracking-tight">{card.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts & Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold text-slate-900">{t('revenue_profit_overview' as any)}</h3>
                    </div>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[...metrics.chart_data].reverse()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" name={t('revenue' as any) || 'Revenue'} stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                <Area type="monotone" dataKey="profit" name={t('profit' as any) || 'Profit'} stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Selling & Alerts */}
                <div className="space-y-6">
                    {/* Top Selling */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
                        <h3 className="text-base font-semibold text-slate-900 mb-6">{t('top_selling_medicines' as any)}</h3>
                        <div className="space-y-1">
                            {metrics.top_selling.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                                    <div className="flex items-center space-x-3 space-x-reverse text-start">
                                        <span className="text-slate-400 text-sm font-medium w-4">{i + 1}.</span>
                                        <span className="font-medium text-slate-700 text-sm truncate max-w-[140px]">{item.name}</span>
                                    </div>
                                    <div className="text-sm font-semibold text-slate-900">
                                        {item.total_sold} <span className="text-slate-400 font-normal text-xs ml-1">{t('units' as any)}</span>
                                    </div>
                                </div>
                            ))}
                            {metrics.top_selling.length === 0 && (
                                <div className="py-6 text-center">
                                    <p className="text-sm text-slate-500">{t('no_sales_data' as any)}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/70 shadow-sm">
                        <h3 className="text-base font-semibold text-slate-900 mb-6">{t('action_needed' as any)}</h3>
                        <div className="space-y-3">
                            {metrics.alerts.slice(0, 4).map((alert: any, i: number) => (
                                <div key={i} className={`px-4 py-3 text-sm rounded-lg border-l-4 flex items-start text-start 
                                    ${alert.type === 'shortage' 
                                        ? 'bg-red-50 border-l-red-500 text-red-800' 
                                        : 'bg-amber-50 border-l-amber-500 text-amber-800'}`}>
                                    <p className="font-medium leading-relaxed">
                                        {alert.type === 'shortage' 
                                            ? t('low_stock_msg' as any)?.replace('{name}', alert.medicine_name)?.replace('{qty}', alert.quantity) || alert.message
                                            : t('expiring_soon_msg' as any)?.replace('{name}', alert.medicine_name)?.replace('{date}', alert.date) || alert.message}
                                    </p>
                                </div>
                            ))}
                            {metrics.alerts.length === 0 && (
                                <div className="py-6 text-center">
                                    <p className="text-sm font-medium text-slate-500">{t('all_systems_healthy' as any)}</p>
                                </div>
                            )}
                            
                            {metrics.alerts.length > 4 && (
                                <div className="pt-2">
                                    <Link href="/dashboard/inventory" className="block w-full py-2.5 px-4 text-center text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                                        {t('view_all_alerts' as any)} ({metrics.alerts.length})
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Employee Performance Breakdown (SuperAdmin Only) */}
            {user?.role === 'SuperAdmin' && metrics.user_breakdown && (
                <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse">
                            <Users size={20} className="text-slate-500 text-start" />
                            <h3 className="text-lg font-semibold text-slate-900">{t('employee_performance' as any) || 'Employee Performance Breakdown'}</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-start border-collapse text-sm" dir={dir}>
                            <thead>
                                <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 text-start">{t('name')}</th>
                                    <th className="px-6 py-4 text-start">{t('role')}</th>
                                    <th className="px-6 py-4 text-start">{t('branch')}</th>
                                    <th className="px-6 py-4 text-start">{t('today_sales' as any) || 'Sales Today'}</th>
                                    <th className="px-6 py-4 text-start">{t('today_revenue' as any) || 'Revenue Today'}</th>
                                    <th className="px-6 py-4 text-start">{t('month_sales' as any) || 'Sales Month'}</th>
                                    <th className="px-6 py-4 text-start">{t('month_revenue' as any) || 'Revenue Month'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {metrics.user_breakdown.map((emp: any) => (
                                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900 text-start">{emp.name}</td>
                                        <td className="px-6 py-4 text-start">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                emp.role === 'BranchManager' 
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                                    : 'bg-slate-50 text-slate-700 border border-slate-100'
                                            }`}>
                                                {emp.role === 'BranchManager' ? (t('admin') || 'Manager') : (t('cashier') || 'Cashier')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-start">{emp.branch_name}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-900 text-start">{emp.sales_today}</td>
                                        <td className="px-6 py-4 text-emerald-600 font-semibold text-start">{emp.revenue_today.toFixed(2)} <span className="text-xs font-normal text-slate-400">{t('currency')}</span></td>
                                        <td className="px-6 py-4 font-semibold text-slate-900 text-start">{emp.sales_month}</td>
                                        <td className="px-6 py-4 text-emerald-600 font-semibold text-start">{emp.revenue_month.toFixed(2)} <span className="text-xs font-normal text-slate-400">{t('currency')}</span></td>
                                    </tr>
                                ))}
                                {metrics.user_breakdown.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                                            {t('no_items_found' as any) || 'No employees found.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
