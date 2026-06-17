'use client';
import { useState, useEffect } from 'react';
import UserForm from '@/components/users/UserForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useParams } from 'next/navigation';
import axios from '@/lib/api/axios';
import { Loader2 } from 'lucide-react';

export default function EditUserPage() {
    const { t, dir } = useTranslation();
    const params = useParams();
    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchUser();
        }
    }, [params.id]);

    const fetchUser = async () => {
        try {
            const res = await axios.get(`/admin/users/${params.id}`);
            if (res.data.success) {
                setInitialData(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch user', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <Loader2 className="animate-spin w-8 h-8 mr-2" />
                {t('loading')}
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto" dir={dir}>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t('edit_user' as any)}</h1>
                <p className="text-slate-500 text-sm mt-1">Update details for {initialData?.name}</p>
            </div>
            
            <UserForm isEdit={true} initialData={initialData} />
        </div>
    );
}
