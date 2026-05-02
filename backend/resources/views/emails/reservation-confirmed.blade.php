@component('mail::message')
# ¡Tu reserva está confirmada! 🎉

Hola **{{ $user->name }}**, tu mesa está reservada. Aquí están los detalles:

@component('mail::panel')
**🍽️ Restaurante:** {{ $restaurant->name }}
**📍 Dirección:** {{ $restaurant->address }}, {{ $restaurant->zone }}
**📅 Fecha y hora:** {{ \Carbon\Carbon::parse($reservation->start_time)->locale('es')->isoFormat('dddd D [de] MMMM [de] YYYY [a las] HH:mm') }}
**👥 Personas:** {{ $reservation->guests }}
**🪑 Mesa:** {{ $table->name }}
@if($reservation->notes)
**📝 Notas:** {{ $reservation->notes }}
@endif
@endcomponent

@if($reservation->qr_code)
## Tu código QR

Presenta este código al llegar al restaurante:

![]( {{ $reservation->qr_code }} )

**Código de reserva:** `RYA-{{ str_pad($reservation->id, 6, '0', STR_PAD_LEFT) }}`
@endif

@component('mail::button', ['url' => config('app.url') . '/mis-reservas', 'color' => 'primary'])
Ver mis reservas
@endcomponent

Si necesitas cancelar tu reserva, puedes hacerlo desde la plataforma hasta 1 hora antes.

Gracias por usar **ReservaYa** 🍴

*El equipo de ReservaYa — Ibagué, Colombia*
@endcomponent
