<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useId,
  watch,
} from "vue";
import { Check, ChevronDown, Search } from "lucide-vue-next";
interface Option {
  value: string;
  label: string;
}
const props = defineProps<{
  modelValue: string;
  label: string;
  options: Option[];
}>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const id = useId(),
  root = ref<HTMLElement | null>(null),
  trigger = ref<HTMLButtonElement | null>(null),
  searchInput = ref<HTMLInputElement | null>(null);
const open = ref(false),
  query = ref(""),
  active = ref(0);
const selected = computed(
  () =>
    props.options.find((o) => o.value === props.modelValue)?.label ??
    props.label,
);
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const filtered = computed(() =>
  props.options.filter((o) =>
    normalize(o.label).includes(normalize(query.value)),
  ),
);
watch(query, () => (active.value = 0));
async function show() {
  open.value = true;
  query.value = "";
  active.value = Math.max(
    0,
    props.options.findIndex((o) => o.value === props.modelValue),
  );
  await nextTick();
  searchInput.value?.focus();
  scrollActive();
}
function close(returnFocus = false) {
  open.value = false;
  if (returnFocus) trigger.value?.focus();
}
function choose(option: Option) {
  emit("update:modelValue", option.value);
  close(true);
}
function scrollActive() {
  nextTick(() =>
    root.value
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" }),
  );
}
function keydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    close(true);
  } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const step = e.key === "ArrowDown" ? 1 : -1;
    active.value =
      (active.value + step + filtered.value.length) %
      Math.max(1, filtered.value.length);
    scrollActive();
  } else if (e.key === "Enter") {
    e.preventDefault();
    const option = filtered.value[active.value];
    if (option) choose(option);
  } else if (e.key === "Tab") close();
}
function outside(e: PointerEvent) {
  if (root.value && !root.value.contains(e.target as Node)) close();
}
onMounted(() => document.addEventListener("pointerdown", outside));
onUnmounted(() => document.removeEventListener("pointerdown", outside));
</script>
<template>
  <div ref="root" class="search-select" :class="{ 'is-open': open }">
    <button
      ref="trigger"
      type="button"
      class="select-trigger"
            :title="selected"
      :aria-label="`${label}: ${selected}`"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-controls="`${id}-options`"
      @click="open ? close() : show()"
      @keydown.down.prevent="show()"
      @keydown.up.prevent="show()"
    >
      <span class="select-icon"><slot /></span
      ><span class="select-text"
        ><span class="select-label">{{ label }}</span
        ><span class="select-value">{{ selected === 'Todas as cidades' || selected === 'Todas as categorias' ? 'Todas' : selected }}</span></span
      ><ChevronDown class="select-chevron" :size="16" />
    </button>
    <Transition name="select-popover"
      ><div v-if="open" class="select-popover">
        <div class="select-search">
          <Search :size="15" /><input
            ref="searchInput"
            v-model="query"
            type="text"
            role="combobox"
            :aria-label="`Pesquisar ${label.toLowerCase()}`"
            aria-autocomplete="list"
            aria-expanded="true"
            :aria-controls="`${id}-options`"
            :aria-activedescendant="
              filtered[active] ? `${id}-option-${active}` : undefined
            "
            :placeholder="`Buscar ${label.toLowerCase()}…`"
            autocomplete="off"
            @keydown="keydown"
          />
        </div>
        <ul
          :id="`${id}-options`"
          role="listbox"
          :aria-label="label"
          class="select-options"
        >
          <li
            v-for="(option, index) in filtered"
            :id="`${id}-option-${index}`"
            :key="option.value"
            role="option"
            :aria-selected="option.value === modelValue"
            :data-active="index === active"
            :class="{ chosen: option.value === modelValue }"
            @pointermove="active = index"
            @mousedown.prevent
            @click="choose(option)"
          >
            <span>{{ option.label }}</span
            ><Check v-if="option.value === modelValue" :size="16" />
          </li>
          <li v-if="!filtered.length" class="select-empty" role="presentation">
            Nenhuma opção encontrada.
          </li>
        </ul>
      </div></Transition
    >
  </div>
</template>
