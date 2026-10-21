<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
const props = defineProps<{ label: string; busy?: boolean; wide?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const surface = ref<HTMLElement | null>(null);
let previous: HTMLElement | null = null;
let overflow = "";
const focusable = () =>
    Array.from(
        surface.value?.querySelectorAll<HTMLElement>(
            'button:not([disabled]),a[href],input:not([disabled]),textarea,select,[tabindex="0"]',
        ) ?? [],
    ).filter((el) => el.getClientRects().length);
function keydown(e: KeyboardEvent) {
    if (e.key === "Escape" && !props.busy) {
        e.preventDefault();
        emit("close");
    }
    if (e.key === "Tab") {
        const list = focusable();
        if (!list.length) {
            e.preventDefault();
            return;
        }
        const first = list[0],
            last = list[list.length - 1];
        if (
            e.shiftKey &&
            (document.activeElement === first ||
                !surface.value?.contains(document.activeElement))
        ) {
            last.focus();
            e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
            first.focus();
            e.preventDefault();
        }
    }
}
onMounted(async () => {
    previous = document.activeElement as HTMLElement;
    overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", keydown);
    await nextTick();
    (focusable()[0] ?? surface.value)?.focus();
});
onUnmounted(() => {
    document.body.style.overflow = overflow;
    document.removeEventListener("keydown", keydown);
    previous?.focus();
});
</script>
<template>
    <div class="modal-backdrop" @click.self="!busy && emit('close')">
        <section
            ref="surface"
            class="modal"
            :class="{ wide }"
            role="dialog"
            aria-modal="true"
            :aria-label="label"
            tabindex="-1"
        >
            <slot />
        </section>
    </div>
</template>
