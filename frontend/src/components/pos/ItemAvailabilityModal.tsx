'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api/axios';
import { X, ArrowRightLeft, ShoppingCart, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface Props {
    medicineId: number;
    medicineName: string;
    onClose: () => void;
    onAddToCart: (item: any) => void;
}

export default function ItemAvailabilityModal({ medicineId, medicineName, onClose, onAddToCart }: Props) {
    const { t, dir } = useTranslation();
    const [activeTab, setActiveTab] = useState<'alternatives' | 'other_branches'>('alternatives');
    
    const [alternatives, setAlternatives] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [transferLoading, setTransferLoading] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, [medicineId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [altRes, branchRes] = await Promise.all([
                api.get(`/catalog/medicines/${medicineId}/alternatives`),
                api.get(`/inventory/cross-branch/${medicineId}`)
            ]);
            
            if (altRes.data.success) setAlternatives(altRes.data.data);
            if (branchRes.data.success) setBranches(branchRes.data.data);
        } catch (err) {
            console.error('Failed to fetch availability data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestStock = async (branchId: number) => {
        try {
            setTransferLoading(branchId);
            const payload = {
                to_branch_id: branchId,
                items: [{ medicine_id: medicineId, quantity: 1 }]
            };
            const res = await api.post('/transfers', payload);
            if (res.data.success) {
                alert('Stock transfer requested successfully!');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to request stock transfer');
        } finally {
            setTransferLoading(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir={dir}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{medicineName}</h2>
                        <p className="text-sm font-medium text-red-500 mt-1 flex items-center">
                            {t('out_of_stock_in_branch' as any)}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white hover:bg-slate-200 border border-slate-200 rounded-full transition-colors text-slate-500 shadow-sm">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="flex border-b border-gray-200 bg-white">
                    <button 
                        onClick={() => setActiveTab('alternatives')}
                        className={`flex-1 py-4 font-bold text-center transition-all duration-200 ${activeTab === 'alternatives' ? 'border-b-2 border-blue-600 text-blue-700 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {t('local_alternatives' as any)}
                    </button>
                    <button 
                        onClick={() => setActiveTab('other_branches')}
                        className={`flex-1 py-4 font-bold text-center transition-all duration-200 ${activeTab === 'other_branches' ? 'border-b-2 border-amber-500 text-amber-700 bg-amber-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        {t('other_branches' as any)}
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-blue-500">
                            <Loader2 className="animate-spin h-10 w-10 mb-4" />
                            <p className="font-medium text-slate-500">{t('analyzing_inventory' as any)}</p>
                        </div>
                    ) : activeTab === 'alternatives' ? (
                        <div>
                            {alternatives.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                                    {t('no_alternatives_found' as any)}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {alternatives.map(alt => (
                                        <div key={alt.id} className="flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md bg-white transition-all group">
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-lg group-hover:text-blue-700 transition-colors">{alt.medicine.name}</h4>
                                                <div className="flex items-center mt-2 space-x-3 text-sm">
                                                    <span className="text-blue-600 font-black">{Number(alt.medicine.base_price).toFixed(2)} {t('currency' as any)}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">{t('qty')}: {alt.quantity}</span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => { onAddToCart(alt); onClose(); }}
                                                className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 transition-all font-bold text-sm"
                                            >
                                                <ShoppingCart size={18} className={dir === 'rtl' ? 'ml-2' : 'mr-2'} /> {t('swap_and_add' as any)}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            {branches.length === 0 ? (
                                <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                                    {t('no_branches_stock' as any)}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {branches.map(branch => (
                                        <div key={branch.branch_id} className="flex items-center justify-between p-5 border border-amber-200 rounded-xl hover:border-amber-400 hover:shadow-md bg-amber-50/40 transition-all">
                                            <div>
                                                <h4 className="font-bold text-amber-900 text-lg">{branch.branch_name}</h4>
                                                <div className="flex items-center mt-2 text-sm">
                                                    <span className="text-amber-700 bg-amber-100/50 px-2 py-1 rounded-md">{t('available_stock' as any)} <span className="font-black text-amber-900 ml-1">{branch.quantity}</span></span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleRequestStock(branch.branch_id)}
                                                disabled={transferLoading === branch.branch_id}
                                                className="flex items-center px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 hover:shadow-lg hover:shadow-amber-600/20 transition-all font-bold text-sm disabled:opacity-50"
                                            >
                                                {transferLoading === branch.branch_id ? <Loader2 className={`animate-spin h-5 w-5 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} /> : <ArrowRightLeft size={18} className={dir === 'rtl' ? 'ml-2' : 'mr-2'} />}
                                                {t('request_transfer' as any)}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
