<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import {
    ShoppingCartIcon,
    ClipboardDocumentListIcon,
    CubeIcon,
    Cog6ToothIcon,
} from '@heroicons/vue/24/outline';
import {
    ShoppingCartIcon as ShoppingCartIconSolid,
    ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
    CubeIcon as CubeIconSolid,
    Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/vue/24/solid';
import PWAInstall from '../layouts/PWAInstall.vue';

const route = useRoute();

const isActive = (name: string) => {
    return route.name === name;
};

const pageTitle = computed(() => {
    return route.meta.title || 'Pan De-Habibi';
});
</script>

<template>
    <div class="h-full bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex flex-col overflow-hidden">
        <!-- PWA Install Prompt -->
        <PWAInstall />

        <!-- Header -->
        <header
            class="bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 text-white shadow-2xl sticky top-0 z-40 border-b-4 border-white/20 flex-shrink-0 pt-safe">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex items-center gap-4">
                    <div class="relative">
                        <div class="absolute inset-0 bg-white/20 rounded-2xl blur"></div>
                        <img src="/images/pandehabibi_logo.jpg" alt="Logo"
                            class="relative h-14 w-18 rounded-lg object-cover ring-2 ring-white/30 shadow-xl"
                            @error="(e) => (e.target as HTMLImageElement).style.display = 'none'" />
                    </div>
                    <div class="flex-1">
                        <!-- <h1 class="text-2xl font-black tracking-tight drop-shadow-lg">Pan De-Habibi</h1> -->
                        <p class="text-2xl font-bold text-white/90 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            {{ pageTitle }}
                        </p>
                    </div>
                </div>
            </div>
        </header>

       <!-- Main Content -->
        <main class="flex-1 overflow-y-auto max-w-7xl mx-auto w-full pb-32">
            <slot />
        </main>

        <!-- Bottom Navigation (Mobile-First) -->
        <nav
            class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t-2 border-gray-200 shadow-2xl z-50 flex-shrink-0">
            <div class="max-w-7xl mx-auto px-2">
                <div class="flex justify-around items-center py-1">
                    <!-- POS Tab -->
                    <router-link to="/" :class="[
                        'flex flex-col items-center justify-center py-3 px-4 rounded-2xl transition-all duration-200',
                        isActive('pos')
                            ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-lg scale-105'
                            : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50 active:scale-95'
                    ]">
                        <div :class="[
                            'p-1.5 rounded-xl transition-all',
                            isActive('pos') ? 'bg-white/20' : ''
                        ]">
                            <ShoppingCartIconSolid v-if="isActive('pos')" class="h-6 w-6" />
                            <ShoppingCartIcon v-else class="h-6 w-6" />
                        </div>
                        <span :class="[
                            'text-xs font-bold mt-1',
                            isActive('pos') ? 'drop-shadow' : ''
                        ]">POS</span>
                    </router-link>

                    <!-- Sales Tab -->
                    <router-link to="/sales" :class="[
                        'flex flex-col items-center justify-center py-3 px-4 rounded-2xl transition-all duration-200',
                        isActive('sales')
                            ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg scale-105'
                            : 'text-gray-500 hover:text-green-600 hover:bg-green-50 active:scale-95'
                    ]">
                        <div :class="[
                            'p-1.5 rounded-xl transition-all',
                            isActive('sales') ? 'bg-white/20' : ''
                        ]">
                            <ClipboardDocumentListIconSolid v-if="isActive('sales')" class="h-6 w-6" />
                            <ClipboardDocumentListIcon v-else class="h-6 w-6" />
                        </div>
                        <span :class="[
                            'text-xs font-bold mt-1',
                            isActive('sales') ? 'drop-shadow' : ''
                        ]">Sales</span>
                    </router-link>

                    <!-- Products Tab -->
                    <router-link to="/products" :class="[
                        'flex flex-col items-center justify-center py-3 px-4 rounded-2xl transition-all duration-200',
                        isActive('products')
                            ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                            : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 active:scale-95'
                    ]">
                        <div :class="[
                            'p-1.5 rounded-xl transition-all',
                            isActive('products') ? 'bg-white/20' : ''
                        ]">
                            <CubeIconSolid v-if="isActive('products')" class="h-6 w-6" />
                            <CubeIcon v-else class="h-6 w-6" />
                        </div>
                        <span :class="[
                            'text-xs font-bold mt-1',
                            isActive('products') ? 'drop-shadow' : ''
                        ]">Products</span>
                    </router-link>

                    <!-- Settings Tab -->
                    <router-link to="/settings" :class="[
                        'flex flex-col items-center justify-center py-3 px-4 rounded-2xl transition-all duration-200',
                        isActive('settings')
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                            : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50 active:scale-95'
                    ]">
                        <div :class="[
                            'p-1.5 rounded-xl transition-all',
                            isActive('settings') ? 'bg-white/20' : ''
                        ]">
                            <Cog6ToothIconSolid v-if="isActive('settings')" class="h-6 w-6" />
                            <Cog6ToothIcon v-else class="h-6 w-6" />
                        </div>
                        <span :class="[
                            'text-xs font-bold mt-1',
                            isActive('settings') ? 'drop-shadow' : ''
                        ]">Settings</span>
                    </router-link>
                </div>
            </div>
        </nav>
    </div>
</template>

<style scoped>
/* Smooth gradient animation */
@keyframes gradient-shift {
    0% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        background-position: 0% 50%;
    }
}

header {
    background-size: 200% 200%;
    animation: gradient-shift 8s ease infinite;
}

/* Glassmorphism effect for bottom nav */
nav {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

/* Active tab indicator animation */
.router-link-active {
    position: relative;
}

.router-link-active::before {
    content: '';
    position: absolute;
    top: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 3px;
    background: currentColor;
    border-radius: 0 0 4px 4px;
}
</style>