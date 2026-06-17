'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Search, Loader2 } from 'lucide-react';
import api from '@/lib/api/axios';
import AsyncSelect from 'react-select/async';
import { useTranslation } from '@/hooks/useTranslation';

export default function InventoryAdjustmentsPage() {
    const { t, dir } = useTranslation();
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [medicine, setMedicine] = useState<any>(null);
    const [batchNumber, setBatchNumber] = useState('');
    const [type, setType] = useState('addition');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchAdjustments = async () => {
        try {
            const res = await api.get('/inventory/adjustments');
            setAdjustments(res.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchAdjustments();
    }, []);

    const loadMedicines = async (inputValue: string) => {
        if (!inputValue) return [];
        try {
            const res = await api.get(`/catalog/medicines?search=${inputValue}`);
            return res.data.data.map((m: any) => ({ label: m.name, value: m.id }));
        } catch (err) { return []; }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!medicine || !batchNumber || !quantity || !reason) return alert('Fill all fields');

        setSubmitting(true);
        try {
            await api.post('/inventory/adjustments', {
                medicine_id: medicine.value,
                batch_number: batchNumber,
                adjustment_type: type,
                quantity: Number(quantity),
                reason: reason
            });
            setShowModal(false);
            setMedicine(null);
            setBatchNumber('');
            setQuantity('');
            setReason('');
            fetchAdjustments();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to adjust inventory');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6" dir={dir}>
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                        <ClipboardList size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">{t('stock_take' as any)}</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">{t('manage_adjustments_desc' as any)}</p>
                    </div>
                </div>
                <button onClick={() => setShowModal(true)} className={`flex items-center bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-orange-600/20 ${dir === 'rtl' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Plus size={20} className={dir === 'rtl' ? 'ml-2' : 'mr-2'} /> {t('new_adjustment' as any)}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                {loading ? (
                    <div className="text-center py-10"><Loader2 className="animate-spin inline text-slate-400" size={32} /></div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-slate-500 text-xs uppercase tracking-wider font-bold">
                                <th className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('date' as any)}</th>
                                <th className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('user' as any)}</th>
                                <th className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('medicine' as any)}</th>
                                <th className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('batch' as any)}</th>
                                <th className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('type' as any)}</th>
                                <th className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('qty' as any)}</th>
                                <th className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('reason' as any)}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {adjustments.map((adj: any) => (
                                <tr key={adj.id} className="hover:bg-slate-50">
                                    <td className={`p-4 text-sm text-slate-500 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{new Date(adj.created_at).toLocaleString()}</td>
                                    <td className={`p-4 text-sm text-slate-600 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{adj.user?.name || 'System'}</td>
                                    <td className={`p-4 font-bold text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{adj.medicine?.name}</td>
                                    <td className={`p-4 text-sm font-mono text-slate-500 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{adj.batch_number}</td>
                                    <td className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${adj.adjustment_type === 'addition' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {t(adj.adjustment_type as any) || adj.adjustment_type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className={`p-4 font-black ${adj.adjustment_type === 'addition' ? 'text-emerald-600' : 'text-red-600'} ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                        {adj.adjustment_type === 'addition' ? '+' : '-'}{adj.quantity}
                                    </td>
                                    <td className={`p-4 text-sm text-slate-600 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{adj.reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" dir={dir}>
                        <h2 className="text-xl font-bold mb-4">{t('inventory_adjustment' as any)}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('select_medicine' as any)}</label>
                                <AsyncSelect 
                                    cacheOptions defaultOptions loadOptions={loadMedicines} 
                                    onChange={val => setMedicine(val)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('batch_number' as any)}</label>
                                <input required type="text" value={batchNumber} onChange={e => setBatchNumber(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:border-orange-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">{t('type' as any)}</label>
                                    <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:border-orange-500">
                                        <option value="addition">{t('addition' as any)}</option>
                                        <option value="deduction">{t('deduction' as any)}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">{t('qty' as any)}</label>
                                    <input required type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:border-orange-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('reason' as any)}</label>
                                <input required type="text" placeholder={t('reason_placeholder' as any)} value={reason} onChange={e => setReason(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:border-orange-500" />
                            </div>
                            <div className={`flex space-x-3 pt-4 ${dir === 'rtl' ? 'space-x-reverse' : ''}`}>
                                <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold ${dir === 'rtl' ? 'ml-3' : 'mr-3'}`}>{t('cancel')}</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-orange-600 text-white rounded-xl font-bold">{submitting ? t('loading') : t('submit' as any)}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
