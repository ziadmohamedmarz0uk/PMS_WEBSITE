'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api/axios';
import { Receipt, Search, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function InvoicesPage() {
    const { t, dir } = useTranslation();
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await api.get('/pos/invoices');
            if (res.data.success) {
                setInvoices(res.data.data.data || res.data.data); // Handle pagination format if needed
            }
        } catch (err) {
            console.error('Failed to fetch invoices', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = invoices.filter(inv => 
        inv.id.toString().includes(searchQuery) || 
        (inv.shift?.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500" dir={dir}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Receipt size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t('invoices' as any) || 'Sales Invoices'}</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">{t('view_all_invoices_desc' as any)}</p>
                    </div>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-3' : 'left-3'} my-auto text-slate-400`} size={18} />
                    <input 
                        type="text" 
                        placeholder={t('search') + '...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-4 px-6">{t('id_date' as any)}</th>
                                <th className="py-4 px-6">{t('cashier' as any)}</th>
                                <th className="py-4 px-6 text-center">{t('items' as any)}</th>
                                <th className="py-4 px-6">{t('total_amount' as any)}</th>
                                <th className="py-4 px-6">{t('method' as any)}</th>
                                <th className="py-4 px-6">{t('status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-500" />
                                        <p>{t('loading_invoices' as any)}</p>
                                    </td>
                                </tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        {t('no_invoices_found' as any)}
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-slate-800">INV-{inv.id.toString().padStart(5, '0')}</div>
                                            <div className="text-xs text-slate-400 font-mono mt-1">{new Date(inv.created_at).toLocaleString()}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-medium text-slate-700">{inv.shift?.user?.name || t('unknown' as any)}</div>
                                            <div className="text-xs text-slate-400">{t('branch')} {inv.branch_id}</div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                                {inv.items?.length || 0}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-black text-slate-800 text-lg">
                                                {Number(inv.total_amount).toFixed(2)} {t('currency' as any)}
                                            </span>
                                            {inv.discount_amount > 0 && (
                                                <div className="text-xs text-amber-500 font-bold mt-1">
                                                    {t('discount')}: {inv.discount_amount} {inv.discount_type === 'percentage' ? '%' : t('currency' as any)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold ${
                                                inv.payment_method === 'Cash' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                inv.payment_method === 'Visa' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                'bg-purple-50 text-purple-700 border border-purple-200'
                                            }`}>
                                                {t(inv.payment_method.toLowerCase() as any) || inv.payment_method}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                                inv.status === 'finalized' ? 'text-emerald-500 bg-emerald-50' : 'text-red-500 bg-red-50'
                                            }`}>
                                                {inv.status === 'finalized' ? t('finalized' as any) : inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
