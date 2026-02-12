<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
    ShoppingCartIcon,
    ClipboardDocumentListIcon,
    CubeIcon,
} from '@heroicons/vue/24/outline';
import {
    ShoppingCartIcon as ShoppingCartIconSolid,
    ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
    CubeIcon as CubeIconSolid,
} from '@heroicons/vue/24/solid';
import PWAInstall from './PWAInstall.vue';

const route = useRoute();

const isActive = (name: string) => {
    return route.name === name;
};

const pageTitle = computed(() => {
    return route.meta.title || 'Pan De-Habibi';
});
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-100 pb-20">
        <!-- PWA Install Prompt -->
        <PWAInstall />

        <!-- Header -->
        <header class="bg-orange-600 text-white shadow-lg sticky top-0 z-40">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex items-center gap-3">
                    <img src="/images/pandehabibi_logo.jpg" alt="Logo" class="h-12 w-12 rounded-full object-cover"
                        @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
                    <div>
                        <h1 class="text-xl font-bold">🥖 Pan De-Habibi</h1>
                        <p class="text-orange-100 text-sm">{{ pageTitle }}</p>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto">
            <slot />
        </main>

        <!-- Bottom Navigation (Mobile-First) -->
        <nav class="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-orange-200 shadow-lg z-50">
            <div class="max-w-7xl mx-auto px-4">
                <div class="flex justify-around items-center py-2">
                    <!-- POS Tab -->
                    <router-link to="/" :class="[
                        'flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all',
                        isActive('pos')
                            ? 'text-orange-600 bg-orange-50'
                            : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                    ]">
                        <ShoppingCartIconSolid v-if="isActive('pos')" class="h-6 w-6" />
                        <ShoppingCartIcon v-else class="h-6 w-6" />
                        <span class="text-xs font-medium mt-1">POS</span>
                    </router-link>

                    <!-- Sales Tab -->
                    <router-link to="/sales" :class="[
                        'flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all',
                        isActive('sales')
                            ? 'text-orange-600 bg-orange-50'
                            : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                    ]">
                        <ClipboardDocumentListIconSolid v-if="isActive('sales')" class="h-6 w-6" />
                        <ClipboardDocumentListIcon v-else class="h-6 w-6" />
                        <span class="text-xs font-medium mt-1">Sales</span>
                    </router-link>

                    <!-- Products Tab -->
                    <router-link to="/products" :class="[
                        'flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all',
                        isActive('products')
                            ? 'text-orange-600 bg-orange-50'
                            : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                    ]">
                        <CubeIconSolid v-if="isActive('products')" class="h-6 w-6" />
                        <CubeIcon v-else class="h-6 w-6" />
                        <span class="text-xs font-medium mt-1">Products</span>
                    </router-link>
                </div>
            </div>
        </nav>
    </div>
</template>