'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { usePosStore } from '@/store/usePosStore';
import api from '@/lib/api/axios';
import { Search, Plus, Minus, Trash2, CreditCard, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ItemAvailabilityModal from '@/components/pos/ItemAvailabilityModal';
import ReceiptPrint from '@/components/pos/ReceiptPrint';
import ExpenseModal from '@/components/pos/ExpenseModal';
import ReturnModal from '@/components/pos/ReturnModal';
import { DollarSign, RefreshCcw, LogOut, Globe } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function POSPage() {
    const user = useAuthStore((state) => state.user);
    const { cart, subtotal, discount_amount, discount_type, payment_method, total, heldCarts, addItem, removeItem, updateQuantity, toggleSubUnit, setDiscount, setPaymentMethod, clearCart, holdInvoice, restoreInvoice } = usePosStore();
    const router = useRouter();
    const { t, toggleLanguage, language, dir } = useTranslation();

    const [mounted, setMounted] = useState(false);
    const [inventory, setInventory] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [selectedMedicineForModal, setSelectedMedicineForModal] = useState<{id: number, name: string} | null>(null);
    const [invoiceForPrint, setInvoiceForPrint] = useState<any>(null);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [isShiftActive, setIsShiftActive] = useState(false);
    
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
        if (!user) {
            router.push('/login');
            return;
        }
        setIsShiftActive(localStorage.getItem('shift_active') === 'true');
        checkActiveShift();
        fetchInventory();
    }, [user, router]);

    const checkActiveShift = async () => {
        try {
            const res = await api.get('/shifts');
            const openShift = res.data.data?.find((s: any) => s.status === 'open' && s.user_id === user?.id);
            if (openShift) {
                setIsShiftActive(true);
                localStorage.setItem('shift_active', 'true');
            } else {
                setIsShiftActive(false);
                localStorage.setItem('shift_active', 'false');
            }
        } catch(e) {
            console.error('Failed to check active shift', e);
        }
    };

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const res = await api.get('/inventory');
            if (res.data.success) {
                setInventory(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch inventory', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'F4') {
                e.preventDefault();
                if (cart.length > 0) holdInvoice();
            } else if (e.key === 'F12' || (e.key === 'Enter' && e.ctrlKey)) {
                e.preventDefault();
                if (cart.length > 0) handleCheckout();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                clearCart();
            }
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (cart.length > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        const handleOffline = () => alert(t('offline_warning' as any) || 'You are offline. Please check your connection.');
        const handleOnline = () => alert(t('online_restored' as any) || 'Connection restored.');

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart]);

    const filteredInventory = inventory.filter(item => 
        item.medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.medicine.barcode.includes(searchQuery)
    );

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setCheckoutLoading(true);

        try {
            const payload = {
                items: cart.map(item => ({
                    medicine_id: item.medicine_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    is_sub_unit: item.is_sub_unit
                })),
                payment_method,
                discount_amount,
                discount_type
            };

            const res = await api.post('/pos/invoices', payload);
            if (res.data.success) {
                const printData = {
                    id: res.data.data.id || Math.floor(Math.random() * 90000) + 10000,
                    date: new Date().toLocaleString(),
                    cart: [...cart],
                    total: total,
                    cashierName: user?.name || 'Cashier',
                    branchName: `Branch ${user?.branch_id || 'Main'}`
                };
                
                setInvoiceForPrint(printData);
                
                // Wait for React to render the hidden receipt, then trigger print dialog
                setTimeout(() => {
                    window.print();
                    // Critical Flow: Clear cart ONLY after print completes or is cancelled
                    clearCart();
                    fetchInventory(); 
                    setSearchQuery('');
                    setInvoiceForPrint(null);
                    searchInputRef.current?.focus();
                }, 300);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || t('checkout_failed_msg' as any) || 'Checkout failed. Make sure you have started a shift first!');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const startShift = async () => {
        try {
            const cash = prompt(t('enter_opening_cash_msg' as any) || 'Enter opening cash amount ($):', '0');
            if (cash === null) return;
            const res = await api.post('/shifts/start', { opening_cash: parseFloat(cash) });
            if (res.data.success) {
                localStorage.setItem('shift_active', 'true');
                setIsShiftActive(true);
                alert(t('shift_started_msg' as any) || 'Shift started successfully! You can now checkout items.');
            }
        } catch (err: any) {
            const msg = err.response?.data?.message;
            if (msg === 'You already have an open shift.') {
                localStorage.setItem('shift_active', 'true');
                setIsShiftActive(true);
            }
            alert(msg || t('failed_to_start_shift' as any) || 'Failed to start shift');
        }
    };

    const endShift = async () => {
        try {
            const cash = prompt(t('enter_cash_msg'), '0');
            if (cash === null) return;
            const res = await api.post('/shifts/close', { actual_cash_submitted: parseFloat(cash) });
            if (res.data.success) {
                localStorage.setItem('shift_active', 'false');
                setIsShiftActive(false);
                alert(t('shift_ended_msg' as any) || 'Shift ended successfully.');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || t('failed_to_end_shift' as any) || 'Failed to end shift');
        }
    };

    const addToCart = (invItem: any) => {
        if (invItem.quantity <= 0) {
            alert(t('out_of_stock' as any) || 'Out of stock!');
            return;
        }
        addItem({
            medicine_id: invItem.medicine_id,
            name: invItem.medicine.name,
            barcode: invItem.medicine.barcode,
            unit_price: invItem.medicine.base_price,
            quantity: 1,
            expiry_status: invItem.expiry_status,
            box_max_quantity: invItem.quantity,
            has_sub_unit: invItem.medicine.has_sub_unit || false,
            is_sub_unit: false,
            sub_unit_price: invItem.medicine.sub_unit_price || 0,
            base_price: invItem.medicine.base_price,
            sub_units_per_box: invItem.medicine.sub_units_per_box || 1,
        });
        setSearchQuery('');
        searchInputRef.current?.focus();
    };

    if (!mounted || !user) return null;

    return (
        <>
            <ReceiptPrint invoiceData={invoiceForPrint} />
            
            <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden font-sans print:hidden" dir={dir}>
                {/* Left Area: Cart & Invoice */}
                <div className="w-full lg:w-[70%] h-[55%] lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 bg-white shadow-xl z-10">
                    <div className="p-3 lg:p-4 bg-slate-900 text-white flex justify-between items-center shadow-md overflow-x-auto">
                        <div>
                            <h1 className="text-xl font-black tracking-wider">{t('pms')} <span className="font-light">{t('pos')}</span></h1>
                            <p className="text-xs text-slate-400 mt-1 font-mono">{t('cashier')}: {user.name} | {t('branch')}: {user.branch_id}</p>
                        </div>
                        <div className="flex space-x-3 text-xs font-mono items-center" style={{ gap: '0.75rem' }}>
                            <button onClick={() => setShowReturnModal(true)} className="bg-slate-800 hover:bg-slate-700 text-blue-400 px-3 py-2 rounded-md font-bold transition-colors shadow-sm flex items-center border border-slate-700">
                                <RefreshCcw size={14} className={dir === 'rtl' ? 'ml-1' : 'mr-1'} /> {t('return')}
                            </button>
                            <button onClick={() => setShowExpenseModal(true)} className="bg-slate-800 hover:bg-slate-700 text-red-400 px-3 py-2 rounded-md font-bold transition-colors shadow-sm flex items-center border border-slate-700">
                                <DollarSign size={14} className={dir === 'rtl' ? 'ml-1' : 'mr-1'} /> {t('expense')}
                            </button>
                            <button onClick={() => { useAuthStore.getState().logout(); router.push('/login'); }} className="bg-slate-800 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-md font-bold transition-colors shadow-sm flex items-center border border-slate-700">
                                <LogOut size={14} className={dir === 'rtl' ? 'ml-1' : 'mr-1'} /> {t('logout')}
                            </button>
                            {isShiftActive ? (
                                <button onClick={endShift} className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-md font-bold transition-colors shadow-sm">
                                    {t('end_shift')}
                                </button>
                            ) : (
                                <button onClick={startShift} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-md font-bold transition-colors shadow-sm">
                                    {t('start_shift')}
                                </button>
                            )}
                            <button onClick={toggleLanguage} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-md font-bold transition-colors shadow-sm flex items-center border border-slate-700" title="Change Language">
                                <Globe size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-slate-50">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <CreditCard className="h-20 w-20 mb-6 text-slate-200" strokeWidth={1} />
                                <p className="text-xl font-light">{t('cart_empty')}</p>
                                <p className="text-sm mt-2">{t('scan_barcode_msg')}</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse" style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}>
                                <thead className="bg-white sticky top-0 shadow-sm z-10">
                                    <tr className="text-slate-500 text-xs lg:text-sm uppercase tracking-wider">
                                        <th className="py-2 lg:py-4 px-2 lg:px-6 font-medium">{t('item_description')}</th>
                                        <th className="hidden lg:table-cell py-4 px-6 font-medium text-center">{t('unit' as any)}</th>
                                        <th className="py-2 lg:py-4 px-2 lg:px-6 font-medium text-center">{t('quantity')}</th>
                                        <th className={`hidden md:table-cell py-4 px-6 font-medium ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{t('unit_price')}</th>
                                        <th className={`py-2 lg:py-4 px-2 lg:px-6 font-medium ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{t('subtotal')}</th>
                                        <th className="py-2 lg:py-4 px-2 lg:px-6 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {cart.map((item) => (
                                        <tr key={item.id} className="hover:bg-blue-50/50 transition-colors bg-white">
                                            <td className={`py-2 lg:py-4 px-2 lg:px-6 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                                                <div className="flex items-center">
                                                    <span className={`hidden lg:inline-block w-3 h-3 rounded-full ${dir === 'rtl' ? 'ml-4' : 'mr-4'} shadow-sm border border-white ${item.expiry_status === 'Red' ? 'bg-red-500' : item.expiry_status === 'Yellow' ? 'bg-yellow-400' : 'bg-emerald-500'}`}></span>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800 text-sm lg:text-lg leading-tight">{item.name}</span>
                                                        <p className="text-xs text-slate-400 font-mono mt-0.5">{item.barcode}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden lg:table-cell py-4 px-6">
                                                {item.has_sub_unit ? (
                                                    <button onClick={() => toggleSubUnit(item.id)} className={`text-sm font-black px-4 py-1.5 rounded-full shadow-sm transition-colors border w-full text-center ${item.is_sub_unit ? 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200' : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'}`}>
                                                        {item.is_sub_unit ? t('strip' as any) : t('box' as any)}
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-400 text-sm flex justify-center">-</span>
                                                )}
                                            </td>
                                            <td className="py-2 lg:py-4 px-2 lg:px-6">
                                                <div className="flex items-center justify-center space-x-1 lg:space-x-3 space-x-reverse bg-slate-50 rounded-full p-1 border border-slate-200 w-max mx-auto">
                                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 lg:p-1.5 rounded-full hover:bg-white hover:shadow-sm text-slate-600 transition-all"><Minus size={14} className="lg:w-4 lg:h-4"/></button>
                                                    <span className="font-bold w-4 lg:w-6 text-center text-sm lg:text-base text-slate-800">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 lg:p-1.5 rounded-full hover:bg-white hover:shadow-sm text-slate-600 transition-all"><Plus size={14} className="lg:w-4 lg:h-4"/></button>
                                                </div>
                                            </td>
                                            <td className={`hidden md:table-cell py-4 px-6 text-slate-600 font-medium ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{Number(item.unit_price).toFixed(2)} {t('currency' as any)}</td>
                                            <td className={`py-2 lg:py-4 px-2 lg:px-6 font-black text-slate-800 text-sm lg:text-lg ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{(item.quantity * item.unit_price).toFixed(2)}</td>
                                            <td className={`py-2 lg:py-4 px-2 lg:px-6 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>
                                                <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 lg:p-2 rounded-lg transition-colors">
                                                    <Trash2 size={16} className="lg:w-5 lg:h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="bg-white p-6 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col space-y-4 mb-6">
                            {/* Payment and Discount Row */}
                            <div className="flex space-x-4 bg-slate-50 p-4 rounded-xl border border-slate-200" style={{ gap: '1rem' }}>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('payment_method')}</label>
                                    <div className="flex space-x-2" style={{ gap: '0.5rem' }}>
                                        {['Cash', 'Visa', 'Wallet'].map(method => (
                                            <button 
                                                key={method}
                                                onClick={() => setPaymentMethod(method as any)}
                                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors border ${payment_method === method ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                                            >
                                                {t(method.toLowerCase() as any)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">{t('discount')}</label>
                                    <div className="flex space-x-2" style={{ gap: '0.5rem' }}>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={discount_amount || ''} 
                                            onChange={(e) => setDiscount(Number(e.target.value), discount_type)} 
                                            className={`w-1/2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                                            placeholder={t('discount')}
                                        />
                                        <select 
                                            value={discount_type} 
                                            onChange={(e) => setDiscount(discount_amount, e.target.value as any)}
                                            className={`w-1/2 px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-800 outline-none focus:border-blue-500 bg-white ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
                                        >
                                            <option value="fixed">{t('fixed')}</option>
                                            <option value="percentage">{t('percent')}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Totals Row */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-slate-500 text-lg font-medium">{t('total_items')} <span className={`font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full ${dir === 'rtl' ? 'mr-2' : 'ml-2'}`}>{cart.reduce((s,i)=>s+i.quantity,0)}</span></div>
                                    {heldCarts.length > 0 && (
                                        <div className="mt-3">
                                            <button onClick={() => restoreInvoice(0)} className="text-sm font-bold text-amber-600 hover:text-amber-700 underline flex items-center">
                                                <Clock size={14} className={dir === 'rtl' ? 'ml-1' : 'mr-1'} /> {t('restore_held_cart')} ({heldCarts.length})
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className={dir === 'rtl' ? 'text-left' : 'text-right'}>
                                    <p className="text-slate-500 font-medium">{t('subtotal')}: {subtotal.toFixed(2)} {t('currency' as any)}</p>
                                    <h2 className="text-5xl font-black text-slate-900 mt-2 tracking-tight">{total.toFixed(2)} {t('currency' as any)}</h2>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 lg:gap-4 mt-4">
                            <button onClick={clearCart} className="flex flex-col lg:flex-row items-center justify-center py-3 lg:py-5 bg-white border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 transition-all font-bold text-sm lg:text-lg group">
                                <XCircle className={`text-slate-400 group-hover:text-red-500 transition-colors ${dir === 'rtl' ? 'lg:ml-2 mb-1 lg:mb-0' : 'lg:mr-2 mb-1 lg:mb-0'}`} /> {t('cancel')} <span className="hidden lg:inline text-xs text-slate-400 font-mono ml-2">(ESC)</span>
                            </button>
                            <button onClick={holdInvoice} disabled={cart.length === 0} className="flex flex-col lg:flex-row items-center justify-center py-3 lg:py-5 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-700 hover:bg-amber-100 transition-all font-bold text-sm lg:text-lg disabled:opacity-50">
                                <Clock className={dir === 'rtl' ? 'lg:ml-2 mb-1 lg:mb-0' : 'lg:mr-2 mb-1 lg:mb-0'} /> {t('hold')} <span className="hidden lg:inline text-xs opacity-60 font-mono ml-2">(F4)</span>
                            </button>
                            <button onClick={handleCheckout} disabled={cart.length === 0 || checkoutLoading} className="flex flex-col lg:flex-row items-center justify-center py-3 lg:py-5 bg-blue-600 rounded-xl text-white hover:bg-blue-700 disabled:opacity-50 transition-all font-black text-sm lg:text-xl shadow-lg hover:shadow-blue-600/30">
                                <CreditCard className={dir === 'rtl' ? 'lg:ml-2 mb-1 lg:mb-0' : 'lg:mr-2 mb-1 lg:mb-0'} /> {t('checkout')} <span className="hidden lg:inline text-xs opacity-80 font-mono ml-2">(F12)</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Area: Search & Quick Items */}
                <div className="w-full lg:w-[30%] h-[45%] lg:h-full flex flex-col bg-slate-50 relative">
                    <div className="p-4 lg:p-6 border-b border-gray-200 bg-white shadow-sm z-10">
                        <div className="relative">
                            <div className={`absolute inset-y-0 ${dir === 'rtl' ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                                <Search className="h-6 w-6 text-blue-500" />
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`block w-full ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-slate-100 border-2 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-medium text-slate-800 placeholder:text-slate-400 outline-none`}
                                placeholder={t('search')}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('available_inventory')}</h3>
                        
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-blue-500">
                                <Loader2 className="animate-spin h-8 w-8 mb-4" />
                                <p className="text-sm font-medium">{t('syncing')}</p>
                            </div>
                        ) : filteredInventory.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                                {t('no_items_found')} "{searchQuery}"
                            </div>
                        ) : (
                            filteredInventory.map((item) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => addToCart(item)}
                                    className={`p-5 rounded-2xl cursor-pointer transition-all ${item.quantity > 0 ? 'bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10' : 'bg-slate-100 border border-slate-200 opacity-60 cursor-not-allowed grayscale-[50%]'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="pr-4">
                                            <h3 className="font-bold text-slate-800 leading-tight">{item.medicine.name}</h3>
                                            <p className="text-xs text-slate-400 font-mono mt-2 bg-slate-100 inline-block px-2 py-1 rounded">{item.medicine.barcode}</p>
                                        </div>
                                        <div className={dir === 'rtl' ? 'text-left' : 'text-right'}>
                                            <p className="font-black text-blue-600 text-lg">{Number(item.medicine.base_price).toFixed(2)} {t('currency' as any)}</p>
                                            <div className={`flex items-center ${dir === 'rtl' ? 'justify-start' : 'justify-end'} mt-2 space-x-1`}>
                                                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${item.expiry_status === 'Red' ? 'bg-red-500' : item.expiry_status === 'Yellow' ? 'bg-yellow-400' : 'bg-emerald-500'}`}></span>
                                                <p className={`text-xs font-bold ${dir === 'rtl' ? 'mr-1' : ''} ${item.quantity > 0 ? 'text-slate-500' : 'text-red-500'}`}>
                                                    {t('qty')}: {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {item.quantity === 0 && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                                            <div className="text-xs font-bold text-red-500 flex items-center">
                                                <AlertCircle size={14} className={dir === 'rtl' ? 'ml-1' : 'mr-1'} /> {t('out_of_stock')}
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setSelectedMedicineForModal({ id: item.medicine_id, name: item.medicine.name }); }}
                                                className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md font-semibold transition-colors flex items-center shadow-sm"
                                            >
                                                {t('find_alternatives')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {selectedMedicineForModal && (
                    <ItemAvailabilityModal 
                        medicineId={selectedMedicineForModal.id}
                        medicineName={selectedMedicineForModal.name}
                        onClose={() => setSelectedMedicineForModal(null)}
                        onAddToCart={addToCart}
                    />
                )}

                {showExpenseModal && (
                    <ExpenseModal 
                        onClose={() => setShowExpenseModal(false)}
                        onSuccess={() => alert('Expense recorded successfully!')}
                    />
                )}

                {showReturnModal && (
                    <ReturnModal 
                        onClose={() => setShowReturnModal(false)}
                        onSuccess={() => fetchInventory()}
                    />
                )}
            </div>
        </>
    );
}
