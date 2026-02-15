<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
    PlusIcon,
    MinusIcon,
    ShoppingCartIcon,
    TrashIcon,
    CheckCircleIcon,
} from '@heroicons/vue/24/outline';
import { db, type Product, type Sale, type SaleItem } from '../stores/db';
import Toast from '../components/Toast.vue';

// State
const products = ref<Product[]>([]);
const cartItems = ref<Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
    subtotal: number;
}>>([]);
const customerCash = ref<number>(0);
const isProcessing = ref(false);

// Toast state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');

// Load products on mount
onMounted(async () => {
    const allProducts = await db.products.toArray();
    products.value = allProducts.filter(p => p.is_active) as Product[];
});

// Computed
const totalAmount = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.subtotal, 0);
});

const totalItems = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0);
});

const change = computed(() => {
    const cash = customerCash.value || 0;
    const total = totalAmount.value || 0;
    return cash >= total ? cash - total : 0;
});

const hasItems = computed(() => cartItems.value.length > 0);

// Toast helper
const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    showToast.value = true;
};

// Methods
const getQuantity = (productId: number): number => {
    const item = cartItems.value.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
};

const addToCart = (product: Product) => {
    const existingItem = cartItems.value.find(item => item.product_id === product.id);

    if (existingItem) {
        existingItem.quantity++;
        existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
        cartItems.value.push({
            product_id: product.id!,
            product_name: product.name,
            quantity: 1,
            price: product.price,
            subtotal: product.price,
        });
    }
};

const decrementQuantity = (productId: number) => {
    const item = cartItems.value.find(item => item.product_id === productId);

    if (item) {
        if (item.quantity > 1) {
            item.quantity--;
            item.subtotal = item.quantity * item.price;
        } else {
            removeFromCart(productId);
        }
    }
};

const removeFromCart = (productId: number) => {
    const index = cartItems.value.findIndex(item => item.product_id === productId);
    if (index > -1) {
        cartItems.value.splice(index, 1);
    }
};

const clearCart = () => {
    cartItems.value = [];
    customerCash.value = 0;
};

const completeSale = async () => {
    if (!hasItems.value || isProcessing.value) return;

    try {
        isProcessing.value = true;

        // Save sale
        const saleData: Sale = {
            total_amount: totalAmount.value,
            items_count: cartItems.value.length,
            sale_date: new Date().toISOString(),
            customer_cash: customerCash.value,
            change: change.value,
        };

        const saleId = await db.sales.add(saleData);

        // Save sale items
        const items: SaleItem[] = cartItems.value.map(item => ({
            sale_id: saleId as number,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
        }));

        await db.sale_items.bulkAdd(items);

        // Success - clear cart and show toast
        clearCart();
        showToastMessage('Sale completed!');
    } catch (error) {
        console.error('Failed to save sale:', error);
        showToastMessage('Failed to complete sale. Please try again.', 'error');
    } finally {
        isProcessing.value = false;
    }
};
</script>

