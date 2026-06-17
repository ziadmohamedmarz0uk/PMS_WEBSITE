import { create } from 'zustand';

export interface CartItem {
    id: string; // Composite ID: {medicine_id}_{box|strip}
    medicine_id: number;
    name: string;
    barcode: string;
    unit_price: number;
    quantity: number;
    expiry_status: 'Green' | 'Yellow' | 'Red';
    max_quantity: number;
    box_max_quantity: number;
    has_sub_unit: boolean;
    is_sub_unit: boolean;
    sub_unit_price: number;
    base_price: number;
    sub_units_per_box: number;
}

interface PosState {
    cart: CartItem[];
    subtotal: number;
    discount_amount: number;
    discount_type: 'fixed' | 'percentage';
    payment_method: 'Cash' | 'Visa' | 'Wallet';
    total: number;
    heldCarts: any[];
    addItem: (item: Omit<CartItem, 'id' | 'max_quantity'>) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, qty: number) => void;
    toggleSubUnit: (id: string) => void;
    setDiscount: (amount: number, type: 'fixed' | 'percentage') => void;
    setPaymentMethod: (method: 'Cash' | 'Visa' | 'Wallet') => void;
    clearCart: () => void;
    holdInvoice: () => void;
    restoreInvoice: (index: number) => void;
}

const calculateTotals = (cart: CartItem[], discount_amount: number, discount_type: 'fixed' | 'percentage') => {
    const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    let total = subtotal;
    if (discount_type === 'fixed') {
        total = Math.max(0, subtotal - discount_amount);
    } else if (discount_type === 'percentage') {
        total = Math.max(0, subtotal - (subtotal * discount_amount / 100));
    }
    return { subtotal, total };
};

export const usePosStore = create<PosState>((set) => ({
    cart: [],
    subtotal: 0,
    discount_amount: 0,
    discount_type: 'fixed',
    payment_method: 'Cash',
    total: 0,
    heldCarts: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('held_carts') || '[]') : [],
    addItem: (newItem) => set((state) => {
        const id = `${newItem.medicine_id}_${newItem.is_sub_unit ? 'strip' : 'box'}`;
        const max_quantity = newItem.is_sub_unit ? (newItem.box_max_quantity * (newItem.sub_units_per_box || 1)) : newItem.box_max_quantity;
        const existingItemIndex = state.cart.findIndex((i) => i.id === id);
        
        let updatedCart = [...state.cart];
        if (existingItemIndex !== -1) {
            updatedCart[existingItemIndex] = {
                ...updatedCart[existingItemIndex],
                quantity: Math.min(updatedCart[existingItemIndex].quantity + 1, updatedCart[existingItemIndex].max_quantity)
            };
        } else {
            updatedCart.push({ ...newItem, id, max_quantity, quantity: 1 });
        }
        return { cart: updatedCart, ...calculateTotals(updatedCart, state.discount_amount, state.discount_type) };
    }),
    removeItem: (id) => set((state) => {
        const updatedCart = state.cart.filter((i) => i.id !== id);
        return { cart: updatedCart, ...calculateTotals(updatedCart, state.discount_amount, state.discount_type) };
    }),
    updateQuantity: (id, qty) => set((state) => {
        if (qty <= 0) {
            const updatedCart = state.cart.filter((i) => i.id !== id);
            return { cart: updatedCart, ...calculateTotals(updatedCart, state.discount_amount, state.discount_type) };
        }
        const updatedCart = state.cart.map((i) =>
            i.id === id ? { ...i, quantity: Math.min(qty, i.max_quantity) } : i
        );
        return { cart: updatedCart, ...calculateTotals(updatedCart, state.discount_amount, state.discount_type) };
    }),
    toggleSubUnit: (id) => set((state) => {
        const itemIndex = state.cart.findIndex(i => i.id === id);
        if (itemIndex === -1) return state;
        const item = state.cart[itemIndex];
        if (!item.has_sub_unit) return state;

        const newIsSubUnit = !item.is_sub_unit;
        const newId = `${item.medicine_id}_${newIsSubUnit ? 'strip' : 'box'}`;
        const newMaxQuantity = newIsSubUnit ? (item.box_max_quantity * (item.sub_units_per_box || 1)) : item.box_max_quantity;

        const existingTargetIndex = state.cart.findIndex(i => i.id === newId);
        let updatedCart = [...state.cart];

        if (existingTargetIndex !== -1) {
            updatedCart[existingTargetIndex].quantity = Math.min(updatedCart[existingTargetIndex].quantity + item.quantity, updatedCart[existingTargetIndex].max_quantity);
            updatedCart.splice(itemIndex, 1);
        } else {
            updatedCart[itemIndex] = {
                ...item,
                id: newId,
                is_sub_unit: newIsSubUnit,
                unit_price: newIsSubUnit ? item.sub_unit_price : item.base_price,
                max_quantity: newMaxQuantity,
                quantity: Math.min(item.quantity, newMaxQuantity)
            };
        }
        return { cart: updatedCart, ...calculateTotals(updatedCart, state.discount_amount, state.discount_type) };
    }),
    setDiscount: (amount, type) => set((state) => ({
        discount_amount: amount,
        discount_type: type,
        ...calculateTotals(state.cart, amount, type)
    })),
    setPaymentMethod: (method) => set({ payment_method: method }),
    clearCart: () => set({ cart: [], subtotal: 0, discount_amount: 0, discount_type: 'fixed', total: 0 }),
    holdInvoice: () => set((state) => {
        if (state.cart.length === 0) return state;
        const newHeld = [...state.heldCarts, { cart: state.cart, timestamp: new Date().toISOString() }];
        if (typeof window !== 'undefined') localStorage.setItem('held_carts', JSON.stringify(newHeld));
        return { cart: [], subtotal: 0, discount_amount: 0, discount_type: 'fixed', total: 0, heldCarts: newHeld };
    }),
    restoreInvoice: (index) => set((state) => {
        const target = state.heldCarts[index];
        if (!target) return state;
        const newHeld = state.heldCarts.filter((_, i) => i !== index);
        if (typeof window !== 'undefined') localStorage.setItem('held_carts', JSON.stringify(newHeld));
        return { cart: target.cart, heldCarts: newHeld, ...calculateTotals(target.cart, state.discount_amount, state.discount_type) };
    })
}));
