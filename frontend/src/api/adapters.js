/**
 * Adapta la respuesta del backend (inglés) al shape que usa el frontend (español).
 * RestaurantResource devuelve: id, name, description, address, zone, lat, lng,
 *   rating, category.name, photos, cover_photo, tables_count
 * El frontend espera: nombre, descripcion, direccion, zona, latitud, longitud,
 *   calificacion, total_resenas, categoria, precio, imagen, destacado, reservas_hoy
 */

export function adaptRestaurant(r) {
  if (!r) return null
  return {
    id:            r.id,
    owner_id:      r.owner_id ?? null,
    nombre:        r.name        ?? r.nombre,
    descripcion:   r.description ?? r.descripcion,
    direccion:     r.address     ?? r.direccion,
    zona:          r.zone        ?? r.zona,
    latitud:       r.lat         ?? r.latitud,
    longitud:      r.lng         ?? r.longitud,
    calificacion:  r.rating      ?? r.calificacion ?? 0,
    total_resenas: r.reviews_count ?? r.total_resenas ?? 0,
    categoria:     r.category?.name ?? r.categoria ?? '',
    categoria_slug:r.category?.slug ?? '',
    categoria_icon:r.category?.icon ?? '🍽️',
    precio:        r.price_range ?? r.precio ?? '$$',
    imagen:        r.cover_photo ?? r.imagen ?? null,
    foto_portada:  r.cover_photo ?? r.imagen ?? null,
    fotos:         r.photos      ?? r.fotos  ?? [],
    destacado:     r.is_featured ?? r.destacado ?? false,
    reservas_hoy:  r.today_reservations ?? r.reservas_hoy ?? 0,
    horario:       buildScheduleString(r.schedules) ?? r.horario ?? '',
    telefono:      r.phone       ?? r.telefono ?? '',
    capacidad:     r.capacity    ?? r.capacidad ?? 0,
    mesas_count:   r.tables_count ?? r.mesas_count ?? 0,
    personas_mesa: r.table_seats  ?? r.personas_mesa ?? '',
    // Mesas: el backend devuelve available_tables con TableResource
    mesas:         (r.available_tables ?? r.mesas ?? []).map(adaptTable),
    menu:          (r.menu ?? r.menu_items ?? []).map(adaptMenuItem),
    schedules:     r.schedules   ?? [],
  }
}

export function adaptMenuItem(item) {
  if (!item) return null
  return {
    id:            item.id,
    restaurant_id: item.restaurant_id,
    nombre:        item.name ?? item.nombre,
    descripcion:   item.description ?? item.descripcion ?? '',
    categoria:     item.category ?? item.categoria ?? 'General',
    precio:        item.price ?? item.precio ?? 0,
    imagen:        item.image_url ?? item.imagen ?? '',
    disponible:    item.is_available ?? item.disponible ?? true,
    orden:         item.sort_order ?? item.orden ?? 0,
  }
}

export function adaptTable(t) {
  if (!t) return null
  return {
    id:         t.id,
    numero:     t.number ?? t.numero ?? t.id,
    capacidad:  t.seats  ?? t.capacidad ?? 2,
    nombre:     t.name   ?? t.nombre   ?? `Mesa ${t.id}`,
    disponible: t.is_available ?? t.disponible ?? true,
    precio:     t.price  ?? t.precio ?? 0,
  }
}

export function adaptReservation(r) {
  if (!r) return null
  const restaurant = r.restaurant
    ? adaptRestaurant(r.restaurant)
    : (r.restaurant_name ? { id: r.restaurant_id, nombre: r.restaurant_name } : null)
  const mesa = r.table
    ? adaptTable(r.table)
    : (r.table_name ? { id: r.table_id, numero: r.table_name, nombre: r.table_name } : null)

  return {
    id:         r.id,
    code:       r.code ?? `RYA-${String(r.id).padStart(6, '0')}`,
    qr_code:    r.qr_code ?? null,
    restaurant,
    mesa,
    start_time: r.start_time,
    guests:     r.guests,
    notes:      r.notes ?? r.notas ?? '',
    estado:     normalizeStatus(r.status ?? r.estado),
    duration:   r.duration_minutes ?? 90,
    payment_provider: r.payment_provider ?? null,
    payment_status:   normalizePaymentStatus(r.payment_status),
    payment_amount:   r.payment_amount ?? null,
    payment_currency: r.payment_currency ?? 'usd',
    payment_paid_at:  r.payment_paid_at ?? null,
  }
}

function normalizeStatus(s) {
  const map = { confirmed: 'confirmada', pending: 'pendiente', cancelled: 'cancelada', completed: 'completada', no_show: 'no_presentada' }
  return map[s] ?? s ?? 'pendiente'
}

function normalizePaymentStatus(s) {
  const map = { paid: 'pagado', unpaid: 'sin_pagar', no_payment_required: 'sin_pago_requerido' }
  return map[s] ?? s ?? 'sin_pagar'
}

function buildScheduleString(schedules) {
  if (!schedules?.length) return null
  const days = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const open  = schedules.find(s => !s.is_closed)
  if (!open) return 'Cerrado'
  const openTime  = open.open?.slice(0,5)  ?? open.open_time?.slice(0,5)
  const closeTime = open.close?.slice(0,5) ?? open.close_time?.slice(0,5)
  return `Lun–Dom ${openTime}–${closeTime}`
}
