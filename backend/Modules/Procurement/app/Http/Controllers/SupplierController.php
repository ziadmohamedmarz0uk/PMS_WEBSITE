<?php

namespace Modules\Procurement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = \Modules\Procurement\Models\Supplier::all();
        return response()->json(['success' => true, 'data' => $suppliers]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string'
        ]);

        $supplier = \Modules\Procurement\Models\Supplier::create($validated);

        return response()->json([
            'success' => true,
            'data' => $supplier,
            'message' => 'Supplier created successfully.'
        ], 201);
    }
}
