<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/vue/24/outline';

const showInstallPrompt = ref(false);
let deferredPrompt: any = null;

onMounted(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration);
            })
            .catch((error) => {
                console.log('❌ Service Worker registration failed:', error);
            });
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallPrompt.value = true;
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
        console.log('✅ PWA installed');
        showInstallPrompt.value = false;
        deferredPrompt = null;
    });
});

const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response: ${outcome}`);
    deferredPrompt = null;
    showInstallPrompt.value = false;
};

const dismissPrompt = () => {
    showInstallPrompt.value = false;
};
</script>

<template>
    <!-- Install Prompt Banner -->
    <Transition enter-active-class="transition ease-out duration-300" enter-from-class="translate-y-full opacity-0"
        enter-to-class="translate-y-0 opacity-100" leave-active-class="transition ease-in duration-200"
        leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-full opacity-0">
        <div v-if="showInstallPrompt"
            class="fixed bottom-20 left-4 right-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl shadow-2xl p-4 z-40">
            <button @click="dismissPrompt" class="absolute top-2 right-2 text-white hover:text-orange-200">
                <XMarkIcon class="h-5 w-5" />
            </button>

            <div class="flex items-start gap-3 mb-3">
                <div class="bg-white rounded-lg p-2">
                    <span class="text-2xl">🥖</span>
                </div>
                <div class="flex-1">
                    <h3 class="font-bold text-lg mb-1">Install Pan De-Habibi POS</h3>
                    <p class="text-sm text-orange-100">
                        Add to your home screen for quick access and offline use!
                    </p>
                </div>
            </div>

            <button @click="installApp"
                class="w-full bg-white text-orange-600 font-bold py-3 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
                <ArrowDownTrayIcon class="h-5 w-5" />
                Install App
            </button>
        </div>
    </Transition>
</template>