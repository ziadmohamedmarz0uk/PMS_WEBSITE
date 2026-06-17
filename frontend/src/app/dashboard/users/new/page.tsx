'use client';
import UserForm from '@/components/users/UserForm';
import { useTranslation } from '@/hooks/useTranslation';

export default function NewUserPage() {
    const { t, dir } = useTranslation();

    return (
        <div className="space-y-6 max-w-4xl mx-auto" dir={dir}>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t('add_user' as any)}</h1>
                <p className="text-slate-500 text-sm mt-1">Create a new staff account and assign roles</p>
            </div>
            
            <UserForm isEdit={false} />
        </div>
    );
}
