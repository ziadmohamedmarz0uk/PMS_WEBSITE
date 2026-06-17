import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface ReceiptProps {
    invoiceData: {
        id: number | string;
        date: string;
        cart: any[];
        total: number;
        cashierName: string;
        branchName: string;
    } | null;
}

export default function ReceiptPrint({ invoiceData }: ReceiptProps) {
    const { t, dir } = useTranslation();
    if (!invoiceData) return null;

    return (
        <div className="hidden print:block font-mono text-black bg-white w-full max-w-[80mm] text-sm leading-tight p-4 mx-auto">
            <style>{`
                @media print {
                    @page { margin: 0; size: 80mm auto; }
                    body { background: white; margin: 0; }
                }
            `}</style>
            
            <div className="text-center pb-4 border-b-2 border-dashed border-black mb-4">
                <h1 className="text-2xl font-bold uppercase tracking-widest">{invoiceData.branchName}</h1>
                <p className="text-sm mt-1 uppercase font-bold">{t('tax_invoice' as any)}</p>
                <div className="mt-4 text-xs space-y-1 text-center flex flex-col items-center">
                    <p>{t('date' as any)}: {invoiceData.date}</p>
                    <p>{t('invoice_num' as any)} {invoiceData.id}</p>
                    <p>{t('cashier_label' as any)} {invoiceData.cashierName}</p>
                </div>
            </div>

            <table className="w-full mb-4">
                <thead>
                    <tr className={`border-b-2 border-black text-xs uppercase ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        <th className="py-2">{t('item' as any)}</th>
                        <th className="py-2 text-center">{t('qty_label' as any)}</th>
                        <th className={`py-2 ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{t('total' as any)}</th>
                    </tr>
                </thead>
                <tbody className="text-xs">
                    {invoiceData.cart.map((item, index) => (
                        <tr key={index} className="border-b border-dotted border-gray-400">
                            <td className={`py-2 max-w-[35mm] ${dir === 'rtl' ? 'pl-2 text-right' : 'pr-2 text-left'}`}>
                                <div className="truncate">{item.name}</div>
                                <div className="text-[10px] mt-0.5">@{Number(item.unit_price).toFixed(2)}</div>
                            </td>
                            <td className="py-2 text-center align-top">{item.quantity}</td>
                            <td className={`py-2 font-bold align-top ${dir === 'rtl' ? 'text-left' : 'text-right'}`}>{(item.quantity * item.unit_price).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t-2 border-black pt-2 pb-4 mb-4 flex justify-between items-center">
                <p className="text-sm font-bold uppercase">{t('grand_total' as any)}</p>
                <p className="text-xl font-black">{invoiceData.total.toFixed(2)} {t('currency' as any)}</p>
            </div>

            <div className="text-center pt-4 border-t-2 border-dashed border-black">
                <p className="font-bold text-lg mb-1 uppercase">{t('thank_you' as any)}</p>
                <p className="text-[10px] mb-4 uppercase">{t('returns_policy' as any)}</p>
                {/* Dummy Barcode font simulation */}
                <div className="text-3xl font-bold tracking-[0.2em] opacity-80">*{invoiceData.id}*</div>
            </div>
        </div>
    );
}
