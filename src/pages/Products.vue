<script setup lang="ts">
import { ref, onMounted, computed, toRaw } from 'vue';
import { db, type Product } from '../stores/db';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    CubeIcon,
} from '@heroicons/vue/24/outline';
import Toast from '../components/Toast.vue';

const products = ref<Product[]>([]);
const searchQuery = ref('');
const showModal = ref(false);
const editingProduct = ref<Product | null>(null);
const loading = ref(true);

// Toast state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');

// Confirmation modal
const showConfirmDelete = ref(false);
const productToDelete = ref<Product | null>(null);

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

const showToastMessage = (message: string, type: 'success' | 'error' = 'success') => {
    toastMessage.value = message;
    toastType.value = type;
    showToast.value = true;
};

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
            await db.products.update(editingProduct.value.id!, formData.value);
            showToastMessage('Product updated successfully!');
        } else {
            await db.products.add(toRaw(formData.value));
            showToastMessage('Product added successfully!');
        }

        await loadProducts();
        closeModal();
    } catch (error) {
        console.error('Failed to save product:', error);
        showToastMessage('Failed to save product. Please try again.', 'error');
    }
};

const toggleProductStatus = async (product: Product) => {
    try {
        await db.products.update(product.id!, {
            is_active: !product.is_active,
        });
        await loadProducts();
        showToastMessage(`Product ${!product.is_active ? 'activated' : 'deactivated'}!`);
    } catch (error) {
        console.error('Failed to toggle product status:', error);
        showToastMessage('Failed to update product status.', 'error');
    }
};

const confirmDelete = (product: Product) => {
    productToDelete.value = product;
    showConfirmDelete.value = true;
};

const cancelDelete = () => {
    showConfirmDelete.value = false;
    productToDelete.value = null;
};

const deleteProduct = async () => {
    if (!productToDelete.value) return;

    try {
        await db.products.delete(productToDelete.value.id!);
        await loadProducts();
        showToastMessage('Product deleted successfully!');
        cancelDelete();
    } catch (error) {
        console.error('Failed to delete product:', error);
        showToastMessage('Failed to delete product. Please try again.', 'error');
    }
};
</script>

