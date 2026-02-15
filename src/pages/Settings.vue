<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    DocumentChartBarIcon,
    CubeIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline';
import {
    exportSalesToCSV,
    exportProductsToCSV,
    createBackup,
    restoreBackup,
    getStorageInfo,
} from '../stores/exportUtils';
import Toast from '../components/Toast.vue';

// State
const storageInfo = ref({
    products: 0,
    sales: 0,
    saleItems: 0,
    totalRevenue: 0,
});
const loading = ref(false);

// Toast state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');

// Restore modal
const showRestoreModal = ref(false);
const restoreFile = ref<File | null>(null);

onMounted(async () => {
    await loadStorageInfo();
});

const loadStorageInfo = async () => {
    storageInfo.value = await getStorageInfo();
};

const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    showToast.value = true;
};

const handleExportSales = async () => {
    loading.value = true;
    try {
        await exportSalesToCSV();
        showToastMessage('Sales exported successfully!');
    } catch (error) {
        showToastMessage('Failed to export sales', 'error');
    } finally {
        loading.value = false;
    }
};

const handleExportProducts = async () => {
    loading.value = true;
    try {
        await exportProductsToCSV();
        showToastMessage('Products exported successfully!');
    } catch (error) {
        showToastMessage('Failed to export products', 'error');
    } finally {
        loading.value = false;
    }
};

const handleCreateBackup = async () => {
    loading.value = true;
    try {
        await createBackup();
        showToastMessage('Backup created successfully!');
    } catch (error) {
        showToastMessage('Failed to create backup', 'error');
    } finally {
        loading.value = false;
    }
};

const openRestoreModal = () => {
    showRestoreModal.value = true;
    restoreFile.value = null;
};

const closeRestoreModal = () => {
    showRestoreModal.value = false;
    restoreFile.value = null;
};

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        restoreFile.value = target.files[0];
    }
};

