<?php
namespace Modules\POS\Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Modules\Auth\Models\Branch;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Setup initial branches
        $this->branch1 = Branch::create(['name' => 'Branch 1', 'location' => 'Loc 1']);
        $this->branch2 = Branch::create(['name' => 'Branch 2', 'location' => 'Loc 2']);
    }

    public function test_cashier_cannot_access_dashboard_metrics()
    {
        $cashier = User::factory()->create([
            'role' => 'Cashier',
            'branch_id' => $this->branch1->id
        ]);

        $response = $this->actingAs($cashier)->getJson('/api/v1/pos/dashboard/metrics');

        $response->assertStatus(403);
        $response->assertJson([
            'success' => false,
            'message' => 'Unauthorized. Cashiers cannot access this module.'
        ]);
    }

    public function test_branch_manager_can_access_dashboard_metrics()
    {
        $manager = User::factory()->create([
            'role' => 'BranchManager',
            'branch_id' => $this->branch1->id
        ]);

        $response = $this->actingAs($manager)->getJson('/api/v1/pos/dashboard/metrics');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'total_sales_today',
                'total_revenue_today',
                'total_profit_today',
                'chart_data',
                'top_selling',
                'alerts',
                'users'
            ]
        ]);
    }

    public function test_super_admin_can_access_dashboard_metrics_with_filters()
    {
        $admin = User::factory()->create([
            'role' => 'SuperAdmin',
            'branch_id' => $this->branch1->id
        ]);

        $response = $this->actingAs($admin)->getJson('/api/v1/pos/dashboard/metrics');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'total_sales_today',
                'total_revenue_today',
                'total_profit_today',
                'chart_data',
                'top_selling',
                'alerts',
                'users',
                'branches',
                'user_breakdown'
            ]
        ]);
    }
}
