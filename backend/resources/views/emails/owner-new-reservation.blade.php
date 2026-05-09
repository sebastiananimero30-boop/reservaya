@component('mail::message')
# Nueva reserva en tu restaurante 🎉

Hola **{{ $owner->name }}**, tienes una nueva reserva en **{{ $restaurant->name }}**.

@component('mail::panel')
**👤 Cliente:** {{ $user->name }} ({{ $user->email }})
**📅 Fecha y hora:** {{ \Carbon\Carbon::parse($reservation->start_time)->locale('es')->isoFormat('dddd D [de] MMMM [de] YYYY [a las] HH:mm') }}
**👥 Personas:** {{ $reservation->guests }}
**🪑 Mesa:** {{ $table->name }}
@if($reservation->notes)
**📝 Notas del cliente:** {{ $reservation->notes }}
@endif
**🔖 Código:** `RYA-{{ str_pad($reservation->id, 6, '0', STR_PAD_LEFT) }}`
@endcomponent

Recuerda confirmar la reserva desde tu panel de propietario si está pendiente.

@component('mail::button', ['url' => config('app.url') . '/propietario', 'color' => 'primary'])
Ver mis reservas
@endcomponent

**ReservaYa** — Plataforma de reservas en Ibagué
@endcomponent
