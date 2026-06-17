'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/api/axios';

interface Branch {
    id: number;
    name: string;
}

interface UserFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function UserForm({ initialData, isEdit }: UserFormProps) {
    const { t, dir } = useTranslation();
    const router = useRouter();
    const [branches, setBranches] = useState<Branch[]>([]);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'Cashier',
        branch_id: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchBranches = async () => {
        try {
            const res = await axios.get('/admin/branches');
            if (res.data.success) {
                setBranches(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch branches', error);
        }
    };

    useEffect(() => {
        fetchBranches();
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                email: initialData.email || '',
                password: '', // Do not populate password on edit
                role: initialData.role || 'Cashier',
                branch_id: initialData.branch_id || '',
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
            const payload = { ...formData };
            if (isEdit && !payload.password) {
                delete (payload as any).password;
            }

            if (isEdit) {
                await axios.put(`/admin/users/${initialData.id}`, payload);
            } else {
                await axios.post('/admin/users', payload);
            }
            router.push('/dashboard/users');
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
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">User Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('name' as any)} <span className="text-red-500">*</span></label>
                        <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('email' as any)} <span className="text-red-500">*</span></label>
                        <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            {t('password' as any)} {!isEdit && <span className="text-red-500">*</span>}
                        </label>
                        <input required={!isEdit} type="password" name="password" value={formData.password} onChange={handleChange} placeholder={isEdit ? "Leave blank to keep current" : ""} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('role' as any)} <span className="text-red-500">*</span></label>
                        <select required name="role" value={formData.role} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                            <option value="Cashier">Cashier</option>
                            <option value="BranchManager">Branch Manager</option>
                            <option value="SuperAdmin">Super Admin</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('branch' as any)} <span className="text-red-500">*</span></label>
                        <select required name="branch_id" value={formData.branch_id} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                            <option value="">Select Branch...</option>
                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
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
