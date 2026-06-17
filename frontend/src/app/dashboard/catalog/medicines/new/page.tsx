'use client';
import MedicineForm from '@/components/catalog/MedicineForm';
import { useTranslation } from '@/hooks/useTranslation';

export default function NewMedicinePage() {
    const { t, dir } = useTranslation();

    return (
        <div className="space-y-6 max-w-4xl mx-auto" dir={dir}>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t('add_medicine' as any)}</h1>
                <p className="text-slate-500 text-sm mt-1">Add a new medicine to your catalog and configure packaging</p>
            </div>
            
            <MedicineForm isEdit={false} />
        </div>
    );
}
