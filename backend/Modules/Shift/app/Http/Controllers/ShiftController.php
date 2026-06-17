<?php
namespace Modules\Shift\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Shift\Models\Shift;
use Modules\POS\Models\Invoice;
use Modules\Shift\Http\Resources\ShiftResource;
use Modules\Shift\Http\Requests\StartShiftRequest;
use Modules\Shift\Http\Requests\CloseShiftRequest;
use Exception;

class ShiftController extends Controller
{
    public function startShift(StartShiftRequest $request)
    {
        $user = auth()->user();
        
        // Check if already has open shift
        $existing = Shift::where('user_id', $user->id)->where('status', 'open')->first();
        if ($existing) {
            return response()->json(['success' => false, 'message' => 'You already have an open shift.'], 400);
        }

        $shift = Shift::create([
            'user_id' => $user->id,
            'branch_id' => $user->branch_id,
            'opening_cash' => $request->opening_cash,
            'start_time' => now(),
            'status' => 'open',
        ]);

        return response()->json([
            'success' => true,
            'data' => new ShiftResource($shift),
            'message' => 'Shift started successfully.'
        ]);
    }

    public function closeShift(CloseShiftRequest $request)
    {
        $user = auth()->user();
        $shift = Shift::where('user_id', $user->id)->where('status', 'open')->first();
        
        if (!$shift) {
            return response()->json(['success' => false, 'message' => 'No open shift found.'], 400);
        }

        // 1. Cash Sales
        $totalCashSales = Invoice::where('shift_id', $shift->id)
            ->where('status', 'finalized')
            ->where('payment_method', 'Cash')
            ->sum('total_amount'); // Changed from grand_total to total_amount

        // 2. Expenses
        $totalExpenses = \Modules\Shift\Models\Expense::where('shift_id', $shift->id)->sum('amount');

        // 3. Refunds (Cash Returns)
        $totalRefunds = \Modules\POS\Models\ReturnInvoice::where('shift_id', $shift->id)->sum('total_refund_amount');

        // 4. Expected Cash Calculation
        $expectedCash = $shift->opening_cash + $totalCashSales - $totalExpenses - $totalRefunds;

        $shift->update([
            'actual_cash_submitted' => $request->actual_cash_submitted,
            'expected_cash' => $expectedCash,
            'status' => 'closed',
            'end_time' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new ShiftResource($shift),
            'message' => 'Shift closed successfully.'
        ]);
    }


    public function index()
    {
        $user = auth()->user();
        $query = \Modules\Shift\Models\Shift::with('user')->orderBy('created_at', 'desc');
        if ($user->role === 'BranchManager') {
            $query->where('branch_id', $user->branch_id);
        }
        return ShiftResource::collection($query->get());
    }

}
