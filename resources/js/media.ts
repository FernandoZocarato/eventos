import type { Event } from "./types";
export const heroImage = "/images/hero.jpg";
export function eventImage(event: Pick<Event, "title" | "category">): string {
    const title = event.title.toLowerCase();
    if (title.includes("jazz") || title.includes("música"))
        return "/images/jazz.jpg";
    if (title.includes("corrida") || event.category === "Bem-estar")
        return "/images/running.jpg";
    if (title.includes("livro") || event.category === "Comunidade")
        return "/images/community.jpg";
    if (event.category === "Negócios") return "/images/business.jpg";
    if (event.category === "Design" || title.includes("design"))
        return "/images/design.jpg";
    return "/images/creativity.jpg";
}
