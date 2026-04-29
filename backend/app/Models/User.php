<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // ── Roles ──────────────────────────────────────────────────────────────────
    public function isAdmin(): bool    { return $this->role === 'admin'; }
    public function isOwner(): bool    { return $this->role === 'owner'; }
    public function isClient(): bool   { return $this->role === 'client'; }

    // ── Relaciones ─────────────────────────────────────────────────────────────
    public function restaurants(): HasMany
    {
        return $this->hasMany(Restaurant::class, 'owner_id');
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }
}
