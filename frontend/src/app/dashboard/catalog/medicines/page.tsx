'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Search, Edit2, PackageOpen, Eye } from 'lucide-react';
import Link from 'next/link';
import axios from '@/lib/api/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface Medicine {
    id: number;
    name: string;
    scientific_name: string;
    barcode: string;
    base_price: number;
    purchase_price: number;
    has_sub_unit: boolean;
    sub_unit_name: string | null;
    sub_units_per_box: number | null;
    sub_unit_price: number | null;
    category?: { name: string };
}

export default function MedicinesListPage() {
    const { t, dir } = useTranslation();
    const { user } = useAuthStore();
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchMedicines();
    }, []);

    const fetchMedicines = async () => {
        try {
            const res = await axios.get('/catalog/medicines');
            if (res.data.success) {
                setMedicines(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch medicines', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = medicines.filter(m => 
        m.name.toLowerCase().includes(search.toLowerCase()) || 
        m.barcode.includes(search) ||
        (m.scientific_name && m.scientific_name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6" dir={dir}>
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{t('medicines' as any)}</h1>
                    <p className="text-slate-500 text-sm mt-1">{t('manage_medicines_desc' as any)}</p>
                </div>
                {user?.role === 'SuperAdmin' && (
                    <Link href="/dashboard/catalog/medicines/new" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/20 flex items-center space-x-2 space-x-reverse">
                        <Plus size={20} />
                        <span>{t('add_medicine' as any)}</span>
                    </Link>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${dir === 'rtl' ? 'right-4' : 'left-4'}`} size={20} />
                        <input
                            type="text"
                            placeholder={t('search_medicines' as any)}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`w-full bg-white border border-slate-200 rounded-xl py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 text-center text-slate-400">{t('loading')}</div>
                    ) : (
                        <table className="w-full text-left border-collapse" style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                            <thead className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                                <tr>
                                    <th className="py-4 px-6 font-medium">{t('item_description' as any)}</th>
                                    <th className="py-4 px-6 font-medium">{t('category' as any)}</th>
                                    <th className="py-4 px-6 font-medium">{t('base_price' as any)}</th>
                                    <th className="py-4 px-6 font-medium text-center">{t('sub_units' as any)}</th>
                                    <th className="py-4 px-6 font-medium text-center">{t('actions' as any)}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((medicine) => (
                                    <tr key={medicine.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800">{medicine.name}</span>
                                                <span className="text-xs text-slate-400">{medicine.barcode}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-slate-600">{medicine.category?.name || '-'}</td>
                                        <td className="py-4 px-6 font-medium text-slate-800">{Number(medicine.base_price).toFixed(2)}</td>
                                        <td className="py-4 px-6">
                                            {medicine.has_sub_unit ? (
                                                <div className="flex flex-col items-center justify-center">
                                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">{medicine.sub_units_per_box} {medicine.sub_unit_name} / {t('box')}</span>
                                                    <span className="text-xs text-slate-500 mt-1">{Number(medicine.sub_unit_price).toFixed(2)} {t('currency' as any)} {t('each' as any)}</span>
                                                </div>
                                            ) : (
                                                <div className="flex justify-center text-slate-300">-</div>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {user?.role === 'SuperAdmin' ? (
                                                <Link href={`/dashboard/catalog/medicines/${medicine.id}`} className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Edit2 size={18} />
                                                </Link>
                                            ) : (
                                                <div className="text-slate-300">-</div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400">
                                            <PackageOpen size={48} className="mx-auto mb-4 opacity-20" />
                                            <p>{t('no_items_found' as any)}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
