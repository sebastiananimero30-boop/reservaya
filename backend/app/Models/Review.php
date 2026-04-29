<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    use HasFactory;

    protected $fillable = ['restaurant_id', 'user_id', 'rating', 'comment'];

    protected function casts(): array
    {
        return ['rating' => 'integer'];
    }

    public function restaurant(): BelongsTo { return $this->belongsTo(Restaurant::class); }
    public function user(): BelongsTo       { return $this->belongsTo(User::class); }
}