<template>
    <div class="px-4 py-6 space-y-6">
        <!-- Toast Notification -->
        <Toast :show="showToast" :message="toastMessage" :type="toastType" @close="showToast = false" />

        <!-- Stats Card -->
        <div class="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white">
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-sm font-medium text-orange-100 mb-1">Total Products</p>
                    <p class="text-5xl font-black mb-2">{{ products.length }}</p>
                    <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                        <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span class="text-sm font-bold">{{ activeProducts }} active</span>
                    </div>
                </div>
                <button @click="openAddModal"
                    class="bg-white text-orange-600 hover:bg-orange-50 rounded-2xl p-4 shadow-xl transition-all active:scale-95 hover:scale-110">
                    <PlusIcon class="h-8 w-8 font-bold" />
                </button>
            </div>
        </div>

        <!-- Search Bar -->
        <div class="bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
            <div class="relative">
                <MagnifyingGlassIcon class="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input v-model="searchQuery" type="text" placeholder="Search products..."
                    class="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all font-medium" />
            </div>
        </div>

        <!-- Products List -->
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div class="p-6 border-b-2 border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <h2 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CubeIcon class="h-6 w-6 text-orange-600" />
                    Products
                </h2>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="p-12 text-center">
                <div
                    class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600">
                </div>
                <p class="mt-4 text-gray-600 font-medium">Loading products...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredProducts.length === 0" class="p-12 text-center text-gray-400">
                <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                    <CubeIcon class="h-10 w-10" />
                </div>
                <p class="font-semibold text-gray-900 mb-1">{{ searchQuery ? 'No products found' : 'No products yet' }}
                </p>
                <p class="text-sm">{{ searchQuery ? 'Try a different search' : 'Add your first product!' }}</p>
            </div>

            <!-- Products Grid -->
            <div v-else class="divide-y-2 divide-gray-100">
                <div v-for="product in filteredProducts" :key="product.id"
                    class="p-5 hover:bg-gradient-to-r hover:from-orange-50 hover:to-pink-50 transition-all">
                    <div class="flex items-center justify-between gap-4">
                        <div class="flex items-center gap-4 flex-1 min-w-0">
                            <div :class="[
                                'w-4 h-4 rounded-full ring-4 ring-white shadow-lg',
                                product.is_active ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gray-300'
                            ]"></div>
                            <div class="flex-1 min-w-0">
                                <h3 class="font-bold text-lg text-gray-900 truncate">{{ product.name }}</h3>
                                <p
                                    class="text-2xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                                    ₱{{ product.price.toFixed(2) }}
                                </p>
                                <p class="text-xs font-semibold mt-1"
                                    :class="product.is_active ? 'text-green-600' : 'text-gray-500'">
                                    {{ product.is_active ? '● Active' : '○ Inactive' }}
                                </p>
                            </div>
                        </div>

                        <div class="flex gap-2 flex-shrink-0">
                            <!-- Toggle Status -->
                            <button @click="toggleProductStatus(product)" :class="[
                                'px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95',
                                product.is_active
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-lg'
                            ]">
                                {{ product.is_active ? 'Hide' : 'Show' }}
                            </button>

                            <!-- Edit -->
                            <button @click="openEditModal(product)"
                                class="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white p-3 rounded-xl transition-all shadow-lg active:scale-95">
                                <PencilIcon class="h-5 w-5" />
                            </button>

                            <!-- Delete -->
                            <button @click="confirmDelete(product)"
                                class="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white p-3 rounded-xl transition-all shadow-lg active:scale-95">
                                <TrashIcon class="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add/Edit Product Modal -->
        <div v-if="showModal"
            class="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-end sm:items-center justify-center p-4"
            @click="closeModal">
            <div class="bg-white rounded-3xl w-full sm:max-w-lg shadow-2xl mb-20" @click.stop>
                <!-- Modal Header -->
                <div class="bg-gradient-to-r from-orange-500 to-pink-500 text-white p-6 rounded-t-3xl">
                    <div class="flex justify-between items-center">
                        <h3 class="text-2xl font-black">
                            {{ editingProduct ? '✏️ Edit Product' : '➕ Add Product' }}
                        </h3>
                        <button @click="closeModal"
                            class="text-white hover:bg-white/20 rounded-full p-2 transition-all">
                            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Modal Form -->
                <form @submit.prevent="saveProduct" class="p-6 space-y-5">
                    <!-- Product Name -->
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">
                            Product Name
                        </label>
                        <input v-model="formData.name" type="text" required placeholder="e.g. Ube Pandesal"
                            class="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all font-medium" />
                    </div>

                    <!-- Price -->
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">
                            Price (₱)
                        </label>
                        <input v-model.number="formData.price" type="number" step="0.01" min="0" required
                            placeholder="0.00"
                            class="w-full px-4 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all font-medium text-2xl" />
                    </div>

                    <!-- Active Status -->
                    <div class="flex items-center gap-3 bg-gray-50 rounded-2xl p-4">
                        <input v-model="formData.is_active" type="checkbox" id="is_active"
                            class="w-6 h-6 text-orange-600 border-2 border-gray-300 rounded-lg focus:ring-4 focus:ring-orange-200" />
                        <label for="is_active" class="text-sm font-bold text-gray-700 cursor-pointer">
                            Active (show in POS)
                        </label>
                    </div>

                    <!-- Buttons -->
                    <div class="flex gap-3 pt-4">
                        <button type="button" @click="closeModal"
                            class="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-95">
                            Cancel
                        </button>
                        <button type="submit"
                            class="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95">
                            {{ editingProduct ? 'Update' : 'Add' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showConfirmDelete"
            class="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4"
            @click="cancelDelete">
            <div class="bg-white rounded-3xl w-full max-w-sm shadow-2xl" @click.stop>
                <div class="p-8 text-center">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                        <TrashIcon class="h-8 w-8 text-red-600" />
                    </div>
                    <h3 class="text-2xl font-black text-gray-900 mb-2">Delete Product?</h3>
                    <p class="text-gray-600 mb-6">
                        Are you sure you want to delete <strong>"{{ productToDelete?.name }}"</strong>? This action
                        cannot be undone.
                    </p>
                    <div class="flex gap-3">
                        <button @click="cancelDelete"
                            class="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all active:scale-95">
                            Cancel
                        </button>
                        <button @click="deleteProduct"
                            class="flex-1 px-6 py-4 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-black rounded-2xl transition-all shadow-xl active:scale-95">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>