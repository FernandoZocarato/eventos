<script setup lang="ts">
defineProps<{ color: string; category: string; large?: boolean }>();
</script>
<template>
    <div class="event-art" :class="[color, { large }]" aria-hidden="true">
        <div class="art-grid"></div>
        <span class="art-word">{{
            category === "Tecnologia"
                ? "BUILD"
                : category === "Design"
                  ? "CREATE"
                  : category === "Negócios"
                    ? "NEXT"
                    : category === "Cultura"
                      ? "FEEL"
                      : "TOGETHER"
        }}</span>
        <div class="orb orb-one"></div>
        <div class="orb orb-two"></div>
        <div class="art-ring"></div>
        <span class="art-caption">CONECTA / ENCONTROS QUE FICAM</span
        ><span class="art-star">✳</span>
    </div>
</template>
