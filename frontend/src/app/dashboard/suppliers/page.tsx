'use client';

import React, { useState, useEffect } from 'react';
import { PackageSearch, Plus, Search, MapPin, Phone, Mail, Loader2 } from 'lucide-react';
import api from '@/lib/api/axios';
import { useTranslation } from '@/hooks/useTranslation';

export default function SuppliersPage() {
    const { t, dir } = useTranslation();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Form
    const [formData, setFormData] = useState({ name: '', contact_number: '', email: '', address: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchSuppliers = async () => {
        try {
            const res = await api.get('/procurement/suppliers');
            setSuppliers(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/procurement/suppliers', formData);
            setShowModal(false);
            setFormData({ name: '', contact_number: '', email: '', address: '' });
            fetchSuppliers();
        } catch (err) {
            console.error(err);
            alert('Failed to save supplier.');
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = suppliers.filter((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6" dir={dir}>
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                        <PackageSearch size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">{t('suppliers' as any)}</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">{t('manage_suppliers_desc' as any)}</p>
                    </div>
                </div>
                <button onClick={() => setShowModal(true)} className={`flex items-center bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-purple-600/20 ${dir === 'rtl' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Plus size={20} className={dir === 'rtl' ? 'ml-2' : 'mr-2'} /> {t('add_supplier' as any)}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="relative mb-6">
                    <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${dir === 'rtl' ? 'right-4' : 'left-4'}`} size={20} />
                    <input
                        type="text"
                        placeholder={t('search_suppliers' as any)}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                    />
                </div>

                {loading ? (
                    <div className="text-center py-10"><Loader2 className="animate-spin inline text-slate-400" size={32} /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filtered.map((supplier: any) => (
                            <div key={supplier.id} className="border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-purple-200 transition-all bg-slate-50/50">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg text-slate-800">{supplier.name}</h3>
                                    <span className="text-xs font-black px-2 py-1 bg-red-100 text-red-700 rounded-md">{t('owe' as any)}: {supplier.balance} {t('currency' as any)}</span>
                                </div>
                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center"><Phone size={14} className={`text-slate-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} /> {supplier.contact_number || t('na' as any)}</div>
                                    <div className="flex items-center"><Mail size={14} className={`text-slate-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} /> {supplier.email || t('na' as any)}</div>
                                    <div className="flex items-center"><MapPin size={14} className={`text-slate-400 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} /> {supplier.address || t('na' as any)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" dir={dir}>
                        <h2 className="text-xl font-bold mb-4">{t('add_supplier' as any)}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('company_name' as any)}</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('contact_number' as any)}</label>
                                <input type="text" value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('email' as any)}</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">{t('address' as any)}</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border rounded-xl" />
                            </div>
                            <div className="flex space-x-3 space-x-reverse pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className={`flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold ${dir === 'rtl' ? 'ml-3' : 'mr-3'}`}>{t('cancel')}</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-2 bg-purple-600 text-white rounded-xl font-bold">{submitting ? t('loading') : t('save_supplier' as any)}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
