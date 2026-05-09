<?php $__env->startComponent('mail::message'); ?>
# Nueva reserva en tu restaurante 🎉

Hola **<?php echo new \Illuminate\Support\EncodedHtmlString($owner->name); ?>**, tienes una nueva reserva en **<?php echo new \Illuminate\Support\EncodedHtmlString($restaurant->name); ?>**.

<?php $__env->startComponent('mail::panel'); ?>
**👤 Cliente:** <?php echo new \Illuminate\Support\EncodedHtmlString($user->name); ?> (<?php echo new \Illuminate\Support\EncodedHtmlString($user->email); ?>)
**📅 Fecha y hora:** <?php echo new \Illuminate\Support\EncodedHtmlString(\Carbon\Carbon::parse($reservation->start_time)->locale('es')->isoFormat('dddd D [de] MMMM [de] YYYY [a las] HH:mm')); ?>

**👥 Personas:** <?php echo new \Illuminate\Support\EncodedHtmlString($reservation->guests); ?>

**🪑 Mesa:** <?php echo new \Illuminate\Support\EncodedHtmlString($table->name); ?>

<?php if($reservation->notes): ?>
**📝 Notas del cliente:** <?php echo new \Illuminate\Support\EncodedHtmlString($reservation->notes); ?>

<?php endif; ?>
**🔖 Código:** `RYA-<?php echo new \Illuminate\Support\EncodedHtmlString(str_pad($reservation->id, 6, '0', STR_PAD_LEFT)); ?>`
<?php echo $__env->renderComponent(); ?>

Recuerda confirmar la reserva desde tu panel de propietario si está pendiente.

<?php $__env->startComponent('mail::button', ['url' => config('app.url') . '/propietario', 'color' => 'primary']); ?>
Ver mis reservas
<?php echo $__env->renderComponent(); ?>

**ReservaYa** — Plataforma de reservas en Ibagué
<?php echo $__env->renderComponent(); ?>
<?php /**PATH C:\Users\Usuario\Desktop\reservaya-complete\backend\resources\views/emails/owner-new-reservation.blade.php ENDPATH**/ ?>