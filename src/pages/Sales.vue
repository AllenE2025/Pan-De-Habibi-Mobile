<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { db, type Sale, type SaleItem } from '../stores/db';
import {
    MagnifyingGlassIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    ShoppingBagIcon,
} from '@heroicons/vue/24/outline';

interface SaleWithItems extends Sale {
    items?: SaleItem[];
}

const sales = ref<SaleWithItems[]>([]);
const selectedSale = ref<SaleWithItems | null>(null);
const searchQuery = ref('');
const loading = ref(true);

onMounted(async () => {
    await loadSales();
});

const loadSales = async () => {
    loading.value = true;
    try {
        // Get all sales, sorted by date (newest first)
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

const viewSaleDetails = async (sale: SaleWithItems) => {
    // Load sale items
    const items = await db.sale_items.where('sale_id').equals(sale.id!).toArray();
    selectedSale.value = { ...sale, items };
};

const closeSaleDetails = () => {
    selectedSale.value = null;
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
    <div class="px-4 py-6 space-y-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-2 gap-4">
            <!-- Total Sales -->
            <div class="bg-white rounded-xl shadow-lg p-4">
                <div class="flex items-center gap-2 text-green-600 mb-2">
                    <CurrencyDollarIcon class="h-5 w-5" />
                    <span class="text-sm font-medium">Total Sales</span>
                </div>
                <p class="text-2xl font-bold text-gray-900">₱{{ totalSales.toFixed(2) }}</p>
            </div>

            <!-- Transactions -->
            <div class="bg-white rounded-xl shadow-lg p-4">
                <div class="flex items-center gap-2 text-blue-600 mb-2">
                    <ShoppingBagIcon class="h-5 w-5" />
                    <span class="text-sm font-medium">Transactions</span>
                </div>
                <p class="text-2xl font-bold text-gray-900">{{ totalTransactions }}</p>
            </div>
        </div>

        <!-- Search Bar -->
        <div class="bg-white rounded-xl shadow-lg p-4">
            <div class="relative">
                <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input v-model="searchQuery" type="text" placeholder="Search by date or amount..."
                    class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
            </div>
        </div>

        <!-- Sales List -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="p-4 border-b border-gray-200">
                <h2 class="text-lg font-bold text-gray-900">Sales History</h2>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="p-8 text-center text-gray-500">
                <p>Loading sales...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredSales.length === 0" class="p-8 text-center text-gray-400">
                <ShoppingBagIcon class="h-16 w-16 mx-auto mb-2 opacity-50" />
                <p class="font-medium">{{ searchQuery ? 'No sales found' : 'No sales yet' }}</p>
                <p class="text-sm">{{ searchQuery ? 'Try a different search' : 'Start making sales!' }}</p>
            </div>

            <!-- Sales Items -->
            <div v-else class="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                <button v-for="sale in filteredSales" :key="sale.id" @click="viewSaleDetails(sale)"
                    class="w-full p-4 hover:bg-gray-50 transition-colors text-left">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                <CalendarIcon class="h-4 w-4" />
                                <span>{{ formatDate(sale.sale_date) }}</span>
                            </div>
                            <p class="text-xs text-gray-500">{{ sale.items_count }} item{{ sale.items_count > 1 ? 's' :
                                '' }}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-lg font-bold text-gray-900">₱{{ sale.total_amount.toFixed(2) }}</p>
                            <p class="text-xs text-gray-500">{{ formatTime(sale.sale_date) }}</p>
                        </div>
                    </div>
                </button>
            </div>
        </div>

        <!-- Sale Details Modal -->
        <div v-if="selectedSale"
            class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center"
            @click="closeSaleDetails">
            <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] overflow-hidden"
                @click.stop>
                <!-- Modal Header -->
                <div class="bg-orange-600 text-white p-4">
                    <div class="flex justify-between items-center mb-2">
                        <h3 class="text-lg font-bold">Sale Details</h3>
                        <button @click="closeSaleDetails" class="text-white hover:text-orange-200">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <p class="text-orange-100 text-sm">{{ formatDate(selectedSale.sale_date) }}</p>
                </div>

                <!-- Modal Content -->
                <div class="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-120px)]">
                    <!-- Items -->
                    <div v-if="selectedSale.items && selectedSale.items.length > 0">
                        <h4 class="font-semibold text-gray-700 mb-2">Items</h4>
                        <div class="space-y-2">
                            <div v-for="item in selectedSale.items" :key="item.id"
                                class="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                                <div>
                                    <p class="font-medium text-gray-900">{{ item.product_name }}</p>
                                    <p class="text-sm text-gray-500">{{ item.quantity }} × ₱{{ item.price.toFixed(2) }}
                                    </p>
                                </div>
                                <p class="font-bold text-gray-900">₱{{ item.subtotal.toFixed(2) }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Summary -->
                    <div class="border-t pt-4">
                        <div class="flex justify-between items-center text-lg">
                            <span class="font-semibold text-gray-700">Total Items:</span>
                            <span class="font-bold text-gray-900">{{ selectedSale.items_count }}</span>
                        </div>
                        <div class="flex justify-between items-center text-xl mt-2">
                            <span class="font-bold text-gray-700">Total Amount:</span>
                            <span class="font-bold text-green-600">₱{{ selectedSale.total_amount.toFixed(2) }}</span>
                        </div>
                        <div v-if="selectedSale.customer_cash" class="mt-4 space-y-1 text-sm">
                            <div class="flex justify-between text-gray-600">
                                <span>Cash Received:</span>
                                <span>₱{{ selectedSale.customer_cash.toFixed(2) }}</span>
                            </div>
                            <div class="flex justify-between text-gray-600">
                                <span>Change:</span>
                                <span>₱{{ selectedSale.change.toFixed(2) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>