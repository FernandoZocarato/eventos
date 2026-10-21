// Somente a prévia estática importa este módulo. O build Laravel usa a API real.
import type { Event, User, Ticket, Status } from "./types";
interface DemoState {
    user: User | null;
    events: Event[];
    tickets: Ticket[];
}
const key = "conecta-preview-v3";
function uuid() {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    b[6] = (b[6] & 15) | 64;
    b[8] = (b[8] & 63) | 128;
    const h = Array.from(b, (n) => n.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
const organizer = { id: 100, name: "Comunidade Conecta" };
function at(days: number, hour = 19) {
    const value = new Date();
    value.setDate(value.getDate() + days);
    value.setHours(hour, 0, 0, 0);
    return value.toISOString();
}
const entries = [
    [
        "Criatividade em Movimento",
        "Criatividade",
        "São Paulo",
        "Casa de Ideias · Vila Madalena",
        "Um encontro para colocar a criatividade em movimento. Conversas inspiradoras, oficinas práticas e novas perspectivas com pessoas que também acreditam no poder de criar.\n\nTraga suas ideias, sua curiosidade e a vontade de conhecer gente nova. Não é necessário ter experiência prévia.",
    ],
    [
        "Manhã de Ideias",
        "Negócios",
        "Rio de Janeiro",
        "Hub Criativo · Botafogo",
        "Comece o dia com boas conversas sobre empreendedorismo, produtos e negócios. Um café da manhã com profissionais que estão construindo novas possibilidades.\n\nUma experiência de troca, escuta e conexões. O café é por nossa conta.",
    ],
    [
        "Jazz no Jardim",
        "Cultura",
        "Belo Horizonte",
        "Jardim das Artes · Savassi",
        "Uma tarde ao ar livre, boas companhias e o som do jazz. Venha conhecer artistas locais em um encontro intimista feito para desacelerar.\n\nTraga sua canga e aproveite uma programação musical especial.",
    ],
    [
        "Clube do Livro: Nossas raízes",
        "Cultura",
        "Curitiba",
        "Casa das Histórias · Centro",
        "Histórias que se cruzam, leituras que aproximam. Nosso clube do livro abre espaço para conversar sobre identidade, pertencimento e as raízes que nos conectam.\n\nVocê é bem-vindo mesmo que ainda não tenha terminado a leitura.",
    ],
    [
        "Corrida & Café",
        "Bem-estar",
        "São Paulo",
        "Parque Ibirapuera · Portão 3",
        "Movimente o corpo e conheça novas pessoas em uma corrida leve pelo parque, seguida de um café compartilhado. Todos os ritmos são bem-vindos.\n\nLeve água, roupas confortáveis e disposição para uma manhã diferente.",
    ],
    [
        "Design para pessoas",
        "Criatividade",
        "Porto Alegre",
        "Espaço Forma · Centro Histórico",
        "Uma conversa sobre design, acessibilidade e experiências que aproximam. Profissionais compartilham seus processos e aprendizados em projetos reais.\n\nUm encontro para estudantes, designers e pessoas curiosas sobre o universo criativo.",
    ],
];
function initial(): DemoState {
    return {
        user: null,
        tickets: [],
        events: entries.map((e, i) => ({
            id: i + 1,
            user_id: organizer.id,
            title: e[0],
            category: e[1],
            city: e[2],
            location: e[3],
            description: e[4],
            starts_at: at(7 + i * 5, i === 1 ? 9 : i === 4 ? 7 : 19),
            ends_at: at(7 + i * 5, i === 1 ? 12 : i === 4 ? 10 : 22),
            capacity: [48, 12, 83, 23, 31, 65][i],
            registrations_count: 0,
            checkins_count: 0,
            status: "published" as Status,
            color: "violet",
            user: organizer,
        })),
    };
}
let state: DemoState;
try {
    const value = localStorage.getItem(key);
    state = value ? JSON.parse(value) : initial();
} catch {
    state = initial();
}
function persist() {
    localStorage.setItem(key, JSON.stringify(state));
}
function fail(message: string): never {
    throw new Error(message);
}
function requireUser() {
    if (!state.user) fail("Entre na sua conta para continuar.");
    return state.user!;
}
function find(id: number) {
    return (
        state.events.find((e) => e.id === id) ?? fail("Evento não encontrado.")
    );
}
function hydrated(ticket: Ticket): Ticket {
    return { ...ticket, event: find(ticket.event.id) };
}
export async function demoApi<T>(
    path: string,
    method: string,
    body?: unknown,
): Promise<T> {
    const [route, query = ""] = path.split("?");
    const params = new URLSearchParams(query);
    const data = (body ?? {}) as Record<string, any>;
    let result: unknown;
    if (route === "session")
        result = { user: state.user, csrf_token: "preview-only" };
    else if ((route === "login" || route === "register") && method === "POST") {
        if (
            !String(data.email ?? "").includes("@") ||
            String(data.password ?? "").length < 8
        )
            fail(
                "Informe um e-mail e uma senha fictícia de pelo menos 8 caracteres.",
            );
        if (
            route === "register" &&
            data.password !== data.password_confirmation
        )
            fail("A confirmação da senha não confere.");
        state.user = {
            id: 1,
            name: route === "register" ? String(data.name) : "Marina Silva",
            email: String(data.email),
        };
        // Nenhuma senha é armazenada. As contas da prévia são apenas simulações.
        if (!state.events.some((e) => e.user_id === 1)) {
            state.events.push({
                ...state.events[5],
                id: 7,
                user_id: 1,
                user: state.user,
                title: "Workshop de Design Editorial",
                category: "Design",
                location: "Espaço Cubo · Rua da Consolação, 2302",
                city: "São Paulo",
                capacity: 12,
                registrations_count: 0,
                checkins_count: 0,
                description:
                    "Mergulhe no universo do design editorial contemporâneo. Neste workshop prático vamos explorar tipografia, sistemas de grids e equilíbrio entre forma e conteúdo.\n\nUma experiência para designers que querem ampliar suas possibilidades e compartilhar processos criativos.",
                starts_at: at(15, 19),
                ends_at: at(15, 23),
            });
            state.events.push({
                ...state.events[5],
                id: 8,
                user_id: 1,
                user: state.user,
                title: "Café com Tipografia",
                category: "Design",
                status: "draft",
                capacity: 15,
                registrations_count: 0,
                checkins_count: 0,
                starts_at: at(25, 10),
                ends_at: at(25, 13),
            });
            state.tickets.push({
                id: 1,
                code: uuid(),
                checked_in_at: null,
                event: state.events[5],
                user: state.user,
            });
            state.events[5].registrations_count++;
            state.tickets.push({
                id: 2,
                code: uuid(),
                checked_in_at: null,
                event: state.events[6],
                user: {
                    id: 101,
                    name: "Rafael Costa",
                    email: "rafael@example.test",
                },
            });
            state.tickets.push({
                id: 3,
                code: uuid(),
                checked_in_at: new Date().toISOString(),
                event: state.events[6],
                user: {
                    id: 102,
                    name: "Ana Martins",
                    email: "ana@example.test",
                },
            });
            state.events[6].registrations_count = 2;
            state.events[6].checkins_count = 1;
        }
        result = state.user;
    } else if (route === "logout") {
        state.user = null;
        result = null;
    } else if (route === "events" && method === "GET") {
        const q = (params.get("q") ?? "").toLowerCase(),
            city = params.get("city"),
            category = params.get("category");
        const filtered = state.events
            .filter(
                (e) =>
                    e.status === "published" &&
                    new Date(e.starts_at) > new Date() &&
                    (!q ||
                        `${e.title} ${e.description}`
                            .toLowerCase()
                            .includes(q)) &&
                    (!city || e.city === city) &&
                    (!category || e.category === category),
            )
            .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
        const page = Number(params.get("page") ?? 1);
        result = {
            data: filtered.slice((page - 1) * 12, page * 12),
            total: filtered.length,
            current_page: page,
            last_page: Math.max(1, Math.ceil(filtered.length / 12)),
        };
    } else if (route === "my-events") {
        const user = requireUser();
        result = state.events
            .filter((e) => e.user_id === user.id)
            .map((e) => ({
                ...e,
                checkins_count: state.tickets.filter(
                    (t) => t.event.id === e.id && t.checked_in_at,
                ).length,
            }));
    } else if (route === "registrations" && method === "GET") {
        const user = requireUser();
        result = state.tickets
            .filter((t) => t.user?.id === user.id)
            .map(hydrated);
    } else if (
        /^events\/\d+\/registrations$/.test(route) &&
        method === "POST"
    ) {
        const user = requireUser(),
            event = find(Number(route.split("/")[1]));
        if (
            event.status !== "published" ||
            new Date(event.starts_at) <= new Date()
        )
            fail("Inscrições encerradas.");
        if (event.user_id === user.id) fail("Você já organiza este evento.");
        if (
            state.tickets.some(
                (t) => t.event.id === event.id && t.user?.id === user.id,
            )
        )
            fail("Você já está inscrito neste evento.");
        if (event.registrations_count >= event.capacity)
            fail("As vagas esgotaram.");
        const ticket = {
            id: Math.max(0, ...state.tickets.map((t) => t.id)) + 1,
            code: uuid(),
            checked_in_at: null,
            event,
            user,
        };
        state.tickets.push(ticket);
        event.registrations_count++;
        result = ticket;
    } else if (/^registrations\/\d+$/.test(route) && method === "DELETE") {
        const user = requireUser(),
            id = Number(route.split("/")[1]),
            ticket =
                state.tickets.find(
                    (t) => t.id === id && t.user?.id === user.id,
                ) ?? fail("Ingresso não encontrado.");
        if (
            ticket.checked_in_at ||
            new Date(find(ticket.event.id).starts_at) <= new Date()
        )
            fail("Não é possível cancelar após o início ou check-in.");
        find(ticket.event.id).registrations_count--;
        state.tickets = state.tickets.filter((t) => t.id !== id);
        result = null;
    } else if (/^events\/\d+\/attendees$/.test(route)) {
        const user = requireUser(),
            event = find(Number(route.split("/")[1]));
        if (event.user_id !== user.id) fail("Acesso restrito ao organizador.");
        result = state.tickets
            .filter((t) => t.event.id === event.id)
            .map(hydrated);
    } else if (/^events\/\d+\/checkin$/.test(route)) {
        const user = requireUser(),
            event = find(Number(route.split("/")[1]));
        if (event.user_id !== user.id) fail("Acesso restrito ao organizador.");
        if (event.status !== "published")
            fail("O evento precisa estar publicado.");
        const ticket =
            state.tickets.find(
                (t) => t.event.id === event.id && t.code === data.code,
            ) ?? fail("Ingresso não encontrado.");
        if (ticket.checked_in_at) fail("Ingresso já utilizado.");
        ticket.checked_in_at = new Date().toISOString();
        result = hydrated(ticket);
    } else if (
        (route === "events" && method === "POST") ||
        (/^events\/\d+$/.test(route) && method === "PUT")
    ) {
        const user = requireUser();
        if (String(data.description ?? "").length < 30)
            fail("A descrição precisa ter pelo menos 30 caracteres.");
        if (
            new Date(data.starts_at) <= new Date() ||
            new Date(data.ends_at) <= new Date(data.starts_at)
        )
            fail("Confira o início e o término do evento.");
        if (!Number.isInteger(data.capacity) || data.capacity < 1)
            fail("Informe uma capacidade válida.");
        if (method === "POST") {
            const event = {
                ...data,
                id: Math.max(...state.events.map((e) => e.id)) + 1,
                user_id: user.id,
                user,
                registrations_count: 0,
                checkins_count: 0,
            } as Event;
            state.events.push(event);
            result = event;
        } else {
            const event = find(Number(route.split("/")[1]));
            if (event.user_id !== user.id)
                fail("Acesso restrito ao organizador.");
            if (data.capacity < event.registrations_count)
                fail(
                    "A capacidade não pode ser menor que o número de inscritos.",
                );
            Object.assign(event, data);
            result = event;
        }
    } else if (/^events\/\d+$/.test(route) && method === "GET") {
        const event = find(Number(route.split("/")[1]));
        if (event.status !== "published" && event.user_id !== state.user?.id)
            fail("Evento não encontrado.");
        result = event;
    } else fail("Esta operação não está disponível na prévia.");
    persist();
    return JSON.parse(JSON.stringify(result)) as T;
}
