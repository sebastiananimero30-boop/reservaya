<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RestaurantPhoto extends Model
{
    protected $fillable = ['restaurant_id', 'url', 'is_cover', 'sort_order'];

    protected function casts(): array
    {
        return ['is_cover' => 'boolean'];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }
}
