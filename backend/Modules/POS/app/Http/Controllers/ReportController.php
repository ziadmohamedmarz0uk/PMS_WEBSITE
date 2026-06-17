<?php
namespace Modules\POS\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\POS\Models\Invoice;
use Modules\POS\Models\InvoiceItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function vatReport(Request $request)
    {
        $user = auth()->user();
        $isManager = $user->role === 'BranchManager';
        $vatRate = 0.15; // 15% VAT assumption
        
        $query = Invoice::query();
        if ($isManager) {
            $query->where('branch_id', $user->branch_id);
        }
        
        if ($request->start_date && $request->end_date) {
            $query->whereBetween('created_at', [
                Carbon::parse($request->start_date)->startOfDay(), 
                Carbon::parse($request->end_date)->endOfDay()
            ]);
        } else {
            // Default to this month
            $query->whereMonth('created_at', Carbon::now()->month)
                  ->whereYear('created_at', Carbon::now()->year);
        }

        $totalSales = (clone $query)->sum('total_amount');
        
        // Calculate VAT backwards from Total (Total = Subtotal + VAT, VAT = Total - (Total / 1.15))
        $totalVat = $totalSales - ($totalSales / (1 + $vatRate));
        $taxableSales = $totalSales - $totalVat;

        // Daily breakdown
        $dailyBreakdown = (clone $query)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_amount) as daily_total'))
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get()
            ->map(function($item) use ($vatRate) {
                $vat = $item->daily_total - ($item->daily_total / (1 + $vatRate));
                return [
                    'date' => $item->date,
                    'total_sales' => round($item->daily_total, 2),
                    'taxable_amount' => round($item->daily_total - $vat, 2),
                    'vat_amount' => round($vat, 2)
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'vat_rate' => $vatRate * 100 . '%',
                'total_sales' => round($totalSales, 2),
                'taxable_sales' => round($taxableSales, 2),
                'total_vat' => round($totalVat, 2),
                'daily_breakdown' => $dailyBreakdown
            ]
        ]);
    }

    public function categoryProfitReport(Request $request)
    {
        $user = auth()->user();
        $isManager = $user->role === 'BranchManager';
        
        $query = InvoiceItem::query()
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('medicines', 'invoice_items.medicine_id', '=', 'medicines.id')
            ->leftJoin('categories', 'medicines.category_id', '=', 'categories.id');
            
        if ($isManager) {
            $query->where('invoices.branch_id', $user->branch_id);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('invoices.created_at', [
                Carbon::parse($request->start_date)->startOfDay(), 
                Carbon::parse($request->end_date)->endOfDay()
            ]);
        } else {
            $query->whereMonth('invoices.created_at', Carbon::now()->month)
                  ->whereYear('invoices.created_at', Carbon::now()->year);
        }

        $profits = $query->select(
            'categories.name as category_name',
            DB::raw('SUM(invoice_items.subtotal) as revenue'),
            DB::raw('SUM(invoice_items.subtotal - (invoice_items.quantity * IF(invoice_items.is_sub_unit = 1, (medicines.purchase_price / IFNULL(medicines.sub_units_per_box, 1)), medicines.purchase_price))) as profit')
        )
        ->groupBy('categories.id', 'categories.name')
        ->orderByDesc('profit')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $profits
        ]);
    }
}
