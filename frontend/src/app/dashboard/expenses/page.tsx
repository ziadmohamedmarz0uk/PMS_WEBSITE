'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api/axios';
import { DollarSign, Search, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function ExpensesPage() {
    const { t, dir } = useTranslation();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/shifts/expenses');
            if (res.data.success) {
                setExpenses(res.data.data.data || res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch expenses', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredExpenses = expenses.filter(exp => 
        (exp.reason || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (exp.shift?.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500" dir={dir}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100">
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">{t('expenses' as any) || 'Expenses'}</h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">{t('track_daily_expenses_desc' as any)}</p>
                    </div>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-3' : 'left-3'} my-auto text-slate-400`} size={18} />
                    <input 
                        type="text" 
                        placeholder={t('search') + '...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all`}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="py-4 px-6">{t('date_time' as any)}</th>
                                <th className="py-4 px-6">{t('reason' as any)}</th>
                                <th className="py-4 px-6">{t('cashier' as any)}</th>
                                <th className="py-4 px-6">{t('branch')}</th>
                                <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{t('amount' as any)}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4 text-red-500" />
                                        <p>{t('loading_expenses' as any)}</p>
                                    </td>
                                </tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        {t('no_expenses_found' as any)}
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((exp) => (
                                    <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-slate-800">{new Date(exp.created_at).toLocaleDateString()}</div>
                                            <div className="text-xs text-slate-400 font-mono mt-1">{new Date(exp.created_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-medium text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                                                {exp.reason}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-slate-700">{exp.shift?.user?.name || t('unknown' as any)}</div>
                                            <div className="text-xs text-slate-400 mt-1">{t('shift_num' as any)} {exp.shift_id}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                                {t('branch')} {exp.branch_id}
                                            </span>
                                        </td>
                                        <td className={`py-4 px-6 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                                            <span className="font-black text-red-600 text-lg">
                                                - {Number(exp.amount).toFixed(2)} {t('currency' as any)}
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
