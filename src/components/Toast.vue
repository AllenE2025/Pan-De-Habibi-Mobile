<script setup lang="ts">
import { ref, watch } from 'vue';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline';

interface Props {
    show: boolean;
    type?: 'success' | 'error';
    message: string;
    duration?: number;
}

const props = withDefaults(defineProps<Props>(), {
    type: 'success',
    duration: 3000,
});

const emit = defineEmits<{
    close: [];
}>();

const isVisible = ref(props.show);

watch(() => props.show, (newVal) => {
    isVisible.value = newVal;
    if (newVal && props.duration > 0) {
        setTimeout(() => {
            close();
        }, props.duration);
    }
});

const close = () => {
    isVisible.value = false;
    emit('close');
};
</script>

<template>
    <Transition enter-active-class="transition ease-out duration-300" enter-from-class="translate-y-full opacity-0"
        enter-to-class="translate-y-0 opacity-100" leave-active-class="transition ease-in duration-200"
        leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-full opacity-0">
        <div v-if="isVisible" :class="[
            'fixed bottom-24 left-4 right-4 rounded-2xl shadow-2xl p-4 z-50',
            type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-rose-500'
        ]">
            <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                    <CheckCircleIcon v-if="type === 'success'" class="h-6 w-6 text-white" />
                    <XCircleIcon v-else class="h-6 w-6 text-white" />
                </div>
                <p class="flex-1 text-white font-medium">{{ message }}</p>
                <button @click="close" class="flex-shrink-0 text-white hover:text-gray-200 transition-colors">
                    <XMarkIcon class="h-5 w-5" />
                </button>
            </div>
        </div>
    </Transition>
</template>