'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/api/axios';

interface BranchFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function BranchForm({ initialData, isEdit }: BranchFormProps) {
    const { t, dir } = useTranslation();
    const router = useRouter();
    
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        contact_number: '',
        status: 'Active',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                location: initialData.location || '',
                contact_number: initialData.contact_number || '',
                status: initialData.status || 'Active',
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isEdit) {
                await axios.put(`/admin/branches/${initialData.id}`, formData);
            } else {
                await axios.post('/admin/branches', formData);
            }
            router.push('/dashboard/branches');
        } catch (err: any) {
            setError(err.response?.data?.message || 'An error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8" dir={dir}>
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Branch Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('name' as any)} <span className="text-red-500">*</span></label>
                        <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('contact_number' as any)}</label>
                        <input type="text" name="contact_number" value={formData.contact_number} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('location' as any)}</label>
                        <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('status' as any)}</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                            <option value="Active">{t('active' as any)}</option>
                            <option value="Inactive">{t('inactive' as any)}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end space-x-4 space-x-reverse">
                <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-colors">
                    {t('cancel')}
                </button>
                <button type="submit" disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-md shadow-blue-500/20 transition-colors disabled:opacity-50 flex items-center space-x-2 space-x-reverse">
                    <Save size={20} />
                    <span>{loading ? t('loading') : t('save')}</span>
                </button>
            </div>
        </form>
    );
}
