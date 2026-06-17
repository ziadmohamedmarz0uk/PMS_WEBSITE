'use client';
import BranchForm from '@/components/branches/BranchForm';
import { useTranslation } from '@/hooks/useTranslation';

export default function NewBranchPage() {
    const { t, dir } = useTranslation();

    return (
        <div className="space-y-6 max-w-4xl mx-auto" dir={dir}>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t('add_branch' as any)}</h1>
                <p className="text-slate-500 text-sm mt-1">Add a new branch to your pharmacy network</p>
            </div>
            
            <BranchForm isEdit={false} />
        </div>
    );
}
