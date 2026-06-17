'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Save, X, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/api/axios';

interface Category {
    id: number;
    name: string;
}

interface ActiveIngredient {
    id: number;
    name: string;
}

interface MedicineFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function MedicineForm({ initialData, isEdit }: MedicineFormProps) {
    const { t, dir } = useTranslation();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [ingredients, setIngredients] = useState<ActiveIngredient[]>([]);
    
    const [formData, setFormData] = useState({
        name: '',
        scientific_name: '',
        barcode: '',
        base_price: '',
        purchase_price: '',
        category_id: '',
        active_ingredient_id: '',
        has_sub_unit: false,
        sub_unit_name: '',
        sub_units_per_box: '',
        sub_unit_price: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDependencies();
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                scientific_name: initialData.scientific_name || '',
                barcode: initialData.barcode || '',
                base_price: initialData.base_price || '',
                purchase_price: initialData.purchase_price || '',
                category_id: initialData.category_id || '',
                active_ingredient_id: initialData.active_ingredient_id || '',
                has_sub_unit: initialData.has_sub_unit || false,
                sub_unit_name: initialData.sub_unit_name || '',
                sub_units_per_box: initialData.sub_units_per_box || '',
                sub_unit_price: initialData.sub_unit_price || '',
            });
        }
    }, [initialData]);

    const fetchDependencies = async () => {
        try {
            const [catRes, ingRes] = await Promise.all([
                axios.get('/catalog/categories'),
                axios.get('/catalog/active-ingredients')
            ]);
            if (catRes.data.success) setCategories(catRes.data.data);
            if (ingRes.data.success) setIngredients(ingRes.data.data);
        } catch (error) {
            console.error('Failed to fetch dependencies', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = { ...formData };
            if (!payload.has_sub_unit) {
                payload.sub_unit_name = '';
                payload.sub_units_per_box = '';
                payload.sub_unit_price = '';
            }

            if (isEdit) {
                await axios.put(`/catalog/medicines/${initialData.id}`, payload);
            } else {
                await axios.post('/catalog/medicines', payload);
            }
            router.push('/dashboard/catalog/medicines');
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
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Medicine Name <span className="text-red-500">*</span></label>
                        <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('scientific_name' as any)} <span className="text-red-500">*</span></label>
                        <input required type="text" name="scientific_name" value={formData.scientific_name} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('barcode' as any)} <span className="text-red-500">*</span></label>
                        <input required type="text" name="barcode" value={formData.barcode} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('category' as any)}</label>
                        <select name="category_id" value={formData.category_id} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                            <option value="">Select Category...</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('active_ingredient' as any)}</label>
                        <select name="active_ingredient_id" value={formData.active_ingredient_id} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                            <option value="">Select Active Ingredient...</option>
                            {ingredients.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Pricing & Packaging</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('purchase_price' as any)} <span className="text-red-500">*</span></label>
                        <input required type="number" step="0.01" name="purchase_price" value={formData.purchase_price} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">{t('base_price' as any)} (Box) <span className="text-red-500">*</span></label>
                        <input required type="number" step="0.01" name="base_price" value={formData.base_price} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <label className="flex items-center space-x-3 space-x-reverse cursor-pointer mb-4">
                        <input type="checkbox" name="has_sub_unit" checked={formData.has_sub_unit} onChange={handleChange} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span className="font-bold text-slate-800 text-lg">{t('has_sub_unit' as any)}</span>
                    </label>

                    {formData.has_sub_unit && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-200">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('sub_unit_name' as any)} <span className="text-red-500">*</span></label>
                                <input required={formData.has_sub_unit} type="text" name="sub_unit_name" value={formData.sub_unit_name} onChange={handleChange} placeholder="e.g. Strip" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('sub_units_per_box' as any)} <span className="text-red-500">*</span></label>
                                <input required={formData.has_sub_unit} type="number" name="sub_units_per_box" value={formData.sub_units_per_box} onChange={handleChange} placeholder="e.g. 3" className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('sub_unit_price' as any)} <span className="text-red-500">*</span></label>
                                <input required={formData.has_sub_unit} type="number" step="0.01" name="sub_unit_price" value={formData.sub_unit_price} onChange={handleChange} className="w-full border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                            </div>
                        </div>
                    )}
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
