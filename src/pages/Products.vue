<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { db, type Product } from '../stores/db';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline';

const products = ref<Product[]>([]);
const searchQuery = ref('');
const showModal = ref(false);
const editingProduct = ref<Product | null>(null);
const loading = ref(true);

const formData = ref({
    name: '',
    price: 0,
    image: null as string | null,
    is_active: true,
});

onMounted(async () => {
    await loadProducts();
});

const loadProducts = async () => {
    loading.value = true;
    try {
        const allProducts = await db.products.toArray();
        products.value = allProducts as Product[];
    } catch (error) {
        console.error('Failed to load products:', error);
    } finally {
        loading.value = false;
    }
};

const filteredProducts = computed(() => {
    if (!searchQuery.value) return products.value;

    const query = searchQuery.value.toLowerCase();
    return products.value.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.price.toString().includes(query)
    );
});

const activeProducts = computed(() => {
    return products.value.filter(p => p.is_active).length;
});

const openAddModal = () => {
    editingProduct.value = null;
    formData.value = {
        name: '',
        price: 0,
        image: null,
        is_active: true,
    };
    showModal.value = true;
};

const openEditModal = (product: Product) => {
    editingProduct.value = product;
    formData.value = {
        name: product.name,
        price: product.price,
        image: product.image,
        is_active: product.is_active,
    };
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    editingProduct.value = null;
};

const saveProduct = async () => {
    try {
        if (editingProduct.value) {
            // Update existing product
            await db.products.update(editingProduct.value.id!, formData.value);
        } else {
            // Add new product
            await db.products.add(formData.value);
        }

        await loadProducts();
        closeModal();
        alert(editingProduct.value ? 'Product updated!' : 'Product added!');
    } catch (error) {
        console.error('Failed to save product:', error);
        alert('Failed to save product. Please try again.');
    }
};

const toggleProductStatus = async (product: Product) => {
    try {
        await db.products.update(product.id!, {
            is_active: !product.is_active,
        });
        await loadProducts();
    } catch (error) {
        console.error('Failed to toggle product status:', error);
    }
};

const deleteProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This action cannot be undone.`)) {
        return;
    }

    try {
        await db.products.delete(product.id!);
        await loadProducts();
        alert('Product deleted!');
    } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Failed to delete product. Please try again.');
    }
};
</script>

<template>
    <div class="px-4 py-6 space-y-6">
        <!-- Stats Card -->
        <div class="bg-white rounded-xl shadow-lg p-4">
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-sm text-gray-600">Total Products</p>
                    <p class="text-3xl font-bold text-gray-900">{{ products.length }}</p>
                    <p class="text-xs text-green-600 mt-1">{{ activeProducts }} active</p>
                </div>
                <button @click="openAddModal"
                    class="bg-orange-600 hover:bg-orange-700 text-white rounded-full p-4 shadow-lg transition-all active:scale-95">
                    <PlusIcon class="h-6 w-6" />
                </button>
            </div>
        </div>

        <!-- Search Bar -->
        <div class="bg-white rounded-xl shadow-lg p-4">
            <div class="relative">
                <MagnifyingGlassIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input v-model="searchQuery" type="text" placeholder="Search products..."
                    class="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
            </div>
        </div>

        <!-- Products List -->
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
            <div class="p-4 border-b border-gray-200">
                <h2 class="text-lg font-bold text-gray-900">Products</h2>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="p-8 text-center text-gray-500">
                <p>Loading products...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredProducts.length === 0" class="p-8 text-center text-gray-400">
                <PlusIcon class="h-16 w-16 mx-auto mb-2 opacity-50" />
                <p class="font-medium">{{ searchQuery ? 'No products found' : 'No products yet' }}</p>
                <p class="text-sm">{{ searchQuery ? 'Try a different search' : 'Add your first product!' }}</p>
            </div>

            <!-- Products Grid -->
            <div v-else class="divide-y divide-gray-200">
                <div v-for="product in filteredProducts" :key="product.id"
                    class="p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-3">
                                <div :class="[
                                    'w-3 h-3 rounded-full',
                                    product.is_active ? 'bg-green-500' : 'bg-gray-300'
                                ]"></div>
                                <div>
                                    <h3 class="font-semibold text-gray-900">{{ product.name }}</h3>
                                    <p class="text-lg font-bold text-orange-600">₱{{ product.price.toFixed(2) }}</p>
                                    <p class="text-xs text-gray-500">
                                        {{ product.is_active ? 'Active' : 'Inactive' }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="flex gap-2">
                            <!-- Toggle Status -->
                            <button @click="toggleProductStatus(product)" :class="[
                                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                                product.is_active
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                            ]">
                                {{ product.is_active ? 'Hide' : 'Show' }}
                            </button>

                            <!-- Edit -->
                            <button @click="openEditModal(product)"
                                class="bg-blue-100 text-blue-700 hover:bg-blue-200 p-2 rounded-lg transition-colors">
                                <PencilIcon class="h-5 w-5" />
                            </button>

                            <!-- Delete -->
                            <button @click="deleteProduct(product)"
                                class="bg-red-100 text-red-700 hover:bg-red-200 p-2 rounded-lg transition-colors">
                                <TrashIcon class="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add/Edit Product Modal -->
        <div v-if="showModal"
            class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center"
            @click="closeModal">
            <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg" @click.stop>
                <!-- Modal Header -->
                <div class="bg-orange-600 text-white p-4">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-bold">
                            {{ editingProduct ? 'Edit Product' : 'Add Product' }}
                        </h3>
                        <button @click="closeModal" class="text-white hover:text-orange-200">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Modal Form -->
                <form @submit.prevent="saveProduct" class="p-6 space-y-4">
                    <!-- Product Name -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Product Name
                        </label>
                        <input v-model="formData.name" type="text" required placeholder="e.g. Ube Pandesal"
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
                    </div>

                    <!-- Price -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            Price (₱)
                        </label>
                        <input v-model.number="formData.price" type="number" step="0.01" min="0" required
                            placeholder="0.00"
                            class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none" />
                    </div>

                    <!-- Active Status -->
                    <div class="flex items-center gap-3">
                        <input v-model="formData.is_active" type="checkbox" id="is_active"
                            class="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                        <label for="is_active" class="text-sm font-medium text-gray-700">
                            Active (show in POS)
                        </label>
                    </div>

                    <!-- Buttons -->
                    <div class="flex gap-3 pt-4">
                        <button type="button" @click="closeModal"
                            class="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                        <button type="submit"
                            class="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors">
                            {{ editingProduct ? 'Update' : 'Add' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>