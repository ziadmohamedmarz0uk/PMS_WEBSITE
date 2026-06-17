<?php
namespace Modules\POS\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\POS\Models\Invoice;
use Modules\POS\Models\InvoiceItem;
use Modules\Inventory\Models\BranchInventory;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Models\User;
use Modules\Auth\Models\Branch;

class DashboardController extends Controller
{
    public function metrics(Request $request)
    {
        $user = auth()->user();

        // 1. Enforce strict RBAC for Cashiers
        if ($user->role === 'Cashier') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Cashiers cannot access dashboard metrics.'
            ], 403);
        }

        $isSuperAdmin = $user->role === 'SuperAdmin';
        $isManager = $user->role === 'BranchManager';

        $invoicesQuery = Invoice::query();
        $inventoryQuery = BranchInventory::query()->with('medicine');

        // Apply base branch restrictions
        if (!$isSuperAdmin) {
            $invoicesQuery->where('branch_id', $user->branch_id);
            $inventoryQuery->where('branch_id', $user->branch_id);
        }

        // Apply filters
        $branchFilter = $request->query('branch_id');
        $userFilter = $request->query('user_id');

        if ($isSuperAdmin && $branchFilter) {
            $invoicesQuery->where('branch_id', $branchFilter);
            $inventoryQuery->where('branch_id', $branchFilter);
        }

        if ($userFilter) {
            $canFilterUser = false;
            if ($isSuperAdmin) {
                $canFilterUser = true;
            } elseif ($isManager) {
                // Verify target user belongs to manager's branch
                $targetUser = User::find($userFilter);
                if ($targetUser && $targetUser->branch_id == $user->branch_id) {
                    $canFilterUser = true;
                }
            }

            if ($canFilterUser) {
                $invoicesQuery->whereHas('shift', function($q) use ($userFilter) {
                    $q->where('user_id', $userFilter);
                });
            }
        }

        // 1. Total Metrics (Today)
        $todayInvoices = (clone $invoicesQuery)->whereDate('created_at', Carbon::today());
        $totalSalesToday = $todayInvoices->count();
        $totalRevenueToday = $todayInvoices->sum('total_amount');

        $profitTodayQuery = InvoiceItem::query()
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('medicines', 'invoice_items.medicine_id', '=', 'medicines.id')
            ->whereDate('invoices.created_at', Carbon::today());
            
        if (!$isSuperAdmin) {
            $profitTodayQuery->where('invoices.branch_id', $user->branch_id);
        }
        if ($isSuperAdmin && $branchFilter) {
            $profitTodayQuery->where('invoices.branch_id', $branchFilter);
        }
        if ($userFilter) {
            $canFilterUser = false;
            if ($isSuperAdmin) {
                $canFilterUser = true;
            } elseif ($isManager) {
                $targetUser = User::find($userFilter);
                if ($targetUser && $targetUser->branch_id == $user->branch_id) {
                    $canFilterUser = true;
                }
            }
            if ($canFilterUser) {
                $profitTodayQuery->join('shifts', 'invoices.shift_id', '=', 'shifts.id')
                    ->where('shifts.user_id', $userFilter);
            }
        }

        $profitToday = $profitTodayQuery->select(DB::raw('
            SUM(
                invoice_items.subtotal - 
                (invoice_items.quantity * CASE WHEN invoice_items.is_sub_unit = 1 THEN (medicines.purchase_price / IFNULL(medicines.sub_units_per_box, 1)) ELSE medicines.purchase_price END)
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

            if (!$isSuperAdmin) {
                $dayProfitQuery->where('invoices.branch_id', $user->branch_id);
            }
            if ($isSuperAdmin && $branchFilter) {
                $dayProfitQuery->where('invoices.branch_id', $branchFilter);
            }
            if ($userFilter) {
                $canFilterUser = false;
                if ($isSuperAdmin) {
                    $canFilterUser = true;
                } elseif ($isManager) {
                    $targetUser = User::find($userFilter);
                    if ($targetUser && $targetUser->branch_id == $user->branch_id) {
                        $canFilterUser = true;
                    }
                }
                if ($canFilterUser) {
                    $dayProfitQuery->join('shifts', 'invoices.shift_id', '=', 'shifts.id')
                        ->where('shifts.user_id', $userFilter);
                }
            }
            
            $dayProfit = $dayProfitQuery->select(DB::raw('
                SUM(
                    invoice_items.subtotal - 
                    (invoice_items.quantity * CASE WHEN invoice_items.is_sub_unit = 1 THEN (medicines.purchase_price / IFNULL(medicines.sub_units_per_box, 1)) ELSE medicines.purchase_price END)
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

        if (!$isSuperAdmin) {
            $topSellingQuery->where('invoices.branch_id', $user->branch_id);
        }
        if ($isSuperAdmin && $branchFilter) {
            $topSellingQuery->where('invoices.branch_id', $branchFilter);
        }
        if ($userFilter) {
            $canFilterUser = false;
            if ($isSuperAdmin) {
                $canFilterUser = true;
            } elseif ($isManager) {
                $targetUser = User::find($userFilter);
                if ($targetUser && $targetUser->branch_id == $user->branch_id) {
                    $canFilterUser = true;
                }
            }
            if ($canFilterUser) {
                $topSellingQuery->join('shifts', 'invoices.shift_id', '=', 'shifts.id')
                    ->where('shifts.user_id', $userFilter);
            }
        }

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

        // 5. Filters & Breakdown Lists
        $usersList = [];
        $branchesList = [];
        $userBreakdown = [];

        if ($isSuperAdmin) {
            $branchesList = Branch::get(['id', 'name']);
            $usersList = User::whereIn('role', ['BranchManager', 'Cashier'])->get(['id', 'name', 'role', 'branch_id']);

            // Get performance breakdown for each manager and cashier
            $allEmployees = User::whereIn('role', ['BranchManager', 'Cashier'])->with('branch')->get();
            foreach ($allEmployees as $emp) {
                // Today's stats
                $empTodayInvoices = Invoice::whereHas('shift', function($q) use ($emp) {
                    $q->where('user_id', $emp->id);
                })->whereDate('created_at', Carbon::today());

                // This month's stats
                $empMonthInvoices = Invoice::whereHas('shift', function($q) use ($emp) {
                    $q->where('user_id', $emp->id);
                })->whereMonth('created_at', Carbon::now()->month)
                  ->whereYear('created_at', Carbon::now()->year);

                $userBreakdown[] = [
                    'id' => $emp->id,
                    'name' => $emp->name,
                    'role' => $emp->role,
                    'branch_id' => $emp->branch_id,
                    'branch_name' => $emp->branch ? $emp->branch->name : 'N/A',
                    'sales_today' => $empTodayInvoices->count(),
                    'revenue_today' => (float) $empTodayInvoices->sum('total_amount'),
                    'sales_month' => $empMonthInvoices->count(),
                    'revenue_month' => (float) $empMonthInvoices->sum('total_amount'),
                ];
            }
        } elseif ($isManager) {
            // Managers can only filter users in their own branch
            $usersList = User::where('branch_id', $user->branch_id)
                ->whereIn('role', ['BranchManager', 'Cashier'])
                ->get(['id', 'name', 'role', 'branch_id']);
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
                'users' => $usersList,
                'branches' => $branchesList,
                'user_breakdown' => $userBreakdown,
            ]
        ]);
    }
}
