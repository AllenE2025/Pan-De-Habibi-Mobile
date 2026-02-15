<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { db, type Sale, type SaleItem } from '../stores/db';
import {
    MagnifyingGlassIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    ShoppingBagIcon,
    ReceiptPercentIcon,
    TrashIcon,
} from '@heroicons/vue/24/outline';
import Toast from '../components/Toast.vue';

interface SaleWithItems extends Sale {
    items?: SaleItem[];
}

const sales = ref<SaleWithItems[]>([]);
const selectedSale = ref<SaleWithItems | null>(null);
const searchQuery = ref('');
const loading = ref(true);

// Toast state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');

// Delete confirmation
const showDeleteConfirm = ref(false);
const saleToDelete = ref<SaleWithItems | null>(null);

onMounted(async () => {
    await loadSales();
});

const loadSales = async () => {
    loading.value = true;
    try {
        const allSales = await db.sales.orderBy('sale_date').reverse().toArray();
        sales.value = allSales as SaleWithItems[];
    } catch (error) {
        console.error('Failed to load sales:', error);
    } finally {
        loading.value = false;
    }
};

const filteredSales = computed(() => {
    if (!searchQuery.value) return sales.value;

    const query = searchQuery.value.toLowerCase();
    return sales.value.filter(sale => {
        const date = formatDate(sale.sale_date).toLowerCase();
        const amount = sale.total_amount.toString();
        return date.includes(query) || amount.includes(query);
    });
});

const totalSales = computed(() => {
    return sales.value.reduce((sum, sale) => sum + sale.total_amount, 0);
});

const totalTransactions = computed(() => sales.value.length);

const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    showToast.value = true;
};

const viewSaleDetails = async (sale: SaleWithItems) => {
    const items = await db.sale_items.where('sale_id').equals(sale.id!).toArray();
    selectedSale.value = { ...sale, items };
};

const closeSaleDetails = () => {
    selectedSale.value = null;
};

const confirmDelete = (sale: SaleWithItems) => {
    saleToDelete.value = sale;
    showDeleteConfirm.value = true;
};

const cancelDelete = () => {
    showDeleteConfirm.value = false;
    saleToDelete.value = null;
};

const deleteSale = async () => {
    if (!saleToDelete.value) return;

    try {
        // Delete sale items first
        await db.sale_items.where('sale_id').equals(saleToDelete.value.id!).delete();

        // Delete the sale
        await db.sales.delete(saleToDelete.value.id!);

        // Reload sales
        await loadSales();

        // Close modals
        cancelDelete();
        closeSaleDetails();

        showToastMessage('Sale deleted successfully!');
    } catch (error) {
        console.error('Failed to delete sale:', error);
        showToastMessage('Failed to delete sale. Please try again.', 'error');
    }
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
};
</script>

