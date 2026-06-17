import { create } from 'zustand';

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    branch_id: number | null;
}

import Cookies from 'js-cookie';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: typeof window !== 'undefined' && localStorage.getItem('user_data') ? JSON.parse(localStorage.getItem('user_data') as string) : null,
    token: typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null,
    isAuthenticated: !!(typeof window !== 'undefined' ? localStorage.getItem('auth_token') : false),
    setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
            localStorage.setItem('user_data', JSON.stringify(user));
            Cookies.set('auth_token', token, { expires: 7 });
            Cookies.set('user_role', user.role, { expires: 7 });
        }
        set({ user, token, isAuthenticated: true });
    },
    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            Cookies.remove('auth_token');
            Cookies.remove('user_role');
        }
        set({ user: null, token: null, isAuthenticated: false });
    }
}));
