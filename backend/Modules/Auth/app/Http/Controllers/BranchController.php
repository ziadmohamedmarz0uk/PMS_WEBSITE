<?php
namespace Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Auth\Models\Branch;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index()
    {
        $branches = Branch::all();
        return response()->json([
            'success' => true,
            'data' => $branches,
            'message' => 'Branches retrieved successfully.'
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'location' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:50',
            'status' => 'nullable|in:Active,Inactive',
        ]);

        $branch = Branch::create($validated);
        return response()->json([
            'success' => true,
            'data' => $branch,
            'message' => 'Branch created successfully.'
        ], 201);
    }

    public function show($id)
    {
        $branch = Branch::findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $branch,
            'message' => 'Branch retrieved successfully.'
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'location' => 'nullable|string|max:255',
            'contact_number' => 'nullable|string|max:50',
            'status' => 'nullable|in:Active,Inactive',
        ]);

        $branch = Branch::findOrFail($id);
        $branch->update($validated);
        
        return response()->json([
            'success' => true,
            'data' => $branch,
            'message' => 'Branch updated successfully.'
        ]);
    }
}