<template>
    <div class="px-4 py-6 space-y-6">
        <!-- Toast Notification -->
        <Toast :show="showToast" :message="toastMessage" :type="toastType" @close="showToast = false" />

        <!-- Products Grid -->
        <div class="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 class="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                <div class="w-1 h-6 bg-gradient-to-b from-orange-500 to-pink-500 rounded-full"></div>
                Products
            </h2>

            <div v-if="products.length > 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <button v-for="product in products" :key="product.id" @click="addToCart(product)"
                    class="relative group bg-gradient-to-br from-orange-400 via-pink-400 to-purple-400 hover:from-orange-500 hover:via-pink-500 hover:to-purple-500 rounded-2xl p-5 transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95">
                    <!-- Quantity Badge -->
                    <div v-if="getQuantity(product.id!) > 0"
                        class="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full w-9 h-9 flex items-center justify-center font-bold shadow-lg ring-4 ring-white">
                        {{ getQuantity(product.id!) }}
                    </div>

                    <div class="text-center text-white">
                        <h3 class="font-bold text-base mb-2 line-clamp-2">{{ product.name }}</h3>
                        <p class="text-2xl font-black drop-shadow-lg">₱{{ product.price.toFixed(2) }}</p>
                    </div>
                </button>
            </div>

            <div v-else class="text-center py-16 text-gray-400">
                <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                    <ShoppingCartIcon class="h-10 w-10" />
                </div>
                <p class="font-medium">No products available</p>
            </div>
        </div>

        <!-- Cart -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div class="p-6">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <div class="p-2 bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl">
                            <ShoppingCartIcon class="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            Cart
                            <span v-if="totalItems > 0" class="block text-sm font-normal text-gray-500">
                                {{ totalItems }} {{ totalItems === 1 ? 'item' : 'items' }}
                            </span>
                        </div>
                    </h2>

                    <button v-if="hasItems" @click="clearCart"
                        class="px-4 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2">
                        <TrashIcon class="h-4 w-4" />
                        Clear
                    </button>
                </div>

                <!-- Cart Items -->
                <div v-if="hasItems" class="space-y-3 mb-6 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                    <div v-for="item in cartItems" :key="item.product_id"
                        class="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 border border-gray-200">
                        <div class="flex-1 min-w-0">
                            <p class="font-bold text-gray-900 truncate">{{ item.product_name }}</p>
                            <p class="text-sm text-gray-600">₱{{ item.price.toFixed(2) }} each</p>
                        </div>

                        <div class="flex items-center gap-4 ml-4">
                            <!-- Quantity Controls -->
                            <div class="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm">
                                <button @click="decrementQuantity(item.product_id)"
                                    class="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-lg transition-all active:scale-90 flex items-center justify-center">
                                    <MinusIcon class="h-4 w-4" />
                                </button>

                                <span class="font-black text-lg w-8 text-center text-gray-900">
                                    {{ item.quantity }}
                                </span>

                                <button @click="addToCart(products.find((p: Product) => p.id === item.product_id)!)"
                                    class="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all active:scale-90 flex items-center justify-center">
                                    <PlusIcon class="h-4 w-4" />
                                </button>
                            </div>

                            <!-- Subtotal -->
                            <div class="min-w-[90px] text-right">
                                <p class="font-black text-lg text-gray-900">
                                    ₱{{ item.subtotal.toFixed(2) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else class="text-center py-16 text-gray-400">
                    <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                        <ShoppingCartIcon class="h-10 w-10" />
                    </div>
                    <p class="font-semibold text-gray-900 mb-1">Cart is empty</p>
                    <p class="text-sm">Tap products above to add</p>
                </div>

                <!-- Checkout Section -->
                <div v-if="hasItems" class="border-t-2 border-gray-200 pt-6 space-y-5">
                    <!-- Total -->
                    <div
                        class="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                        <span class="text-lg font-bold text-gray-700">TOTAL</span>
                        <span
                            class="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            ₱{{ totalAmount.toFixed(2) }}
                        </span>
                    </div>

                    <!-- Customer Cash -->
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">
                            Customer's Cash
                        </label>
                        <input @keydown.enter="($event.target as HTMLInputElement).blur()"  v-model.number="customerCash" type="number" min="0" step="0.01" placeholder="₱0.00"
                            class="w-full text-2xl font-bold border-2 border-gray-300 rounded-2xl p-4 focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all" />
                    </div>

                    <!-- Change -->
                    <div
                        class="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                        <span class="text-base font-bold text-gray-700">Change</span>
                        <span class="text-3xl font-black text-green-600">
                            ₱{{ change.toFixed(2) }}
                        </span>
                    </div>

                    <!-- Complete Sale Button -->
                    <button @click="completeSale" :disabled="isProcessing" :class="[
                        'w-full py-5 rounded-2xl font-black text-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-xl',
                        !isProcessing
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white active:scale-95 hover:shadow-2xl'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    ]">
                        <CheckCircleIcon class="h-7 w-7" />
                        {{ isProcessing ? 'Processing...' : 'Complete Sale' }}
                    </button>
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