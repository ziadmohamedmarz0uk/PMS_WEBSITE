'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuthStore } from '@/store/useAuthStore';
import { 
    TrendingUp, 
    CreditCard, 
    PackageSearch, 
    AlertTriangle,
    Activity,
    DollarSign,
    Box
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import axios from '@/lib/api/axios';
import Link from 'next/link';

export default function DashboardOverviewPage() {
    const { t, dir } = useTranslation();
    const { user } = useAuthStore();
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            const res = await axios.get('/pos/dashboard/metrics');
            if (res.data.success) {
                setMetrics(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch metrics', error);
        } finally {
            setLoading(false);
        }
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
            color: 'bg-emerald-500',
            textColor: 'text-emerald-500'
        },
        {
            title: t('profit_today' as any) || 'Profit Today',
            value: `${Number(metrics.total_profit_today).toFixed(2)}`,
            icon: TrendingUp,
            color: 'bg-blue-500',
            textColor: 'text-blue-500'
        },
        {
            title: t('sales_count' as any) || 'Sales Count',
            value: metrics.total_sales_today,
            icon: CreditCard,
            color: 'bg-purple-500',
            textColor: 'text-purple-500'
        },
        {
            title: t('critical_shortages' as any) || 'Critical Shortages',
            value: metrics.shortages_count,
            icon: AlertTriangle,
            color: 'bg-red-500',
            textColor: 'text-red-500'
        }
    ];

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto" dir={dir}>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">{t('overview')}</h1>
                    <p className="text-slate-500 mt-1 text-sm">{t('welcome_back' as any)?.replace('{name}', user?.name || '')}</p>
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
                                    <div className="flex items-center space-x-3 space-x-reverse">
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
                                <div key={i} className={`px-4 py-3 text-sm rounded-lg border-l-4 flex items-start 
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
        </div>
    );
}