const handleRestoreBackup = async () => {
    if (!restoreFile.value) {
        showToastMessage('Please select a backup file', 'error');
        return;
    }

    loading.value = true;
    try {
        const result = await restoreBackup(restoreFile.value);

        if (result.success) {
            showToastMessage(result.message);
            await loadStorageInfo();
            closeRestoreModal();
        } else {
            showToastMessage(result.message, 'error');
        }
    } catch (error) {
        showToastMessage('Failed to restore backup', 'error');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="px-4 py-6 space-y-6">
        <!-- Toast -->
        <Toast :show="showToast" :message="toastMessage" :type="toastType" @close="showToast = false" />

        <!-- Header Card -->
        <div class="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
            <div class="flex items-center gap-4">
                <div class="p-3 bg-white/20 rounded-2xl backdrop-blur">
                    <ShieldCheckIcon class="h-10 w-10" />
                </div>
                <div>
                    <h1 class="text-2xl font-black">Backup & Export</h1>
                    <p class="text-sm text-white/90 font-medium">Protect your data</p>
                </div>
            </div>
        </div>

        <!-- Storage Info -->
        <div class="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DocumentChartBarIcon class="h-6 w-6 text-purple-600" />
                Storage Information
            </h2>

            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200">
                    <div class="flex items-center gap-2 text-blue-600 mb-2">
                        <CubeIcon class="h-4 w-4" />
                        <span class="text-xs font-bold">Products</span>
                    </div>
                    <p class="text-3xl font-black text-gray-900">{{ storageInfo.products }}</p>
                </div>

                <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                    <div class="flex items-center gap-2 text-green-600 mb-2">
                        <DocumentChartBarIcon class="h-4 w-4" />
                        <span class="text-xs font-bold">Sales</span>
                    </div>
                    <p class="text-3xl font-black text-gray-900">{{ storageInfo.sales }}</p>
                </div>

                <div
                    class="col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
                    <div class="flex items-center gap-2 text-purple-600 mb-2">
                        <span class="text-xs font-bold">Total Revenue</span>
                    </div>
                    <p
                        class="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        ₱{{ storageInfo.totalRevenue.toFixed(2) }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Warning Card -->
        <div class="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-5">
            <div class="flex gap-3">
                <ExclamationTriangleIcon class="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 class="font-bold text-gray-900 mb-1">Data Safety Warning</h3>
                    <p class="text-sm text-gray-700 leading-relaxed">
                        Your data is stored in your browser. If you <strong>clear browser data</strong> or
                        <strong>uninstall the browser</strong>, all sales history will be lost permanently.
                        <strong>Create regular backups!</strong>
                    </p>
                </div>
            </div>
        </div>

        <!-- Export Section -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div class="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ArrowDownTrayIcon class="h-6 w-6 text-purple-600" />
                    Export Data
                </h2>
                <p class="text-sm text-gray-600 mt-1">Download your data as CSV files</p>
            </div>

            <div class="p-6 space-y-3">
                <!-- Export Sales -->
                <button @click="handleExportSales" :disabled="loading || storageInfo.sales === 0"
                    class="w-full flex items-center justify-between p-5 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-2xl border-2 border-green-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-green-500 rounded-xl">
                            <DocumentChartBarIcon class="h-6 w-6 text-white" />
                        </div>
                        <div class="text-left">
                            <p class="font-bold text-gray-900">Export Sales to CSV</p>
                            <p class="text-sm text-gray-600">Download all sales records</p>
                        </div>
                    </div>
                    <ArrowDownTrayIcon class="h-5 w-5 text-green-600" />
                </button>

                <!-- Export Products -->
                <button @click="handleExportProducts" :disabled="loading || storageInfo.products === 0"
                    class="w-full flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-2xl border-2 border-blue-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-blue-500 rounded-xl">
                            <CubeIcon class="h-6 w-6 text-white" />
                        </div>
                        <div class="text-left">
                            <p class="font-bold text-gray-900">Export Products to CSV</p>
                            <p class="text-sm text-gray-600">Download product list</p>
                        </div>
                    </div>
                    <ArrowDownTrayIcon class="h-5 w-5 text-blue-600" />
                </button>
            </div>
        </div>

        <!-- Backup Section -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div class="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheckIcon class="h-6 w-6 text-purple-600" />
                    Complete Backup
                </h2>
                <p class="text-sm text-gray-600 mt-1">Full backup includes everything</p>
            </div>

            <div class="p-6 space-y-3">
                <!-- Create Backup -->
                <button @click="handleCreateBackup" :disabled="loading"
                    class="w-full flex items-center justify-between p-5 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-2xl border-2 border-purple-200 transition-all active:scale-95 disabled:opacity-50">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                            <ArrowDownTrayIcon class="h-6 w-6 text-white" />
                        </div>
                        <div class="text-left">
                            <p class="font-bold text-gray-900">Create Full Backup</p>
                            <p class="text-sm text-gray-600">All products, sales, and items</p>
                        </div>
                    </div>
                    <ShieldCheckIcon class="h-5 w-5 text-purple-600" />
                </button>

                <!-- Restore Backup -->
                <button @click="openRestoreModal" :disabled="loading"
                    class="w-full flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-2xl border-2 border-orange-200 transition-all active:scale-95 disabled:opacity-50">
                    <div class="flex items-center gap-3">
                        <div class="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                            <ArrowUpTrayIcon class="h-6 w-6 text-white" />
                        </div>
                        <div class="text-left">
                            <p class="font-bold text-gray-900">Restore from Backup</p>
                            <p class="text-sm text-gray-600">Replace all current data</p>
                        </div>
                    </div>
                    <ExclamationTriangleIcon class="h-5 w-5 text-orange-600" />
                </button>
            </div>
        </div>

        <!-- Restore Modal -->
        <div v-if="showRestoreModal"
            class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            @click="closeRestoreModal">
            <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl" @click.stop>
                <div class="p-8 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                        <ArrowUpTrayIcon class="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 class="text-2xl font-black text-gray-900 mb-2">Restore Backup</h3>
                    <p class="text-gray-600 mb-6">
                        ⚠️ This will <strong>replace all current data</strong> with the backup file. This action cannot
                        be undone.
                    </p>

                    <!-- File Input -->
                    <div class="mb-6">
                        <label
                            class="block w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-purple-500 cursor-pointer transition-all">
                            <input type="file" accept=".json" @change="handleFileSelect" class="hidden" />
                            <div class="text-center">
                                <ArrowUpTrayIcon class="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                <p class="font-bold text-gray-900">
                                    {{ restoreFile ? restoreFile.name : 'Choose backup file' }}
                                </p>
                                <p class="text-sm text-gray-500 mt-1">Click to select .json file</p>
                            </div>
                        </label>
                    </div>

                    <div class="flex gap-3">
                        <button @click="closeRestoreModal"
                            class="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-95">
                            Cancel
                        </button>
                        <button @click="handleRestoreBackup" :disabled="!restoreFile || loading"
                            class="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                            {{ loading ? 'Restoring...' : 'Restore' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>