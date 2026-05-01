<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\MenuItem;
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
        if (User::where('email', 'admin@reservaya.app')->exists()) {
            $this->command->warn('⏭️  Seed ya aplicado anteriormente — omitiendo.');
            return;
        }

        // ── 1. USUARIOS ───────────────────────────────────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@reservaya.app'],
            ['name' => 'Admin ReservaYa', 'password' => Hash::make('admin123'), 'role' => 'admin', 'phone' => '+57 310 000 0001']
        );
        $owner = User::firstOrCreate(
            ['email' => 'owner@pizzeria.com'],
            ['name' => 'Carlos Dueño', 'password' => Hash::make('owner123'), 'role' => 'owner', 'phone' => '+57 310 000 0002']
        );
        $owner2 = User::firstOrCreate(
            ['email' => 'owner2@reservaya.app'],
            ['name' => 'María Restaurantera', 'password' => Hash::make('owner123'), 'role' => 'owner', 'phone' => '+57 310 000 0003']
        );
        $client = User::firstOrCreate(
            ['email' => 'client@test.app'],
            ['name' => 'Juan Cliente', 'password' => Hash::make('client123'), 'role' => 'client', 'phone' => '+57 310 000 0004']
        );
        $extraClients = collect(range(1, 10))->map(fn ($i) => User::firstOrCreate(
            ['email' => "cliente{$i}@test.app"],
            ['name' => "Cliente Demo {$i}", 'password' => Hash::make('client123'), 'role' => 'client']
        ));

        // ── 2. CATEGORÍAS ─────────────────────────────────────────────────────
        $categoriesData = [
            ['name' => 'Típica & Regional', 'slug' => 'tipica',        'icon' => '🍲'],
            ['name' => 'Italiana',          'slug' => 'italiana',      'icon' => '🍝'],
            ['name' => 'Mar & Fusión',      'slug' => 'mar-fusion',    'icon' => '🦞'],
            ['name' => 'Carnes & Parrilla', 'slug' => 'parrilla',      'icon' => '🥩'],
            ['name' => 'Internacional',     'slug' => 'internacional',  'icon' => '🌍'],
            ['name' => 'Comida Rápida',     'slug' => 'rapida',        'icon' => '🍔'],
        ];
        $categories = collect($categoriesData)->map(
            fn ($c) => Category::firstOrCreate(['slug' => $c['slug']], $c)
        );
        $catMap = $categories->pluck('id', 'slug');

        // ── 3. RESTAURANTES REALES DE IBAGUÉ ──────────────────────────────────
        // [nombre, slug_categoria, zona, lat, lng, owner_id, rating, direccion, telefono, descripcion]
        $restaurantData = [
            [
                'La Comarca Típico',
                'tipica',
                'Picaleña',
                4.4389, -75.1823,
                $owner->id, 4.7,
                'Sector Picaleña, vía al aeropuerto, Ibagué',
                '+57 318 456 7890',
                'Un lugar tradicional en el sector de Picaleña, ideal para disfrutar de platos auténticos como la lechona y el tamal tolimense en un ambiente campestre. La experiencia más genuina de la cocina tolimense.',
            ],
            [
                'El Carnaval del Pollo',
                'tipica',
                'Mirolindo',
                4.4412, -75.2156,
                $owner2->id, 4.5,
                'Avenida Mirolindo, Ibagué',
                '+57 312 345 6789',
                'Muy popular por su pollo asado y platos típicos tolimenses. Con varias sedes en la ciudad, es el favorito de las familias ibaguereñas para el almuerzo del fin de semana.',
            ],
            [
                'La Ricotta Trattoria',
                'italiana',
                'El Vergel',
                4.4521, -75.2089,
                $owner->id, 4.8,
                'Barrio El Vergel, Ibagué',
                '+57 315 678 9012',
                'Ubicada en El Vergel, ofrece pastas artesanales y pizzas en un ambiente acogedor. Es muy recomendada para cenas en pareja o celebraciones especiales. Sus pastas se elaboran diariamente con harina importada.',
            ],
            [
                'Mi Trattoria',
                'italiana',
                'La Pola',
                4.4398, -75.2201,
                $owner2->id, 4.6,
                'Barrio La Pola, Ibagué',
                '+57 317 890 1234',
                'Situada en el barrio La Pola, destaca por su decoración rústica y sabores auténticos que transportan a Italia. Su risotto de hongos y la tiramisú casera son los platos más solicitados.',
            ],
            [
                'María y el Mar',
                'mar-fusion',
                'La Macarena',
                4.4467, -75.2134,
                $owner->id, 4.9,
                'La Macarena parte alta, Ibagué',
                '+57 316 012 3456',
                'En la Macarena parte alta, se especializa en cocina peruana y del Pacífico. Reconocido por sus ceviches y platos fusión de alta calidad. El ceviche clásico y el tiradito de atún son imperdibles.',
            ],
            [
                'Sakana Sushi Fusión',
                'mar-fusion',
                'El Vergel',
                4.4534, -75.2076,
                $owner2->id, 4.7,
                'Barrio El Vergel, Ibagué',
                '+57 319 234 5678',
                'Una de las opciones más destacadas para los amantes del sushi y la comida asiática con toques creativos. Sus rolls especiales con ingredientes locales son una experiencia única en Ibagué.',
            ],
            [
                'Tango Pasión por la Carne',
                'parrilla',
                'La Macarena',
                4.4478, -75.2118,
                $owner->id, 4.8,
                'La Macarena, Ibagué',
                '+57 311 456 7890',
                'Conocido por sus cortes de carne madurada nacionales e importados. Su sede en la Macarena ofrece un ambiente sofisticado ideal para los entusiastas de la parrilla. El ojo de bife y el lomo fino son sus estrellas.',
            ],
            [
                'La Parrilla de Marcos',
                'parrilla',
                'Centro',
                4.4385, -75.2321,
                $owner2->id, 4.6,
                'Centro comercial y de negocios, Ibagué',
                '+57 313 678 9012',
                'Un clásico de la ciudad con décadas de trayectoria. Famoso por su consistencia y sabor en cada corte. Sus chorizos artesanales y el costillar a la parrilla son los favoritos de los ibaguereños.',
            ],
            [
                'Augurio',
                'internacional',
                'Centro',
                4.4401, -75.2298,
                $owner->id, 4.7,
                'Cerca al edificio F-25, Centro, Ibagué',
                '+57 314 890 1234',
                'Excelente opción para quienes buscan cocina mexicana contemporánea con una presentación impecable. Sus tacos de autor y el guacamole preparado en mesa son la firma de este restaurante.',
            ],
            [
                'Paz Restaurante',
                'internacional',
                'Picaleña',
                4.4356, -75.1867,
                $owner2->id, 4.8,
                'Picaleña, Ibagué',
                '+57 320 012 3456',
                'Situado en Picaleña, ofrece una propuesta de cocina de autor con influencias italianas en un entorno íntimo. Cada plato es una creación única que combina técnicas europeas con ingredientes del Tolima.',
            ],
            [
                'Frencheese Burger',
                'rapida',
                'Centro',
                4.4423, -75.2267,
                $owner->id, 4.5,
                'Centro, Ibagué',
                '+57 321 234 5678',
                'Una opción destacada para hamburguesas artesanales con combinaciones de quesos y sabores locales. Sus smash burgers con queso costeño y hogao son la fusión perfecta entre lo gourmet y lo colombiano.',
            ],
            [
                'El Ilustre Bistrot',
                'internacional',
                'Centro',
                4.4445, -75.2245,
                $owner2->id, 4.7,
                'Centro histórico, Ibagué',
                '+57 322 456 7890',
                'Un espacio en el centro de la ciudad que combina técnicas francesas con ingredientes locales, ofreciendo una experiencia tipo bistró muy cuidada. Su menú cambia según la temporada y los productos del mercado.',
            ],
        ];

        $photosByCategory = [
            'tipica'        => 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
            'italiana'      => 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
            'mar-fusion'    => 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
            'parrilla'      => 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
            'internacional' => 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
            'rapida'        => 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
        ];

        $extraPhotos = [
            'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
            'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=800',
            'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
        ];

        $restaurants = collect($restaurantData)->map(function ($r, $i) use ($catMap, $photosByCategory, $extraPhotos) {
            [$name, $catSlug, $zone, $lat, $lng, $ownerId, $rating, $address, $phone, $description] = $r;

            $restaurant = Restaurant::firstOrCreate(
                ['name' => $name],
                [
                    'category_id' => $catMap[$catSlug],
                    'owner_id'    => $ownerId,
                    'description' => $description,
                    'address'     => $address,
                    'zone'        => $zone,
                    'latitude'    => $lat,
                    'longitude'   => $lng,
                    'rating'      => $rating,
                    'capacity'    => 40 + ($i * 5),
                    'phone'       => $phone,
                    'is_active'   => true,
                ]
            );

            if ($restaurant->wasRecentlyCreated) {
                RestaurantPhoto::create([
                    'restaurant_id' => $restaurant->id,
                    'url'           => $photosByCategory[$catSlug],
                    'is_cover'      => true,
                    'sort_order'    => 0,
                ]);
                RestaurantPhoto::create([
                    'restaurant_id' => $restaurant->id,
                    'url'           => $extraPhotos[$i % count($extraPhotos)],
                    'is_cover'      => false,
                    'sort_order'    => 1,
                ]);

                foreach (range(0, 6) as $day) {
                    Schedule::create([
                        'restaurant_id' => $restaurant->id,
                        'day_of_week'   => $day,
                        'open_time'     => ($day === 0) ? '12:00:00' : '11:00:00',
                        'close_time'    => ($day >= 5)  ? '23:59:00' : '23:00:00',
                        'is_closed'     => ($day === 1), // lunes cerrado
                    ]);
                }
            }

            return $restaurant;
        });

        // ── 4. MENÚS POR CATEGORÍA ────────────────────────────────────────────
        $menusByCat = [
            'tipica' => [
                ['Lechona Tolimense',    'Plato típico de cerdo relleno con arroz y arvejas, horneado por horas',  28000, 'Platos Fuertes'],
                ['Tamal Tolimense',      'Tamal tradicional envuelto en hoja de bijao con pollo y cerdo',           12000, 'Entradas'],
                ['Viudo de Pescado',     'Caldo tradicional con pescado de río, yuca y plátano',                    22000, 'Platos Fuertes'],
                ['Insulso',              'Postre típico tolimense de maíz con panela y canela',                      8000, 'Postres'],
                ['Masato de Arroz',      'Bebida fermentada tradicional tolimense',                                  6000, 'Bebidas'],
            ],
            'italiana' => [
                ['Pasta Carbonara',      'Espagueti con panceta, huevo, queso pecorino y pimienta negra',           28000, 'Pastas'],
                ['Pizza Margherita',     'Pizza con salsa de tomate San Marzano, mozzarella fresca y albahaca',     32000, 'Pizzas'],
                ['Risotto ai Funghi',    'Risotto cremoso con hongos porcini y parmesano',                          35000, 'Platos Fuertes'],
                ['Tiramisú',             'Postre clásico italiano con mascarpone, café y cacao',                    14000, 'Postres'],
                ['Bruschetta',           'Pan tostado con tomate, ajo, albahaca y aceite de oliva',                 12000, 'Entradas'],
            ],
            'mar-fusion' => [
                ['Ceviche Clásico',      'Pescado fresco marinado en limón con cebolla morada y ají amarillo',      28000, 'Entradas'],
                ['Tiradito de Atún',     'Láminas de atún con salsa de maracuyá y ají',                             32000, 'Entradas'],
                ['Roll Especial Ibagué', 'Roll con aguacate, camarón y mango con salsa de maracuyá',                26000, 'Sushi'],
                ['Arroz con Mariscos',   'Arroz cremoso con camarones, calamares y mejillones',                     38000, 'Platos Fuertes'],
                ['Leche de Tigre',       'Caldo cítrico del ceviche con mariscos y ají',                            15000, 'Entradas'],
            ],
            'parrilla' => [
                ['Ojo de Bife 300g',     'Corte argentino madurado 21 días, a la parrilla con chimichurri',         65000, 'Carnes'],
                ['Costillar BBQ',        'Costillas de cerdo glaseadas con salsa BBQ casera',                       48000, 'Carnes'],
                ['Chorizo Artesanal',    'Chorizo de cerdo con especias y acompañado de arepa',                     18000, 'Entradas'],
                ['Lomo Fino al Punto',   'Lomo de res al punto con papas rústicas y ensalada',                      55000, 'Carnes'],
                ['Provoleta',            'Queso provolone a la parrilla con orégano y aceite de oliva',             16000, 'Entradas'],
            ],
            'internacional' => [
                ['Tacos de Autor',       'Tres tacos con carne de res, guacamole y pico de gallo',                  28000, 'Platos Fuertes'],
                ['Croque Monsieur',      'Sándwich francés con jamón, queso gruyère y bechamel gratinada',          22000, 'Entradas'],
                ['Pasta al Pesto',       'Pasta fresca con pesto de albahaca, piñones y parmesano',                 26000, 'Platos Fuertes'],
                ['Crème Brûlée',         'Postre francés clásico con vainilla y azúcar caramelizada',               14000, 'Postres'],
                ['Tabla de Quesos',      'Selección de quesos importados con mermeladas y frutos secos',            32000, 'Entradas'],
            ],
            'rapida' => [
                ['Smash Burger Clásica', 'Doble carne aplastada, queso costeño, hogao y lechuga',                   22000, 'Hamburguesas'],
                ['Frencheese Special',   'Burger con brie, jamón serrano, rúcula y mostaza Dijon',                  28000, 'Hamburguesas'],
                ['Papas Rústicas',       'Papas en gajos con piel, sal marina y salsa de la casa',                  10000, 'Acompañamientos'],
                ['Milkshake de Oreo',    'Malteada cremosa con galletas Oreo y crema chantilly',                    12000, 'Bebidas'],
                ['Alitas BBQ',           'Alitas de pollo con salsa BBQ ahumada y miel',                            18000, 'Entradas'],
            ],
        ];

        $restaurants->each(function ($restaurant) use ($catMap, $menusByCat) {
            if (!$restaurant->wasRecentlyCreated) return;
            $catSlug = array_search($restaurant->category_id, $catMap->toArray());
            $items   = $menusByCat[$catSlug] ?? $menusByCat['internacional'];
            foreach ($items as [$itemName, $desc, $price, $cat]) {
                MenuItem::firstOrCreate(
                    ['restaurant_id' => $restaurant->id, 'name' => $itemName],
                    ['description' => $desc, 'price' => $price, 'category' => $cat, 'is_available' => true]
                );
            }
        });

        // ── 5. MESAS ──────────────────────────────────────────────────────────
        $tableTemplates = [
            ['Mesa Interior',  2, 0],
            ['Mesa Interior',  4, 0],
            ['Mesa Familiar',  6, 0],
            ['Mesa VIP',       4, 50000],
            ['Mesa Terraza',   2, 0],
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

        // ── 6. RESEÑAS ────────────────────────────────────────────────────────
        $allClients = $extraClients->prepend($client);
        $comments = [
            'Excelente servicio y comida deliciosa. ¡Volveré sin duda!',
            'El ambiente es muy agradable y los platos llegan puntualmente.',
            'Buena relación calidad-precio. Lo recomiendo ampliamente.',
            'La atención fue muy amable y la comida superó mis expectativas.',
            'Un lugar especial para celebrar momentos especiales con la familia.',
        ];

        $restaurants->each(function ($restaurant, $i) use ($allClients, $comments) {
            if (!$restaurant->wasRecentlyCreated) return;
            $chosen = $allClients->random(min(3, $allClients->count()));
            foreach ($chosen as $j => $cl) {
                Review::firstOrCreate(
                    ['restaurant_id' => $restaurant->id, 'user_id' => $cl->id],
                    ['rating' => rand(4, 5), 'comment' => $comments[($i + $j) % count($comments)]]
                );
            }
        });

        // ── 7. RESERVAS ───────────────────────────────────────────────────────
        $statuses  = ['confirmed', 'confirmed', 'confirmed', 'pending', 'completed', 'cancelled'];
        $hours     = [12, 13, 14, 19, 20, 21];
        $usedSlots = [];
        $created   = 0;
        $tries     = 0;
        $driver    = DB::connection()->getDriverName();

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
