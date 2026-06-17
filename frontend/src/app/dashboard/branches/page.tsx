'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Search, Edit2, Store } from 'lucide-react';
import Link from 'next/link';
import axios from '@/lib/api/axios';

interface Branch {
    id: number;
    name: string;
    location: string;
    contact_number: string;
    status: string;
}

export default function BranchesListPage() {
    const { t, dir } = useTranslation();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchBranches();
    }, []);

    const fetchBranches = async () => {
        try {
            const res = await axios.get('/admin/branches');
            if (res.data.success) {
                setBranches(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch branches', error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = branches.filter(b => 
        b.name.toLowerCase().includes(search.toLowerCase()) || 
        (b.location && b.location.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6" dir={dir}>
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{t('branches' as any)}</h1>
                    <p className="text-slate-500 text-sm mt-1">{t('manage_branches_desc' as any)}</p>
                </div>
                <Link href="/dashboard/branches/new" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/20 flex items-center space-x-2 space-x-reverse">
                    <Plus size={20} />
                    <span>{t('add_branch' as any)}</span>
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${dir === 'rtl' ? 'right-4' : 'left-4'}`} size={20} />
                        <input
                            type="text"
                            placeholder={t('search_branches' as any)}
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
                                    <th className="py-4 px-6 font-medium">{t('name' as any)}</th>
                                    <th className="py-4 px-6 font-medium">{t('location' as any)}</th>
                                    <th className="py-4 px-6 font-medium">{t('contact_number' as any)}</th>
                                    <th className="py-4 px-6 font-medium">{t('status' as any)}</th>
                                    <th className="py-4 px-6 font-medium text-center">{t('actions' as any)}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.map((branch) => (
                                    <tr key={branch.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 font-bold text-slate-800">{branch.name}</td>
                                        <td className="py-4 px-6 text-slate-600">{branch.location || '-'}</td>
                                        <td className="py-4 px-6 text-slate-600">{branch.contact_number || '-'}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${branch.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {branch.status === 'Active' ? t('active' as any) : t('inactive' as any)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <Link href={`/dashboard/branches/${branch.id}`} className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit2 size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400">
                                            <Store size={48} className="mx-auto mb-4 opacity-20" />
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
