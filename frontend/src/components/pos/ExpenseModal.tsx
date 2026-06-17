'use client';

import React, { useState } from 'react';
import { X, DollarSign, Loader2 } from 'lucide-react';
import api from '@/lib/api/axios';
import { useTranslation } from '@/hooks/useTranslation';

interface ExpenseModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function ExpenseModal({ onClose, onSuccess }: ExpenseModalProps) {
    const { t, dir } = useTranslation();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setError('Please enter a valid amount.');
            return;
        }
        if (!reason.trim()) {
            setError('Please enter a reason.');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/shifts/expenses', {
                amount: Number(amount),
                reason: reason.trim()
            });
            if (res.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit expense. Ensure you have an open shift.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden" dir={dir}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-black text-slate-800 flex items-center">
                        <DollarSign className={`text-red-500 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} size={20} />
                        {t('record_daily_expense' as any)}
                    </h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}
                    
                    <div className="mb-4">
                        <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('amount' as any)}</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>

                    <div className="mb-6">
                        <label className={`block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>{t('reason' as any)}</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                            placeholder={t('expense_reason_placeholder' as any)}
                        />
                    </div>

                    <div className={`flex space-x-3 ${dir === 'rtl' ? 'space-x-reverse' : ''}`}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold transition-all shadow-md shadow-red-600/20 disabled:opacity-50 flex justify-center items-center"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : t('save_expense' as any)}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