<template>
    <div class="px-4 pt-6 space-y-6">
        <!-- Toast -->
        <Toast :show="showToast" :message="toastMessage" :type="toastType" @close="showToast = false" />

        <!-- Stats Cards -->
        <div class="grid grid-cols-2 gap-4">
            <!-- Total Sales -->
            <div class="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl shadow-xl p-5 text-white">
                <div class="flex items-center gap-2 text-green-100 mb-2">
                    <CurrencyDollarIcon class="h-5 w-5" />
                    <span class="text-sm font-bold">Total Sales</span>
                </div>
                <p class="text-3xl font-black">₱{{ totalSales.toFixed(2) }}</p>
            </div>

            <!-- Transactions -->
            <div class="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-5 text-white">
                <div class="flex items-center gap-2 text-blue-100 mb-2">
                    <ShoppingBagIcon class="h-5 w-5" />
                    <span class="text-sm font-bold">Transactions</span>
                </div>
                <p class="text-3xl font-black">{{ totalTransactions }}</p>
            </div>
        </div>

        <!-- Search Bar -->
        <div class="bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
            <div class="relative">
                <MagnifyingGlassIcon class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input v-model="searchQuery" type="search" inputmode="search" enterkeyhint="search"
                    @keydown.enter="($event.target as HTMLInputElement).blur()" placeholder="Search by date or amount..."
                    class="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all font-medium" />
            </div>
        </div>

        <!-- Sales List -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div class="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ReceiptPercentIcon class="h-6 w-6 text-orange-600" />
                    Sales History
                </h2>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="p-12 text-center">
                <div
                    class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600">
                </div>
                <p class="mt-4 text-gray-600 font-medium">Loading sales...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredSales.length === 0" class="p-12 text-center text-gray-400">
                <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                    <ShoppingBagIcon class="h-10 w-10" />
                </div>
                <p class="font-semibold text-gray-900 mb-1">{{ searchQuery ? 'No sales found' : 'No sales yet' }}</p>
                <p class="text-sm">{{ searchQuery ? 'Try a different search' : 'Start making sales!' }}</p>
            </div>

            <!-- Sales Items -->
            <div v-else class="divide-y-2 divide-gray-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                <button v-for="sale in filteredSales" :key="sale.id" @click="viewSaleDetails(sale)"
                    class="w-full p-5 hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-all text-left group">
                    <div class="flex justify-between items-start gap-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 text-sm text-gray-600 mb-2 font-medium">
                                <CalendarIcon class="h-4 w-4" />
                                <span>{{ formatDate(sale.sale_date) }}</span>
                            </div>
                            <div
                                class="inline-flex items-center gap-2 bg-gray-100 group-hover:bg-white rounded-full px-3 py-1">
                                <ShoppingBagIcon class="h-3 w-3 text-gray-600" />
                                <span class="text-xs font-bold text-gray-700">
                                    {{ sale.items_count }} item{{ sale.items_count > 1 ? 's' : '' }}
                                </span>
                            </div>
                        </div>
                        <div class="text-right">
                            <p
                                class="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                ₱{{ sale.total_amount.toFixed(2) }}
                            </p>
                            <p class="text-xs font-semibold text-gray-500 mt-1">{{ formatTime(sale.sale_date) }}</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>

        <!-- Sale Details Modal -->
        <div v-if="selectedSale"
            class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4"
            @click="closeSaleDetails">
            <div class="bg-white rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden shadow-2xl mb-20"
                @click.stop>
                <!-- Modal Header -->
                <div class="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-6">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-2xl font-black">🧾 Sale Details</h3>
                        <button @click="closeSaleDetails"
                            class="text-white hover:bg-white/20 rounded-full p-2 transition-all">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p class="text-orange-100 text-sm font-medium">{{ formatDate(selectedSale.sale_date) }}</p>
                </div>

                <!-- Modal Content -->
                <div class="p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-180px)] custom-scrollbar">
                    <!-- Items -->
                    <div v-if="selectedSale.items && selectedSale.items.length > 0">
                        <h4 class="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <ShoppingBagIcon class="h-5 w-5" />
                            Items
                        </h4>
                        <div class="space-y-3">
                            <div v-for="item in selectedSale.items" :key="item.id"
                                class="flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
                                <div class="flex-1">
                                    <p class="font-bold text-gray-900">{{ item.product_name }}</p>
                                    <p class="text-sm text-gray-600 font-medium">
                                        {{ item.quantity }} × ₱{{ item.price.toFixed(2) }}
                                    </p>
                                </div>
                                <p class="font-black text-lg text-gray-900">₱{{ item.subtotal.toFixed(2) }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Summary -->
                    <div class="border-t-2 border-gray-200 pt-6 space-y-4">
                        <div class="flex justify-between items-center p-4 bg-blue-50 rounded-2xl">
                            <span class="font-bold text-gray-700">Total Items</span>
                            <span class="font-black text-xl text-gray-900">{{ selectedSale.items_count }}</span>
                        </div>

                        <div
                            class="flex justify-between items-center p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                            <span class="font-bold text-lg text-gray-700">Total Amount</span>
                            <span
                                class="font-black text-3xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                ₱{{ selectedSale.total_amount.toFixed(2) }}
                            </span>
                        </div>

                        <div v-if="selectedSale.customer_cash"
                            class="space-y-3 p-5 bg-purple-50 rounded-2xl border border-purple-200">
                            <div class="flex justify-between text-gray-700">
                                <span class="font-bold">Cash Received</span>
                                <span class="font-black">₱{{ selectedSale.customer_cash.toFixed(2) }}</span>
                            </div>
                            <div class="flex justify-between text-purple-600 pt-3 border-t-2 border-purple-200">
                                <span class="font-bold">Change</span>
                                <span class="font-black text-xl">₱{{ selectedSale.change.toFixed(2) }}</span>
                            </div>
                        </div>

                        <!-- Delete Button -->
                        <button @click="confirmDelete(selectedSale)"
                            class="w-full flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95">
                            <TrashIcon class="h-5 w-5" />
                            Delete This Sale
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteConfirm"
            class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
            @click="cancelDelete">
            <div class="bg-white rounded-3xl w-full max-w-sm shadow-2xl" @click.stop>
                <div class="p-8 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                        <TrashIcon class="h-8 w-8 text-red-600" />
                    </div>
                    <h3 class="text-2xl font-black text-gray-900 mb-2">Delete Sale?</h3>
                    <p class="text-gray-600 mb-2">
                        Are you sure you want to delete this sale of <strong>₱{{ saleToDelete?.total_amount.toFixed(2)
                            }}</strong>?
                    </p>
                    <p class="text-sm text-red-600 font-semibold mb-6">
                        This action cannot be undone.
                    </p>
                    <div class="flex gap-3">
                        <button @click="cancelDelete"
                            class="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-95">
                            Cancel
                        </button>
                        <button @click="deleteSale"
                            class="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #f97316, #ec4899);
    border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #ea580c, #db2777);
}
</style>