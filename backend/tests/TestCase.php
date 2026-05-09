<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    // Cada test maneja su propia autenticación con actingAs()
    // No autenticamos globalmente para poder testear rutas protegidas
}
