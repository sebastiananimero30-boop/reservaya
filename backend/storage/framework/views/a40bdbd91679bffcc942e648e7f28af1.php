<?php $__env->startComponent('mail::message'); ?>
# ¡Tu reserva está confirmada! 🎉

Hola **<?php echo new \Illuminate\Support\EncodedHtmlString($user->name); ?>**, tu mesa está reservada. Aquí están los detalles:

<?php $__env->startComponent('mail::panel'); ?>
**🍽️ Restaurante:** <?php echo new \Illuminate\Support\EncodedHtmlString($restaurant->name); ?>

**📍 Dirección:** <?php echo new \Illuminate\Support\EncodedHtmlString($restaurant->address); ?>, <?php echo new \Illuminate\Support\EncodedHtmlString($restaurant->zone); ?>

**📅 Fecha y hora:** <?php echo new \Illuminate\Support\EncodedHtmlString(\Carbon\Carbon::parse($reservation->start_time)->locale('es')->isoFormat('dddd D [de] MMMM [de] YYYY [a las] HH:mm')); ?>

**👥 Personas:** <?php echo new \Illuminate\Support\EncodedHtmlString($reservation->guests); ?>

**🪑 Mesa:** <?php echo new \Illuminate\Support\EncodedHtmlString($table->name); ?>

<?php if($reservation->notes): ?>
**📝 Notas:** <?php echo new \Illuminate\Support\EncodedHtmlString($reservation->notes); ?>

<?php endif; ?>
<?php echo $__env->renderComponent(); ?>

<?php if($reservation->qr_code): ?>
## Tu código QR

Presenta este código al llegar al restaurante:

![]( <?php echo new \Illuminate\Support\EncodedHtmlString($reservation->qr_code); ?> )

**Código de reserva:** `RYA-<?php echo new \Illuminate\Support\EncodedHtmlString(str_pad($reservation->id, 6, '0', STR_PAD_LEFT)); ?>`
<?php endif; ?>

<?php $__env->startComponent('mail::button', ['url' => config('app.url') . '/mis-reservas', 'color' => 'primary']); ?>
Ver mis reservas
<?php echo $__env->renderComponent(); ?>

Si necesitas cancelar tu reserva, puedes hacerlo desde la plataforma hasta 1 hora antes.

Gracias por usar **ReservaYa** 🍴

*El equipo de ReservaYa — Ibagué, Colombia*
<?php echo $__env->renderComponent(); ?>
<?php /**PATH C:\Users\Usuario\Desktop\reservaya-complete\backend\resources\views/emails/reservation-confirmed.blade.php ENDPATH**/ ?>