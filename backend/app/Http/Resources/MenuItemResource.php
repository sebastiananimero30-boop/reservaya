<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'restaurant_id'=> $this->restaurant_id,
            'name'         => $this->name,
            'description'  => $this->description,
            'category'     => $this->category,
            'price'        => (float) $this->price,
            'image_url'    => $this->image_url,
            'is_available' => (bool) $this->is_available,
            'sort_order'   => $this->sort_order,
        ];
    }
}
