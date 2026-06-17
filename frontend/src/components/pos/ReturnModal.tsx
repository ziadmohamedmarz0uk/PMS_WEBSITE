'use client';

import React, { useState } from 'react';
import { X, RefreshCcw, Search, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api/axios';
import { useTranslation } from '@/hooks/useTranslation';

interface ReturnModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function ReturnModal({ onClose, onSuccess }: ReturnModalProps) {
    const { t, dir } = useTranslation();
    const [invoiceId, setInvoiceId] = useState('');
    const [invoice, setInvoice] = useState<any>(null);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [loadingReturn, setLoadingReturn] = useState(false);
    const [error, setError] = useState('');
    const [returnItems, setReturnItems] = useState<Record<number, number>>({});

    const searchInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoiceId.trim()) return;
        
        setError('');
        setLoadingSearch(true);
        setInvoice(null);
        setReturnItems({});

        try {
            const res = await api.get(`/pos/invoices/${invoiceId}`);
            if (res.data.success) {
                setInvoice(res.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invoice not found.');
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleQuantityChange = (medicineId: number, qty: number, maxQty: number) => {
        if (qty < 0) qty = 0;
        if (qty > maxQty) qty = maxQty;
        setReturnItems(prev => ({ ...prev, [medicineId]: qty }));
    };

    const handleReturn = async () => {
        const itemsToReturn = Object.entries(returnItems)
            .filter(([_, qty]) => qty > 0)
            .map(([medicineId, qty]) => ({
                medicine_id: Number(medicineId),
                quantity: qty
            }));

        if (itemsToReturn.length === 0) {
            setError('Please specify quantities for items to return.');
            return;
        }

        setLoadingReturn(true);
        setError('');

        try {
            const res = await api.post('/pos/returns', {
                invoice_id: invoice.id,
                items: itemsToReturn
            });
            if (res.data.success) {
                alert(`Return processed! Total Refund Amount: $${res.data.data.total_refund_amount.toFixed(2)}`);
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to process return.');
        } finally {
            setLoadingReturn(false);
        }
    };

    // Calculate preview refund
    const totalReturnSubtotal = Object.entries(returnItems).reduce((acc, [medicineId, qty]) => {
        if (!invoice || qty === 0) return acc;
        const item = invoice.items.find((i: any) => i.medicine_id === Number(medicineId));
        return acc + (item ? item.unit_price * qty : 0);
    }, 0);

    const invoiceTotalAmount = invoice?.total_amount || 1;
    const invoiceGrandTotal = invoice?.grand_total || 0;
    const refundRatio = totalReturnSubtotal / invoiceTotalAmount;
    const estimatedRefund = invoiceGrandTotal * refundRatio;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden" dir={dir}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-black text-slate-800 flex items-center">
                        <RefreshCcw className={`text-blue-500 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} size={20} />
                        {t('process_sales_return' as any)}
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={searchInvoice} className="flex space-x-2 mb-6">
                        <input
                            type="text"
                            value={invoiceId}
                            onChange={(e) => setInvoiceId(e.target.value)}
                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            placeholder={t('enter_invoice_id' as any)}
                        />
                        <button
                            type="submit"
                            disabled={loadingSearch || !invoiceId}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold transition-all disabled:opacity-50 flex items-center"
                        >
                            {loadingSearch ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                        </button>
                    </form>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100 flex items-center">
                            <AlertCircle size={16} className="mr-2 shrink-0" /> {error}
                        </div>
                    )}

                    {invoice && (
                        <div className="space-y-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">{t('invoice_details' as any)}</span>
                                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">{t('paid_via' as any)} {t(invoice.payment_method.toLowerCase() as any) || invoice.payment_method}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm font-medium">
                                    <div>{t('date' as any)}: {new Date(invoice.created_at).toLocaleString()}</div>
                                    <div>{t('total' as any)}: {invoice.total_amount} {t('currency' as any)}</div>
                                    <div>{t('discount' as any)}: {invoice.discount_amount} {invoice.discount_type === 'percentage' ? '%' : t('currency' as any)}</div>
                                    <div>{t('grand_total' as any)}: {invoice.grand_total} {t('currency' as any)}</div>
                                </div>
                            </div>

                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-slate-500 text-xs uppercase tracking-wider">
                                        <th className={`py-3 px-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('item' as any)}</th>
                                        <th className={`py-3 px-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('price' as any)}</th>
                                        <th className={`py-3 px-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('purchased_qty' as any)}</th>
                                        <th className={`py-3 px-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('return_qty' as any)}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoice.items.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50">
                                            <td className={`py-3 px-4 font-bold text-slate-800 text-sm ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{item.medicine.name}</td>
                                            <td className={`py-3 px-4 text-sm text-slate-600 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{item.unit_price} {t('currency' as any)}</td>
                                            <td className={`py-3 px-4 text-sm font-bold text-slate-800 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{item.quantity}</td>
                                            <td className={`py-3 px-4 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={item.quantity}
                                                    value={returnItems[item.medicine_id] || 0}
                                                    onChange={(e) => handleQuantityChange(item.medicine_id, Number(e.target.value), item.quantity)}
                                                    className="w-20 px-2 py-1 border border-slate-300 rounded-md text-sm outline-none focus:border-blue-500 font-bold"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-between items-center shrink-0">
                    <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                        <span className="block text-xs font-bold text-slate-500 uppercase">{t('est_refund' as any)}</span>
                        <span className="text-2xl font-black text-blue-600">{estimatedRefund.toFixed(2)} {t('currency' as any)}</span>
                    </div>
                    <div className={`flex space-x-3 ${dir === 'rtl' ? 'space-x-reverse' : ''}`}>
                        <button onClick={onClose} className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">{t('cancel')}</button>
                        <button 
                            onClick={handleReturn}
                            disabled={!invoice || estimatedRefund <= 0 || loadingReturn}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center shadow-lg shadow-blue-600/20"
                        >
                            {loadingReturn ? <Loader2 className={`animate-spin ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} size={18} /> : <RefreshCcw className={dir === 'rtl' ? 'ml-2' : 'mr-2'} size={18} />}
                            {t('process_refund' as any)}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
