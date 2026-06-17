<?php
namespace Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('branch')->get();
        return response()->json([
            'success' => true,
            'data' => $users,
            'message' => 'Users retrieved successfully.'
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:SuperAdmin,BranchManager,Cashier',
            'branch_id' => 'required|exists:branches,id',
        ]);

        $validated['password'] = Hash::make($validated['password']);

        $user = User::create($validated);
        $user->load('branch');

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User created successfully.'
        ], 201);
    }

    public function show($id)
    {
        $user = User::with('branch')->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User retrieved successfully.'
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:6',
            'role' => 'sometimes|in:SuperAdmin,BranchManager,Cashier',
            'branch_id' => 'sometimes|exists:branches,id',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);
        $user->load('branch');
        
        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'User updated successfully.'
        ]);
    }
}
