'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api/axios';
import { Loader2, ArrowRightCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function TransfersPage() {
    const { t, dir } = useTranslation();
    const [transfers, setTransfers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const user = useAuthStore(state => state.user);

    useEffect(() => {
        fetchTransfers();
    }, []);

    const fetchTransfers = () => {
        api.get('/transfers').then(res => {
            setTransfers(res.data.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    };

    const handleUpdateStatus = async (id: number, status: string) => {
        try {
            setActionLoading(id);
            const res = await api.put(`/transfers/${id}/status`, { status });
            if (res.data.success) {
                alert(`Transfer marked as ${status}`);
                fetchTransfers();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir={dir}>
            <h1 className="text-2xl font-black text-slate-800">{t('stock_transfers' as any)}</h1>
            <p className="text-slate-500">{t('manage_transfers_desc' as any)}</p>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-slate-500 text-xs uppercase tracking-wider font-bold">
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('id' as any)}</th>
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('from_branch' as any)}</th>
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('to_branch' as any)}</th>
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('status' as any)}</th>
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{t('action' as any)}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {transfers.map(transfer => {
                            const isSender = user?.branch_id === transfer.from_branch_id || user?.role === 'SuperAdmin';
                            const isReceiver = user?.branch_id === transfer.to_branch_id || user?.role === 'SuperAdmin';

                            return (
                                <tr key={transfer.id} className="hover:bg-slate-50 transition-colors">
                                    <td className={`py-4 px-6 font-mono text-sm text-slate-500 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>#{transfer.id}</td>
                                    <td className={`py-4 px-6 font-bold text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{transfer.from_branch?.name || '-'}</td>
                                    <td className={`py-4 px-6 font-bold text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{transfer.to_branch?.name || '-'}</td>
                                    <td className={`py-4 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${transfer.status === 'Shipped' ? 'bg-amber-100 text-amber-700' : transfer.status === 'Received' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {t(transfer.status.toLowerCase() as any) || transfer.status}
                                        </span>
                                    </td>
                                    <td className={`py-4 px-6 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                                        {transfer.status === 'Pending' && isSender && (
                                            <button 
                                                onClick={() => handleUpdateStatus(transfer.id, 'Shipped')}
                                                disabled={actionLoading === transfer.id}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm shadow-sm transition-all disabled:opacity-50"
                                            >
                                                {actionLoading === transfer.id ? t('processing' as any) : t('approve_ship' as any)}
                                            </button>
                                        )}
                                        {transfer.status === 'Shipped' && isReceiver && (
                                            <button 
                                                onClick={() => handleUpdateStatus(transfer.id, 'Received')}
                                                disabled={actionLoading === transfer.id}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold text-sm shadow-sm transition-all disabled:opacity-50"
                                            >
                                                {actionLoading === transfer.id ? t('processing' as any) : t('mark_received' as any)}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {transfers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-slate-500">{t('no_transfers_found' as any)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
