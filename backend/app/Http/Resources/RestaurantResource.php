<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'owner_id'     => $this->owner_id,
            'description'  => $this->description,
            'address'      => $this->address,
            'zone'         => $this->zone,
            'lat'          => $this->latitude,
            'lng'          => $this->longitude,
            'rating'       => (float) $this->rating,
            'capacity'     => $this->capacity,
            'phone'        => $this->phone,
            'tables_count' => $this->tables_count ?? $this->tables()->where('is_active', true)->count(),
            'table_seats'  => $this->tables()->where('is_active', true)->orderBy('id')->value('seats'),
            'category'     => [
                'id'   => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
                'icon' => $this->category->icon,
            ],
            'photos'       => $this->photos->pluck('url'),
            'cover_photo'  => $this->photos->where('is_cover', true)->first()?->url
                              ?? $this->photos->first()?->url,
            'schedules'    => $this->whenLoaded('schedules', function () {
                return $this->schedules->map(fn ($s) => [
                    'day'       => $s->day_name,
                    'day_num'   => $s->day_of_week,
                    'open'      => $s->open_time,
                    'close'     => $s->close_time,
                    'is_closed' => $s->is_closed,
                ]);
            }),
            'available_tables' => $this->whenLoaded('availableTables', function () {
                return TableResource::collection($this->availableTables);
            }),
            'tables' => $this->whenLoaded('tables', function () {
                return TableResource::collection($this->tables->where('is_active', true)->sortBy('id')->values());
            }),
            'menu_items' => $this->whenLoaded('menuItems', function () {
                return MenuItemResource::collection($this->menuItems);
            }),
            'menu' => $this->whenLoaded('availableMenuItems', function () {
                return MenuItemResource::collection($this->availableMenuItems);
            }),
        ];
    }
}
