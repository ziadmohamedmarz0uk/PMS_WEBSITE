<?php
namespace Modules\POS\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\POS\Models\Invoice;
use Modules\POS\Models\InvoiceItem;
use Modules\Inventory\Models\BranchInventory;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function metrics()
    {
        $user = auth()->user();
        $isManager = $user->role === 'BranchManager';

        $invoicesQuery = Invoice::query();
        $inventoryQuery = BranchInventory::query()->with('medicine');

        if ($isManager) {
            $invoicesQuery->where('branch_id', $user->branch_id);
            $inventoryQuery->where('branch_id', $user->branch_id);
        }

        // 1. Total Metrics (Today)
        $todayInvoices = (clone $invoicesQuery)->whereDate('created_at', Carbon::today());
        $totalSalesToday = $todayInvoices->count();
        $totalRevenueToday = $todayInvoices->sum('total_amount');

        $profitTodayQuery = InvoiceItem::query()
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('medicines', 'invoice_items.medicine_id', '=', 'medicines.id')
            ->whereDate('invoices.created_at', Carbon::today());
            
        if ($isManager) {
            $profitTodayQuery->where('invoices.branch_id', $user->branch_id);
        }

        $profitToday = $profitTodayQuery->select(DB::raw('
            SUM(
                invoice_items.subtotal - 
                (invoice_items.quantity * IF(invoice_items.is_sub_unit = 1, (medicines.purchase_price / IFNULL(medicines.sub_units_per_box, 1)), medicines.purchase_price))
            ) as total_profit
        '))->value('total_profit');

        // 2. Revenue & Profit Chart (Last 7 Days)
        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dayRevenue = (clone $invoicesQuery)->whereDate('created_at', $date)->sum('total_amount');
            
            $dayProfitQuery = InvoiceItem::query()
                ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
                ->join('medicines', 'invoice_items.medicine_id', '=', 'medicines.id')
                ->whereDate('invoices.created_at', $date);
            if ($isManager) $dayProfitQuery->where('invoices.branch_id', $user->branch_id);
            
            $dayProfit = $dayProfitQuery->select(DB::raw('
                SUM(
                    invoice_items.subtotal - 
                    (invoice_items.quantity * IF(invoice_items.is_sub_unit = 1, (medicines.purchase_price / IFNULL(medicines.sub_units_per_box, 1)), medicines.purchase_price))
                ) as profit
            '))->value('profit');

            $chartData[] = [
                'date' => $date->format('M d'),
                'revenue' => (float) $dayRevenue,
                'profit' => (float) ($dayProfit ?? 0)
            ];
        }

        // 3. Top Selling Medicines (This Month)
        $topSellingQuery = InvoiceItem::query()
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('medicines', 'invoice_items.medicine_id', '=', 'medicines.id')
            ->whereMonth('invoices.created_at', Carbon::now()->month)
            ->whereYear('invoices.created_at', Carbon::now()->year);
        if ($isManager) $topSellingQuery->where('invoices.branch_id', $user->branch_id);

        $topSelling = $topSellingQuery->select('medicines.name', DB::raw('SUM(invoice_items.quantity) as total_sold'))
            ->groupBy('medicines.id', 'medicines.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        // 4. Alerts
        $shortages = (clone $inventoryQuery)->where('quantity', '<=', 5)->get();
        $expiring = (clone $inventoryQuery)->where('quantity', '>', 0)->where('expiry_date', '<=', now()->addDays(90))->get();

        $alerts = [];
        foreach ($shortages as $s) {
            $alerts[] = [
                'type' => 'shortage', 
                'message' => "Low stock: {$s->medicine->name} ({$s->quantity} left)",
                'medicine_name' => $s->medicine->name,
                'quantity' => $s->quantity
            ];
        }
        foreach ($expiring as $e) {
            $alerts[] = [
                'type' => 'expiring', 
                'message' => "Expiring soon: {$e->medicine->name} (on {$e->expiry_date})",
                'medicine_name' => $e->medicine->name,
                'date' => Carbon::parse($e->expiry_date)->format('Y-m-d')
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'total_sales_today' => $totalSalesToday,
                'total_revenue_today' => (float) $totalRevenueToday,
                'total_profit_today' => (float) ($profitToday ?? 0),
                'chart_data' => $chartData,
                'top_selling' => $topSelling,
                'alerts' => array_slice($alerts, 0, 10),
                'expiring_count' => $expiring->count(),
                'shortages_count' => $shortages->count(),
            ]
        ]);
    }
}
