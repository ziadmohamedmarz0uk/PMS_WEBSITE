'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api/axios';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function InventoryAlertsPage() {
    const { t, dir } = useTranslation();
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/inventory').then(res => {
            const alerts = res.data.data.filter((item: any) => 
                item.expiry_status === 'Red' || item.expiry_status === 'Yellow' || item.quantity <= 0
            );
            setInventory(alerts);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500" dir={dir}>
            <div>
                <h1 className="text-2xl font-black text-slate-800">{t('inventory_alerts' as any)}</h1>
                <p className="text-slate-500 mt-1">{t('review_inventory_alerts_desc' as any)}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="text-slate-500 text-xs uppercase tracking-wider font-bold">
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('medicine' as any)}</th>
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('barcode' as any)}</th>
                            <th className="py-4 px-6 text-center">{t('expiry_status' as any)}</th>
                            <th className={`py-4 px-6 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{t('quantity' as any)}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {inventory.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className={`py-4 px-6 font-bold text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{item.medicine.name}</td>
                                <td className={`py-4 px-6 font-mono text-sm text-slate-500 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{item.medicine.barcode}</td>
                                <td className="py-4 px-6 text-center">
                                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-md border ${item.expiry_status === 'Red' ? 'bg-red-50 text-red-700 border-red-200' : item.expiry_status === 'Yellow' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                        <div className={`w-2 h-2 rounded-full ${dir === 'rtl' ? 'ml-1.5' : 'mr-1.5'} ${item.expiry_status === 'Red' ? 'bg-red-500' : item.expiry_status === 'Yellow' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                        {t(item.expiry_status.toLowerCase() as any) || item.expiry_status}
                                    </span>
                                </td>
                                <td className={`py-4 px-6 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                                    {item.quantity <= 0 ? (
                                        <div className={`flex items-center text-red-500 font-bold ${dir === 'rtl' ? 'justify-start' : 'justify-end'}`}>
                                            <AlertCircle size={14} className={dir === 'rtl' ? 'ml-1' : 'mr-1'} /> {t('out_of_stock' as any)}
                                        </div>
                                    ) : (
                                        <span className="font-bold text-slate-700">{item.quantity}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {inventory.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-slate-500 bg-slate-50/50">{t('all_stock_healthy' as any)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
