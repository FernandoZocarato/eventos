<script setup lang="ts">
import { Heart, MapPin, Clock3 } from "lucide-vue-next";
import type { Event } from "../types";
import { eventImage } from "../media";
defineProps<{ event: Event; saved?: boolean }>();
defineEmits<{ open: [event: Event]; save: [id: number] }>();
const day = (value: string) =>
    new Date(value).toLocaleDateString("pt-BR", { day: "2-digit" });
const month = (value: string) =>
    new Date(value)
        .toLocaleDateString("pt-BR", { month: "short" })
        .replace(".", "");
</script>
<template>
    <article class="event-card">
        <div class="card-cover">
            <button
                class="cover-link"
                :aria-label="`Ver ${event.title}`"
                @click="$emit('open', event)"
            >
                <img
                    :src="eventImage(event)"
                    :alt="event.title"
                    loading="lazy"
                    width="750"
                    height="600"
                /></button
            ><button
                class="save-button"
                :class="{ saved }"
                :aria-label="`${saved ? 'Remover dos salvos' : 'Salvar'} ${event.title}`"
                :aria-pressed="!!saved"
                @click="$emit('save', event.id)"
            >
                <Heart
                    :size="20"
                    :fill="saved ? 'currentColor' : 'none'"
                /></button
            ><span class="category-badge"><i></i>{{ event.category }}</span>
        </div>
        <button class="card-info" @click="$emit('open', event)">
            <span class="card-date"
                ><small>{{ month(event.starts_at) }}</small
                ><strong>{{ day(event.starts_at) }}</strong></span
            ><span class="card-copy"
                ><h3>{{ event.title }}</h3>
                <span class="card-location"
                    ><MapPin :size="13" />{{ event.city }}<span>·</span
                    ><Clock3 :size="13" />{{
                        new Date(event.starts_at).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                    }}</span
                ><span class="spots"
                    >{{
                        Math.max(0, event.capacity - event.registrations_count)
                    }}
                    lugares disponíveis</span
                ></span
            >
        </button>
    </article>
</template>
