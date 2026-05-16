<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\RestaurantResource;
use App\Http\Resources\TableResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'code'            => 'RYA-' . str_pad($this->id, 6, '0', STR_PAD_LEFT),
            'restaurant_id'   => $this->restaurant_id,
            'restaurant_name' => $this->restaurant->name ?? null,
            'restaurant'      => $this->when(
                $this->relationLoaded('restaurant'),
                fn () => new RestaurantResource($this->restaurant)
            ),
            'table_id'        => $this->table_id,
            'table_name'      => $this->table->name ?? null,
            'table'           => $this->when(
                $this->relationLoaded('table'),
                fn () => new TableResource($this->table)
            ),
            'start_time'      => $this->start_time?->toIso8601String(),
            'duration_minutes'=> $this->duration_minutes,
            'guests'          => $this->guests,
            'status'          => $this->status,
            'notes'           => $this->notes,
            'qr_code'         => $this->qr_code,
            'payment_provider'=> $this->payment_provider,
            'payment_status'  => $this->payment_status,
            'payment_amount'  => $this->payment_amount,
            'payment_currency'=> $this->payment_currency,
            'payment_paid_at' => $this->payment_paid_at?->toIso8601String(),
            'created_at'      => $this->created_at?->toIso8601String(),
        ];
    }
}
