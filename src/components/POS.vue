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

        // Success - clear cart
        clearCart();
        alert(`✅ Sale completed!\nTotal: ₱${totalAmount.value.toFixed(2)}\nChange: ₱${change.value.toFixed(2)}`);
    } catch (error) {
        console.error('Failed to save sale:', error);
        alert('❌ Failed to complete sale. Please try again.');
    } finally {
        isProcessing.value = false;
    }
};
</script>

<template>
    <div class="min-h-screen bg-gradient-to-br from-orange-100 to-yellow-100">
        <!-- Header -->
        <header class="bg-orange-600 text-white shadow-lg">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <h1 class="text-2xl font-bold">🥖 Pan De-Habibi POS</h1>
                <p class="text-orange-100 text-sm">Offline-Ready Point of Sale</p>
            </div>
        </header>

        <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
            <!-- Products Grid -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <h2 class="text-xl font-bold mb-4 text-gray-800">Products</h2>

                <div v-if="products.length > 0"
                    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <button v-for="product in products" :key="product.id" @click="addToCart(product)"
                        class="relative bg-gradient-to-br from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 rounded-xl p-6 transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg">
                        <!-- Quantity Badge -->
                        <div v-if="getQuantity(product.id!) > 0"
                            class="absolute -top-2 -right-2 bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg">
                            {{ getQuantity(product.id!) }}
                        </div>

                        <div class="text-center text-white">
                            <h3 class="font-bold text-lg mb-2">{{ product.name }}</h3>
                            <p class="text-2xl font-bold">₱{{ product.price.toFixed(2) }}</p>
                        </div>
                    </button>
                </div>

                <div v-else class="text-center py-12 text-gray-400">
                    <p>No products available</p>
                </div>
            </div>

            <!-- Cart -->
            <div class="bg-white rounded-xl shadow-lg p-6">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCartIcon class="h-6 w-6" />
                        Cart
                        <span v-if="totalItems > 0" class="text-sm text-gray-500">
                            ({{ totalItems }} {{ totalItems === 1 ? 'item' : 'items' }})
                        </span>
                    </h2>

                    <button v-if="hasItems" @click="clearCart"
                        class="text-red-600 hover:text-red-700 font-medium flex items-center gap-1 bg-red-100 hover:bg-red-200 px-4 py-2 rounded-lg transition-all">
                        <TrashIcon class="h-4 w-4" />
                        Clear
                    </button>
                </div>

                <!-- Cart Items -->
                <div v-if="hasItems" class="space-y-3 mb-6 max-h-64 overflow-y-auto">
                    <div v-for="item in cartItems" :key="item.product_id"
                        class="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                        <div class="flex-1">
                            <p class="font-semibold text-gray-900">{{ item.product_name }}</p>
                            <p class="text-sm text-gray-500">₱{{ item.price.toFixed(2) }} each</p>
                        </div>

                        <div class="flex items-center gap-4">
                            <!-- Quantity Controls -->
                            <div class="flex items-center gap-2">
                                <button @click="decrementQuantity(item.product_id)"
                                    class="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors">
                                    <MinusIcon class="h-4 w-4" />
                                </button>

                                <span class="font-bold text-xl w-8 text-center">
                                    {{ item.quantity }}
                                </span>

                                <button @click="addToCart(products.find((p: Product) => p.id === item.product_id)!)"
                                    class="bg-green-500 hover:bg-green-600 text-white rounded-full p-2 transition-colors">
                                    <PlusIcon class="h-4 w-4" />
                                </button>
                            </div>

                            <!-- Subtotal -->
                            <div class="min-w-[100px] text-right">
                                <p class="font-bold text-lg text-gray-900">
                                    ₱{{ item.subtotal.toFixed(2) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Empty State -->
                <div v-else class="text-center py-12 text-gray-400">
                    <ShoppingCartIcon class="h-16 w-16 mx-auto mb-2 opacity-50" />
                    <p class="font-medium">Cart is empty</p>
                    <p class="text-sm">Tap products to add</p>
                </div>

                <!-- Checkout Section -->
                <div v-if="hasItems" class="border-t pt-6 space-y-4">
                    <!-- Total -->
                    <div class="flex justify-between items-center text-2xl font-bold">
                        <span class="text-gray-700">TOTAL:</span>
                        <span class="text-purple-600">₱{{ totalAmount.toFixed(2) }}</span>
                    </div>

                    <!-- Customer Cash -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Customer's Cash
                        </label>
                        <input v-model.number="customerCash" type="number" min="0" step="0.01" placeholder="₱0.00"
                            class="w-full text-xl font-semibold border-2 border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none" />
                    </div>

                    <!-- Change -->
                    <div class="flex justify-between items-center bg-green-50 rounded-xl p-4">
                        <span class="text-gray-700 font-medium">Change</span>
                        <span class="text-2xl font-bold text-green-600">
                            ₱{{ change.toFixed(2) }}
                        </span>
                    </div>

                    <!-- Complete Sale Button -->
                    <button @click="completeSale" :disabled="isProcessing" :class="[
                        'w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2',
                        !isProcessing
                            ? 'bg-green-500 hover:bg-green-600 text-white active:scale-95 shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    ]">
                        <CheckCircleIcon class="h-6 w-6" />
                        {{ isProcessing ? 'Processing...' : 'Complete Sale' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>