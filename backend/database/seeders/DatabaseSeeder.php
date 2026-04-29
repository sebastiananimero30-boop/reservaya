<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Reservation;
use App\Models\Restaurant;
use App\Models\RestaurantPhoto;
use App\Models\Review;
use App\Models\Schedule;
use App\Models\Table;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── GUARD IDEMPOTENTE: si ya hay datos no volver a insertar ──────────
        if (User::where('email', 'admin@reservaya.app')->exists()) {
            $this->command->warn('⏭️  Seed ya aplicado anteriormente — omitiendo.');
            return;
        }

        // ── 1. USUARIOS ───────────────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@reservaya.app'],
            [
                'name'     => 'Admin ReservaYa',
                'password' => Hash::make('admin123'),
                'role'     => 'admin',
                'phone'    => '+57 310 000 0001',
            ]
        );

        $owner = User::firstOrCreate(
            ['email' => 'owner@pizzeria.com'],
            [
                'name'     => 'Carlos Pizzero',
                'password' => Hash::make('owner123'),
                'role'     => 'owner',
                'phone'    => '+57 310 000 0002',
            ]
        );

        $owner2 = User::firstOrCreate(
            ['email' => 'owner2@reservaya.app'],
            [
                'name'     => 'María Restaurantera',
                'password' => Hash::make('owner123'),
                'role'     => 'owner',
                'phone'    => '+57 310 000 0003',
            ]
        );

        $client = User::firstOrCreate(
            ['email' => 'client@test.app'],
            [
                'name'     => 'Juan Cliente',
                'password' => Hash::make('client123'),
                'role'     => 'client',
                'phone'    => '+57 310 000 0004',
            ]
        );

        $extraClients = collect(range(1, 10))->map(fn ($i) => User::firstOrCreate(
            ['email' => "cliente{$i}@test.app"],
            [
                'name'     => "Cliente Demo {$i}",
                'password' => Hash::make('client123'),
                'role'     => 'client',
            ]
        ));

        // ── 2. CATEGORÍAS ─────────────────────────────────────────────────────
        $categoriesData = [
            ['name' => 'Italiana',    'slug' => 'italiana',    'icon' => '🍝'],
            ['name' => 'Peruana',     'slug' => 'peruana',     'icon' => '🍲'],
            ['name' => 'Japonesa',    'slug' => 'japonesa',    'icon' => '🍣'],
            ['name' => 'Americana',   'slug' => 'americana',   'icon' => '🍔'],
            ['name' => 'Mediterránea','slug' => 'mediterranea','icon' => '🥗'],
        ];

        $categories = collect($categoriesData)->map(
            fn ($c) => Category::firstOrCreate(['slug' => $c['slug']], $c)
        );
        $catMap = $categories->pluck('id', 'slug');

        // ── 3. RESTAURANTES (25) ──────────────────────────────────────────────
        $restaurantData = [
            ['Pizzería Bella Roma',   'italiana',    'Miraflores', -12.1219, -77.0282, $owner->id,  4.8],
            ['Trattoria del Centro',  'italiana',    'Centro',     -12.0464, -77.0428, $owner2->id, 4.5],
            ['La Nonna Felice',       'italiana',    'San Isidro', -12.0976, -77.0368, $owner->id,  4.6],
            ['Pasta e Vino',          'italiana',    'Barranco',   -12.1431, -77.0199, $owner2->id, 4.3],
            ['Il Forno',              'italiana',    'Surco',      -12.1369, -76.9837, $owner->id,  4.7],
            ['El Ceviche de Roberto', 'peruana',     'Centro',     -12.0504, -77.0302, $owner2->id, 4.9],
            ['Sabores del Perú',      'peruana',     'Miraflores', -12.1180, -77.0338, $owner->id,  4.7],
            ['La Huaca',              'peruana',     'San Isidro', -12.0905, -77.0427, $owner2->id, 4.6],
            ['Anticuchería La Fe',    'peruana',     'Breña',      -12.0645, -77.0502, $owner->id,  4.2],
            ['Mar y Tierra',          'peruana',     'Chorrillos', -12.1670, -77.0153, $owner2->id, 4.4],
            ['Sakura Sushi',          'japonesa',    'Miraflores', -12.1253, -77.0301, $owner->id,  4.8],
            ['Nikkei Fusion',         'japonesa',    'San Isidro', -12.0968, -77.0373, $owner2->id, 4.7],
            ['Tokyo Ramen',           'japonesa',    'Surquillo',  -12.1115, -77.0151, $owner->id,  4.5],
            ['Hanami',                'japonesa',    'Barranco',   -12.1448, -77.0207, $owner2->id, 4.6],
            ['Izakaya Lima',          'japonesa',    'Centro',     -12.0558, -77.0370, $owner->id,  4.3],
            ['Brooklyn Burger',       'americana',   'Miraflores', -12.1199, -77.0307, $owner2->id, 4.4],
            ['Texas BBQ',             'americana',   'Surco',      -12.1380, -76.9814, $owner->id,  4.3],
            ['The Smokehouse',        'americana',   'San Borja',  -12.1042, -77.0007, $owner2->id, 4.5],
            ['Diner 51',              'americana',   'Lince',      -12.0849, -77.0349, $owner->id,  4.1],
            ['Big Mac & More',        'americana',   'Barranco',   -12.1468, -77.0193, $owner2->id, 4.2],
            ['Ágora Griega',          'mediterranea','San Isidro', -12.0943, -77.0383, $owner->id,  4.7],
            ['La Côte Azur',          'mediterranea','Miraflores', -12.1162, -77.0324, $owner2->id, 4.8],
            ['El Olivo',              'mediterranea','Centro',     -12.0527, -77.0385, $owner->id,  4.5],
            ['Santorini Lima',        'mediterranea','Barranco',   -12.1412, -77.0215, $owner2->id, 4.6],
            ['Mezze House',           'mediterranea','Surco',      -12.1356, -76.9845, $owner->id,  4.4],
        ];

        $photoUrls = [
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
            'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
            'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800',
            'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
        ];

        $descriptions = [
            'Un espacio gastronómico donde cada plato es una obra de arte culinaria.',
            'Sabores auténticos en un ambiente cálido y acogedor para toda la familia.',
            'La mejor propuesta gastronómica de la ciudad con productos de primera calidad.',
            'Tradición y modernidad fusionadas en cada bocado de nuestra carta.',
            'El lugar perfecto para celebrar momentos especiales con la mejor gastronomía.',
        ];

        $streets = ['Principal', 'Larco', 'Pardo', 'República', 'La Mar'];

        $restaurants = collect($restaurantData)->map(function ($r, $i) use (
            $catMap, $photoUrls, $descriptions, $streets
        ) {
            [$name, $catSlug, $zone, $lat, $lng, $ownerId, $rating] = $r;

            $restaurant = Restaurant::firstOrCreate(
                ['name' => $name],
                [
                    'category_id' => $catMap[$catSlug],
                    'owner_id'    => $ownerId,
                    'description' => $descriptions[$i % count($descriptions)],
                    'address'     => 'Av. ' . $streets[$i % count($streets)] . ' ' . (100 + $i * 7) . ", {$zone}",
                    'zone'        => $zone,
                    'latitude'    => $lat,
                    'longitude'   => $lng,
                    'rating'      => $rating,
                    'capacity'    => 30 + ($i * 3),
                    'phone'       => '+57 ' . str_pad((310000010 + $i), 9, '0', STR_PAD_LEFT),
                    'is_active'   => true,
                ]
            );

            if ($restaurant->wasRecentlyCreated) {
                RestaurantPhoto::create([
                    'restaurant_id' => $restaurant->id,
                    'url'           => $photoUrls[$i % count($photoUrls)],
                    'is_cover'      => true,
                    'sort_order'    => 0,
                ]);
                RestaurantPhoto::create([
                    'restaurant_id' => $restaurant->id,
                    'url'           => $photoUrls[($i + 1) % count($photoUrls)],
                    'is_cover'      => false,
                    'sort_order'    => 1,
                ]);

                foreach (range(0, 6) as $day) {
                    Schedule::create([
                        'restaurant_id' => $restaurant->id,
                        'day_of_week'   => $day,
                        'open_time'     => ($day === 0) ? '12:00:00' : '11:00:00',
                        'close_time'    => ($day >= 5)  ? '23:59:00' : '23:00:00',
                        'is_closed'     => false,
                    ]);
                }
            }

            return $restaurant;
        });

        // ── 4. MESAS (50+) ────────────────────────────────────────────────────
        $tableTemplates = [
            ['Mesa Estándar', 2, 0],
            ['Mesa Estándar', 4, 0],
            ['Mesa Familiar', 6, 0],
            ['VIP',           4, 50],
            ['Terraza',       2, 0],
        ];

        $tables = collect();
        $restaurants->each(function ($restaurant, $i) use ($tableTemplates, &$tables) {
            $count = ($i % 3 === 0) ? 3 : 2;
            foreach (range(1, $count) as $j) {
                [$tName, $seats, $price] = $tableTemplates[($i + $j) % count($tableTemplates)];
                $table = Table::firstOrCreate(
                    ['restaurant_id' => $restaurant->id, 'name' => "{$tName} {$j}"],
                    ['seats' => $seats, 'price' => $price, 'is_active' => true]
                );
                $tables->push($table);
            }
        });

        // ── 5. RESEÑAS ────────────────────────────────────────────────────────
        $allClients = $extraClients->prepend($client);
        $comments = [
            'Excelente servicio y comida deliciosa. ¡Volveré sin duda!',
            'El ambiente es muy agradable y los platos llegan puntualmente.',
            'Buena relación calidad-precio. Lo recomiendo ampliamente.',
            'La atención fue muy amable y la comida superó mis expectativas.',
            'Un lugar especial para celebrar momentos especiales con la familia.',
        ];

        $restaurants->each(function ($restaurant, $i) use ($allClients, $comments) {
            if (! $restaurant->wasRecentlyCreated) return;
            $chosen = $allClients->random(min(3, $allClients->count()));
            foreach ($chosen as $j => $cl) {
                Review::firstOrCreate(
                    ['restaurant_id' => $restaurant->id, 'user_id' => $cl->id],
                    ['rating' => rand(4, 5), 'comment' => $comments[($i + $j) % count($comments)]]
                );
            }
        });

        // ── 6. RESERVAS (30) ──────────────────────────────────────────────────
        $statuses  = ['confirmed', 'confirmed', 'confirmed', 'pending', 'completed', 'cancelled'];
        $hours     = [12, 13, 14, 19, 20, 21];
        $usedSlots = [];
        $created   = 0;
        $tries     = 0;
        $driver    = DB::connection()->getDriverName(); // pgsql o sqlite

        while ($created < 30 && $tries < 300) {
            $tries++;
            $table     = $tables->random();
            $cl        = $allClients->random();
            $offset    = rand(-7, 14);
            $hour      = $hours[array_rand($hours)];
            $startTime = Carbon::now()->addDays($offset)->setHour($hour)->setMinute(0)->setSecond(0);

            $slot = $table->id . '_' . $startTime->format('Y-m-d_H');
            if (isset($usedSlots[$slot])) continue;

            $end = $startTime->copy()->addMinutes(90);

            // Consulta compatible con PostgreSQL y SQLite
            $overlapExpr = $driver === 'pgsql'
                ? "start_time + (duration_minutes * interval '1 minute') > ?"
                : "datetime(start_time, '+' || duration_minutes || ' minutes') > ?";

            $conflict = Reservation::where('table_id', $table->id)
                ->whereNotIn('status', ['cancelled'])
                ->where('start_time', '<', $end)
                ->whereRaw($overlapExpr, [$startTime])
                ->exists();

            if ($conflict) continue;

            $usedSlots[$slot] = true;

            try {
                Reservation::create([
                    'user_id'          => $cl->id,
                    'restaurant_id'    => $table->restaurant_id,
                    'table_id'         => $table->id,
                    'start_time'       => $startTime,
                    'duration_minutes' => 90,
                    'guests'           => rand(1, max(1, $table->seats - 1)),
                    'status'           => $statuses[array_rand($statuses)],
                    'notes'            => ($created % 3 === 0) ? 'Mesa cerca a la ventana.' : null,
                ]);
                $created++;
            } catch (\Exception) {
                continue;
            }
        }

        $this->command->info('✅ Seed completado:');
        $this->command->info('   👤 Usuarios:     ' . User::count());
        $this->command->info('   📂 Categorías:   ' . Category::count());
        $this->command->info('   🍽️  Restaurantes: ' . Restaurant::count());
        $this->command->info('   🪑 Mesas:        ' . Table::count());
        $this->command->info('   📅 Reservas:     ' . Reservation::count());
        $this->command->info('   ⭐ Reseñas:      ' . Review::count());
        $this->command->info('');
        $this->command->info('🔑 Credenciales:');
        $this->command->info('   admin@reservaya.app  / admin123');
        $this->command->info('   owner@pizzeria.com   / owner123');
        $this->command->info('   client@test.app      / client123');
    }
}