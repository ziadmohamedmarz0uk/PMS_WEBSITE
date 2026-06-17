'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api/axios';
import { Loader2, DollarSign } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function ShiftsPage() {
    const { t, dir } = useTranslation();
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/shifts').then(res => {
            setShifts(res.data.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir={dir}>
            <h1 className="text-2xl font-black text-slate-800">{t('shift_logs' as any)}</h1>
            <p className="text-slate-500">{t('review_shift_logs_desc' as any)}</p>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-slate-500 text-xs uppercase tracking-wider font-bold">
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('id' as any)}</th>
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('cashier' as any)}</th>
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('status' as any)}</th>
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{t('expected_cash' as any)}</th>
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{t('submitted_cash' as any)}</th>
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{t('variance' as any)}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {shifts.map(shift => (
                            <tr key={shift.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-4 px-6 font-mono text-sm text-slate-500">#{shift.id}</td>
                                <td className={`py-4 px-6 font-bold text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{shift.user?.name || t('unknown' as any)}</td>
                                <td className="py-4 px-6">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${shift.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {shift.status}
                                    </span>
                                </td>
                                <td className={`py-4 px-6 font-medium text-slate-600 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                                    {shift.expected_cash ? `${Number(shift.expected_cash).toFixed(2)} ${t('currency' as any)}` : '-'}
                                </td>
                                <td className={`py-4 px-6 font-medium text-slate-600 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                                    {shift.actual_cash_submitted ? `${Number(shift.actual_cash_submitted).toFixed(2)} ${t('currency' as any)}` : '-'}
                                </td>
                                <td className={`py-4 px-6 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                                    {shift.variance !== undefined && shift.variance !== null ? (
                                        <div className={`flex items-center justify-end font-black ${shift.variance < 0 ? 'text-red-500' : shift.variance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {Number(shift.variance).toFixed(2)} {t('currency' as any)}
                                        </div>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {shifts.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-slate-500">{t('no_shift_logs_found' as any)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
