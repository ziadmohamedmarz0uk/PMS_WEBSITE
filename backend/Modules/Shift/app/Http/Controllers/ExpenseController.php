<?php

namespace Modules\Shift\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $user = auth()->user();
        $query = \Modules\Shift\Models\Expense::with(['shift.user', 'shift.branch'])->orderBy('created_at', 'desc');
        
        if ($user->role === 'BranchManager') {
            $query->where('branch_id', $user->branch_id);
        }
        
        return response()->json([
            'success' => true,
            'data' => $query->paginate(20)
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('shift::create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request) {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'reason' => 'required|string|max:255'
        ]);

        $user = auth()->user();
        
        $activeShift = \Modules\Shift\Models\Shift::where('user_id', $user->id)
            ->where('branch_id', $user->branch_id)
            ->where('status', 'open')
            ->first();

        if (!$activeShift) {
            return response()->json(['success' => false, 'message' => 'No active shift found.'], 400);
        }

        $expense = \Modules\Shift\Models\Expense::create([
            'shift_id' => $activeShift->id,
            'branch_id' => $user->branch_id,
            'amount' => $validated['amount'],
            'reason' => $validated['reason']
        ]);

        return response()->json(['success' => true, 'data' => $expense]);
    }
}
