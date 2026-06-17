'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Plus, PackagePlus, Loader2, CheckCircle } from 'lucide-react';
import api from '@/lib/api/axios';
import AsyncSelect from 'react-select/async';
import { useTranslation } from '@/hooks/useTranslation';

export default function ProcurementPage() {
    const { t, dir } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form
    const [supplierId, setSupplierId] = useState<number | null>(null);
    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/procurement/purchase-orders');
            setOrders(res.data.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/procurement/suppliers');
            setSuppliers(res.data.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchOrders();
        fetchSuppliers();
    }, []);

    const loadMedicines = async (inputValue: string) => {
        if (!inputValue) return [];
        try {
            const res = await api.get(`/catalog/medicines?search=${inputValue}`);
            return res.data.data.map((m: any) => ({ label: m.name, value: m.id }));
        } catch (err) { return []; }
    };

    const addItem = () => {
        setItems([...items, { medicine: null, quantity: 1, purchase_price: 0, batch_number: '', expiry_date: '' }]);
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || items.length === 0) return alert('Select a supplier and add at least one item.');
        if (items.some(i => !i.medicine || !i.batch_number || !i.expiry_date)) return alert('Fill all fields for items.');

        setSubmitting(true);
        try {
            const payload = {
                supplier_id: supplierId,
                items: items.map(i => ({
                    medicine_id: i.medicine.value,
                    quantity: i.quantity,
                    purchase_price: i.purchase_price,
                    batch_number: i.batch_number,
                    expiry_date: i.expiry_date
                }))
            };
            await api.post('/procurement/purchase-orders', payload);
            setShowCreateModal(false);
            setSupplierId(null);
            setItems([]);
            fetchOrders();
        } catch (err) {
            console.error(err);
            alert('Failed to create order.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReceive = async (id: number) => {
        if (!confirm('Are you sure you want to mark this order as received? This will inject the stock into the pharmacy inventory.')) return;
        try {
            await api.post(`/procurement/purchase-orders/${id}/receive`);
            alert('Stock added successfully!');
            fetchOrders();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to receive order.');
        }
    };

    return (
        <div className="space-y-6" dir={dir}>
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <Truck size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">{t('purchase_orders' as any)}</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">{t('manage_procurement_desc' as any)}</p>
                    </div>
                </div>
                <button onClick={() => setShowCreateModal(true)} className={`flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 ${dir === 'rtl' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <PackagePlus size={20} className={dir === 'rtl' ? 'ml-2' : 'mr-2'} /> {t('new_order' as any)}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="text-center py-10"><Loader2 className="animate-spin inline text-slate-400" size={32} /></div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-slate-500 text-xs uppercase tracking-wider font-bold">
                                <th className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('order_id' as any)}</th>
                                <th className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('supplier' as any)}</th>
                                <th className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('cost' as any)}</th>
                                <th className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('date' as any)}</th>
                                <th className={`p-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('status')}</th>
                                <th className={`p-4 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{t('actions' as any)}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.map((order: any) => (
                                <tr key={order.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold text-slate-800">#{order.id}</td>
                                    <td className="p-4 text-sm text-slate-600">{order.supplier.name}</td>
                                    <td className="p-4 font-bold text-slate-800">${order.total_cost}</td>
                                    <td className="p-4 text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${order.status === 'received' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {order.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className={`p-4 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                                        {order.status === 'pending' && (
                                            <button onClick={() => handleReceive(order.id)} className={`text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center inline-flex ${dir === 'rtl' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                                <CheckCircle size={14} className={dir === 'rtl' ? 'ml-1' : 'mr-1'} /> {t('receive' as any)}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 shrink-0">
                            <h2 className="text-xl font-black">{t('create_purchase_order' as any)}</h2>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-500 mb-2">{t('select_supplier' as any)}</label>
                                <select 
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    value={supplierId || ''}
                                    onChange={e => setSupplierId(Number(e.target.value))}
                                >
                                    <option value="">{t('choose_supplier' as any)}</option>
                                    {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700">{t('order_items' as any)}</h3>
                                    <button onClick={addItem} className={`text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded font-bold hover:bg-slate-200 ${dir === 'rtl' ? 'flex-row-reverse space-x-reverse' : ''}`}><Plus size={14} className={`inline ${dir === 'rtl' ? 'ml-1' : 'mr-1'}`} /> {t('add_row' as any)}</button>
                                </div>
                                {items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 items-center">
                                        <div className="col-span-3">
                                            <AsyncSelect 
                                                cacheOptions defaultOptions loadOptions={loadMedicines} 
                                                onChange={val => { const newItems = [...items]; newItems[idx].medicine = val; setItems(newItems); }}
                                                placeholder={t('medicine' as any) + '...'}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <input type="number" placeholder={t('qty' as any)} value={item.quantity} onChange={e => { const newItems = [...items]; newItems[idx].quantity = Number(e.target.value); setItems(newItems); }} className="w-full px-2 py-1.5 border rounded" />
                                        </div>
                                        <div className="col-span-2">
                                            <input type="number" placeholder={t('cost_unit' as any)} value={item.purchase_price} onChange={e => { const newItems = [...items]; newItems[idx].purchase_price = Number(e.target.value); setItems(newItems); }} className="w-full px-2 py-1.5 border rounded" />
                                        </div>
                                        <div className="col-span-2">
                                            <input type="text" placeholder={t('batch_num' as any)} value={item.batch_number} onChange={e => { const newItems = [...items]; newItems[idx].batch_number = e.target.value; setItems(newItems); }} className="w-full px-2 py-1.5 border rounded" />
                                        </div>
                                        <div className="col-span-2">
                                            <input type="date" value={item.expiry_date} onChange={e => { const newItems = [...items]; newItems[idx].expiry_date = e.target.value; setItems(newItems); }} className="w-full px-2 py-1.5 border rounded text-xs" />
                                        </div>
                                        <div className="col-span-1 text-center">
                                            <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-red-500 hover:bg-red-50 p-1 rounded">X</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className={`p-6 border-t border-slate-100 flex justify-end shrink-0 space-x-3 ${dir === 'rtl' ? 'space-x-reverse' : ''}`}>
                            <button onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold">{t('cancel')}</button>
                            <button onClick={handleCreateOrder} disabled={submitting} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center">
                                {submitting ? <Loader2 className={`animate-spin ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} size={18} /> : null} {t('submit_order' as any)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
