<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ── Registro ───────────────────────────────────────────────────────────────

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Juan Test',
            'email'                 => 'juan@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);

        $this->assertDatabaseHas('users', ['email' => 'juan@test.com', 'role' => 'client']);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'existing@test.com']);

        $this->postJson('/api/auth/register', [
            'name'                  => 'Otro',
            'email'                 => 'existing@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(422);
    }

    public function test_register_fails_with_short_password(): void
    {
        $this->postJson('/api/auth/register', [
            'name'                  => 'Test',
            'email'                 => 'test@test.com',
            'password'              => '123',
            'password_confirmation' => '123',
        ])->assertStatus(422)
          ->assertJsonValidationErrors(['password']);
    }

    // ── Login ──────────────────────────────────────────────────────────────────

    public function test_user_can_login(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password123')]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['token', 'user']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('correct')]);

        $this->postJson('/api/auth/login', [
            'email'    => $user->email,
            'password' => 'wrong',
        ])->assertStatus(422);
    }

    public function test_login_fails_with_nonexistent_email(): void
    {
        $this->postJson('/api/auth/login', [
            'email'    => 'noexiste@test.com',
            'password' => 'password',
        ])->assertStatus(422);
    }

    // ── Me / Logout ────────────────────────────────────────────────────────────

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
             ->getJson('/api/auth/me')
             ->assertStatus(200)
             ->assertJsonPath('user.email', $user->email);
    }

    public function test_me_fails_without_token(): void
    {
        $this->getJson('/api/auth/me')
             ->assertStatus(401);
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();
        // Necesitamos un token real de Sanctum, no el TransientToken de actingAs()
        $token = $user->createToken('test-token')->plainTextToken;

        $this->withToken($token)
             ->postJson('/api/auth/logout')
             ->assertStatus(200)
             ->assertJsonPath('message', 'Sesión cerrada correctamente.');
    }
}
