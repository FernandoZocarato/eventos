<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  MapPin,
  Plus,
  Ticket as TicketIcon,
  CalendarDays,
  X,
  Users,
  Check,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  LayoutDashboard,
  Compass,
  Menu,
  Copy,
  CheckCircle2,
  Sparkles,
  UserRound,
  Heart,
  Link as LinkIcon,
  ChevronDown,
  ArrowLeft,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ExternalLink,
  Pencil,
  TicketCheck,
} from "lucide-vue-next";
import QRCode from "qrcode";
import { api, setToken } from "./api";
import type { Event, User, Ticket, Page, Status } from "./types";
import EventCard from "./components/EventCard.vue";
import { eventImage, heroImage } from "./media";
import DialogSurface from "./components/DialogSurface.vue";
import SearchSelect from "./components/SearchSelect.vue";
const user = ref<User | null>(null),
  ready = ref(false),
  loading = ref(true),
  busy = ref(false),
  mobileNav = ref(false);
const view = ref("explorar"),
  events = ref<Event[]>([]),
  mine = ref<Event[]>([]),
  tickets = ref<Ticket[]>([]),
  attendees = ref<Ticket[]>([]);
const categories = [
  "Todos",
  "Criatividade",
  "Negócios",
  "Cultura",
  "Bem-estar",
  "Tecnologia",
  "Design",
  "Comunidade",
];
const cities = [
  "São Paulo",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Curitiba",
  "Porto Alegre",
];
const category = ref("Todos"),
  query = ref(""),
  city = ref(""),
  page = ref(1),
  lastPage = ref(1),
  total = ref(0);
const error = ref(""),
  notice = ref(""),
  modalError = ref("");
const selected = ref<Event | null>(null),
  ticket = ref<Ticket | null>(null),
  qr = ref("");
const auth = ref<"login" | "register" | null>(null),
  afterAuth = ref<(() => void) | null>(null),
  authForm = ref({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
const editing = ref(false),
  editingId = ref<number | null>(null),
  manage = ref<Event | null>(null),
  checkCode = ref("");
const emptyForm = () => ({
  title: "",
  category: "Tecnologia",
  description: "",
  city: "",
  location: "",
  starts_at: "",
  ends_at: "",
  capacity: 100,
  status: "draft" as Status,
  color: "violet",
});
const form = ref(emptyForm());
const stats = computed(() => ({
  events: mine.value.length,
  registrations: mine.value.reduce((n, e) => n + e.registrations_count, 0),
  published: mine.value.filter((e) => e.status === "published").length,
}));
const registered = computed(
  () =>
    selected.value &&
    tickets.value.some((t) => t.event.id === selected.value?.id),
);
const ticketTab = ref("upcoming"),
  panelTab = ref("overview"),
  panelQuery = ref(""),
  panelStatus = ref("all"),
  showPassword = ref(false),
  onlySaved = ref(false);
const saved = ref<number[]>([]);
try {
  saved.value = JSON.parse(
    localStorage.getItem("conecta-saved") ?? "[]",
  ).filter((id: unknown) => typeof id === "number");
} catch {}
const visibleEvents = computed(() =>
  onlySaved.value
    ? events.value.filter((e) => saved.value.includes(e.id))
    : events.value,
);
const visibleMine = computed(() =>
  mine.value.filter(
    (e) =>
      (panelStatus.value === "all" || e.status === panelStatus.value) &&
      e.title.toLowerCase().includes(panelQuery.value.toLowerCase()),
  ),
);
const visibleTickets = computed(() =>
  tickets.value.filter((t) =>
    ticketTab.value === "upcoming"
      ? new Date(t.event.ends_at) > new Date() && t.event.status !== "cancelled"
      : new Date(t.event.ends_at) <= new Date() ||
        t.event.status === "cancelled",
  ),
);
const checkinTotal = computed(() =>
  mine.value.reduce((n, e) => n + (e.checkins_count ?? 0), 0),
);
const info = ref<string | null>(null);
const isDemo = import.meta.env.VITE_DEMO_MODE === "true";
let noticeTimer: ReturnType<typeof setTimeout>;
watch(notice, (value) => {
  clearTimeout(noticeTimer);
  if (value) noticeTimer = setTimeout(() => (notice.value = ""), 5500);
});
function toggleSaved(id: number) {
  saved.value = saved.value.includes(id)
    ? saved.value.filter((v) => v !== id)
    : [...saved.value, id];
  try {
    localStorage.setItem("conecta-saved", JSON.stringify(saved.value));
  } catch {}
}
function showAuth(mode: "login" | "register") {
  auth.value = mode;
  modalError.value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function explore() {
  void navigate("explorar");
  nextTick(() =>
    document.querySelector("#agenda")?.scrollIntoView({ behavior: "smooth" }),
  );
}
async function shareEvent(event: Event) {
  try {
    await navigator.clipboard.writeText(
      `${location.origin}${location.pathname}#evento/${event.id}`,
    );
    notice.value = "Link do evento copiado.";
  } catch {
    notice.value = "Copie o endereço na barra do navegador para compartilhar.";
  }
}
function message(e: unknown) {
  return e instanceof Error ? e.message : "Ocorreu um erro. Tente novamente.";
}
async function session() {
  const data = await api<{ user: User | null; csrf_token: string }>("session");
  user.value = data.user;
  setToken(data.csrf_token);
}
let requestId = 0;
async function loadEvents() {
  const id = ++requestId;
  loading.value = true;
  error.value = "";
  try {
    const search = new URLSearchParams({
      q: query.value,
      city: city.value,
      page: String(page.value),
    });
    if (category.value !== "Todos") search.set("category", category.value);
    const data = await api<Page<Event>>(`events?${search}`);
    if (id === requestId) {
      events.value = data.data;
      lastPage.value = data.last_page;
      total.value = data.total;
    }
  } catch (e) {
    if (id === requestId) error.value = message(e);
  } finally {
    if (id === requestId) loading.value = false;
  }
}
async function loadPersonal() {
  if (!user.value) return;
  const [a, b] = await Promise.all([
    api<Event[]>("my-events"),
    api<Ticket[]>("registrations"),
  ]);
  mine.value = a;
  tickets.value = b;
}
function requireUser(action: () => void) {
  if (!user.value) {
    afterAuth.value = action;
    showAuth("login");
  } else action();
}
async function navigate(destination: string) {
  mobileNav.value = false;
  if (destination !== "explorar" && !user.value) {
    requireUser(() => void navigate(destination));
    return;
  }
  selected.value = null;
  ticket.value = null;
  manage.value = null;
  editing.value = false;
  view.value = destination;
  window.location.hash = destination;
  error.value = "";
  if (destination !== "explorar") {
    loading.value = true;
    try {
      await loadPersonal();
    } catch (e) {
      error.value = message(e);
    } finally {
      loading.value = false;
    }
  }
}
function filter(value: string) {
  category.value = value;
  page.value = 1;
  void loadEvents();
}
function search() {
  page.value = 1;
  void loadEvents();
}
function changePage(n: number) {
  page.value = n;
  void loadEvents();
  document.querySelector("#agenda")?.scrollIntoView({ behavior: "smooth" });
}
async function openEvent(event: Event) {
  modalError.value = "";
  selected.value = event;
  window.scrollTo({ top: 0, behavior: "smooth" });
  window.location.hash = `evento/${event.id}`;
  try {
    selected.value = await api<Event>(`events/${event.id}`);
  } catch (e) {
    modalError.value = message(e);
  }
}
function closeDetail() {
  selected.value = null;
  window.location.hash = view.value;
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function enterDemo() {
  authForm.value = {
    name: "Marina Silva",
    email: "marina@example.test",
    password: "preview-only",
    password_confirmation: "preview-only",
  };
  auth.value = "login";
  await submitAuth();
}
async function submitAuth() {
  busy.value = true;
  modalError.value = "";
  try {
    await api(
      auth.value === "register" ? "register" : "login",
      "POST",
      authForm.value,
    );
    await session();
    await loadPersonal();
    auth.value = null;
    authForm.value = {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
    };
    const action = afterAuth.value;
    afterAuth.value = null;
    action?.();
  } catch (e) {
    modalError.value = message(e);
  } finally {
    busy.value = false;
  }
}
async function logout() {
  busy.value = true;
  try {
    await api("logout", "POST");
    await session();
    mine.value = [];
    tickets.value = [];
    await navigate("explorar");
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
async function register() {
  if (!selected.value) return;
  const event = selected.value;
  requireUser(async () => {
    busy.value = true;
    modalError.value = "";
    try {
      const result = await api<Ticket>(
        `events/${event.id}/registrations`,
        "POST",
      );
      selected.value = null;
      await loadPersonal();
      await loadEvents();
      await showTicket(tickets.value.find((t) => t.id === result.id) ?? result);
      notice.value = "Inscrição confirmada. Seu próximo encontro está marcado!";
    } catch (e) {
      modalError.value = message(e);
    } finally {
      busy.value = false;
    }
  });
}
async function showTicket(value: Ticket) {
  modalError.value = "";
  ticket.value = value;
  qr.value = "";
  try {
    qr.value = await QRCode.toDataURL(value.code, {
      width: 240,
      margin: 2,
      color: { dark: "#19172c", light: "#ffffff" },
    });
  } catch (e) {
    modalError.value = message(e);
  }
}
async function cancelTicket(value: Ticket) {
  if (
    !window.confirm(
      "Cancelar sua inscrição? A vaga será liberada para outra pessoa.",
    )
  )
    return;
  busy.value = true;
  modalError.value = "";
  try {
    await api(`registrations/${value.id}`, "DELETE");
    ticket.value = null;
    await loadPersonal();
    await loadEvents();
    notice.value = "Inscrição cancelada.";
  } catch (e) {
    modalError.value = message(e);
  } finally {
    busy.value = false;
  }
}
function newEvent() {
  requireUser(() => {
    selected.value = null;
    editingId.value = null;
    form.value = emptyForm();
    modalError.value = "";
    editing.value = true;
  });
}
function localDate(value: string) {
  const date = new Date(value);
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}
function edit(event: Event) {
  editingId.value = event.id;
  form.value = {
    title: event.title,
    category: event.category,
    description: event.description,
    city: event.city,
    location: event.location,
    starts_at: localDate(event.starts_at),
    ends_at: localDate(event.ends_at),
    capacity: event.capacity,
    status: event.status,
    color: event.color,
  };
  modalError.value = "";
  editing.value = true;
}
async function saveEvent() {
  busy.value = true;
  modalError.value = "";
  try {
    const payload = {
      ...form.value,
      starts_at: new Date(form.value.starts_at).toISOString(),
      ends_at: new Date(form.value.ends_at).toISOString(),
    };
    await api(
      editingId.value ? `events/${editingId.value}` : "events",
      editingId.value ? "PUT" : "POST",
      payload,
    );
    editing.value = false;
    notice.value = editingId.value
      ? "Evento atualizado."
      : "Seu evento foi criado!";
    await navigate("painel");
    await loadEvents();
  } catch (e) {
    modalError.value = message(e);
  } finally {
    busy.value = false;
  }
}
async function openManage(event: Event) {
  manage.value = event;
  attendees.value = [];
  checkCode.value = "";
  modalError.value = "";
  busy.value = true;
  try {
    attendees.value = await api<Ticket[]>(`events/${event.id}/attendees`);
  } catch (e) {
    modalError.value = message(e);
  } finally {
    busy.value = false;
  }
}
async function checkin() {
  if (!manage.value) return;
  busy.value = true;
  modalError.value = "";
  try {
    const result = await api<Ticket>(
      `events/${manage.value.id}/checkin`,
      "POST",
      { code: checkCode.value.trim() },
    );
    attendees.value = attendees.value.map((t) =>
      t.id === result.id ? result : t,
    );
    checkCode.value = "";
    await loadPersonal();
    notice.value = `Check-in confirmado: ${result.user?.name}.`;
  } catch (e) {
    modalError.value = message(e);
  } finally {
    busy.value = false;
  }
}
async function copyCode(code: string) {
  try {
    await navigator.clipboard.writeText(code);
    notice.value = "Código copiado.";
  } catch {
    modalError.value =
      "Não foi possível copiar. Selecione o código e copie manualmente.";
  }
}
const date = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
const time = (value: string) =>
  new Date(value).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
const status = (value: Status) =>
  ({ draft: "Rascunho", published: "Publicado", cancelled: "Cancelado" })[
    value
  ];
function onKey(event: KeyboardEvent) {
  if (event.key === "Escape" && !busy.value) {
    if (auth.value) {
      auth.value = null;
      afterAuth.value = null;
    }
  }
}
async function hashChange() {
  const hash = window.location.hash.slice(1);
  if (hash.startsWith("evento/")) {
    const id = Number(hash.split("/")[1]);
    if (selected.value?.id === id) return;
    try {
      await openEvent(await api<Event>(`events/${id}`));
    } catch (e) {
      error.value = message(e);
    }
  } else if (["explorar", "painel", "ingressos"].includes(hash)) {
    if (selected.value) selected.value = null;
    if (hash !== view.value) await navigate(hash);
  }
}
onMounted(async () => {
  window.addEventListener("keydown", onKey);
  window.addEventListener("hashchange", hashChange);
  try {
    await session();
    await Promise.all([loadEvents(), loadPersonal()]);
    await hashChange();
  } catch (e) {
    error.value = message(e);
  } finally {
    ready.value = true;
    loading.value = false;
  }
});
onUnmounted(() => {
  clearTimeout(noticeTimer);
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("hashchange", hashChange);
});
</script>

<template>
  <div
    :class="[
      'app-shell',
      {
        'dashboard-shell': view === 'painel' && user && !auth && !selected,
      },
    ]"
  >
    <header
      v-if="!(view === 'painel' && user && !auth && !selected) && !auth"
      class="header"
    >
      <div class="nav-wrap">
        <a
          href="#explorar"
          class="brand"
          aria-label="Conecta início"
          @click.prevent="navigate('explorar')"
          ><span class="brand-icon"><Sparkles :size="19" /></span>conecta<span
            class="brand-dot"
            >.</span
          ></a
        >
        <nav :class="{ mobile: mobileNav }" aria-label="Navegação principal">
          <a
            href="#explorar"
            :class="{ active: view === 'explorar' }"
            @click.prevent="explore"
            >Explorar</a
          ><a
            href="#ingressos"
            :class="{ active: view === 'ingressos' }"
            @click.prevent="navigate('ingressos')"
            >Meus ingressos</a
          ><a
            href="#painel"
            :class="{ active: view === 'painel' }"
            @click.prevent="navigate('painel')"
            >Meu painel</a
          ><button class="nav-link" @click="newEvent">Criar evento</button>
        </nav>
        <div class="nav-actions">
          <template v-if="!user"
            ><button class="text-button login-nav" @click="showAuth('login')">
              Entrar</button
            ><button class="btn btn-dark" @click="showAuth('register')">
              <UserRound :size="16" />Criar conta
            </button></template
          ><template v-else
            ><button class="account-link" @click="navigate('painel')">
              <span class="avatar">{{ user.name[0].toUpperCase() }}</span
              ><span>{{ user.name.split(" ")[0] }}</span></button
            ><button
              class="icon-button logout-nav"
              aria-label="Sair da conta"
              @click="logout"
              :disabled="busy"
            >
              <LogOut :size="17" /></button></template
          ><button
            class="icon-button hamburger"
            :aria-expanded="mobileNav"
            aria-label="Abrir navegação"
            @click="mobileNav = !mobileNav"
          >
            <Menu />
          </button>
        </div>
      </div>
    </header>
    <div v-if="isDemo" class="demo-indicator">
      <span></span>Prévia interativa · dados fictícios salvos neste navegador
    </div>
    <div v-if="error" class="container">
      <div role="alert" class="global-error">
        {{ error }}<button @click="loadEvents">Tentar novamente</button>
      </div>
    </div>
    <main v-if="auth" class="auth-page">
      <section class="auth-form-panel">
        <a
          href="#explorar"
          class="brand"
          @click.prevent="
            auth = null;
            afterAuth = null;
            navigate('explorar');
          "
          ><span class="brand-icon"><Sparkles :size="20" /></span>conecta<span
            class="brand-dot"
            >.</span
          ></a
        ><button
          class="back-link"
          @click="
            auth = null;
            afterAuth = null;
          "
        >
          <ArrowLeft :size="16" />Voltar
        </button>
        <div class="auth-content">
          <span class="eyebrow">SEU PRÓXIMO ENCONTRO COMEÇA AQUI</span>
          <h1>
            {{
              auth === "login"
                ? "Bem-vindo de volta."
                : "Tudo começa com uma conexão."
            }}
          </h1>
          <p>
            {{
              auth === "login"
                ? "Acesse sua conta para gerenciar seus eventos e ingressos."
                : "Crie sua conta gratuita e descubra o que acontece ao seu redor."
            }}
          </p>
          <form @submit.prevent="submitAuth">
            <label v-if="auth === 'register'"
              >SEU NOME
              <div class="input-icon">
                <UserRound :size="18" /><input
                  v-model="authForm.name"
                  required
                  maxlength="100"
                  autocomplete="name"
                  placeholder="Como podemos te chamar?"
                /></div></label
            ><label
              >E-MAIL
              <div class="input-icon">
                <Mail :size="18" /><input
                  v-model="authForm.email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="voce@exemplo.com"
                /></div></label
            ><label
              >SENHA
              <div class="input-icon">
                <LockKeyhole :size="18" /><input
                  v-model="authForm.password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  minlength="8"
                  :autocomplete="
                    auth === 'login' ? 'current-password' : 'new-password'
                  "
                  placeholder="Pelo menos 8 caracteres"
                /><button
                  type="button"
                  class="icon-button"
                  :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" :size="18" /><Eye
                    v-else
                    :size="18"
                  />
                </button></div></label
            ><label v-if="auth === 'register'"
              >CONFIRME SUA SENHA<input
                v-model="authForm.password_confirmation"
                type="password"
                required
                minlength="8"
                autocomplete="new-password"
                placeholder="Repita sua senha"
            /></label>
            <p v-if="modalError" class="form-error" role="alert">
              {{ modalError }}
            </p>
            <p v-if="isDemo" class="field-help">
              Na prévia, use qualquer e-mail e uma senha fictícia de 8
              caracteres. Não use sua senha real.
            </p>
            <button
              class="btn btn-purple full"
              type="submit"
              :disabled="busy || !ready"
            >
              <LoaderCircle v-if="busy" class="spin" :size="18" />{{
                auth === "login" ? "Entrar na Conecta" : "Criar minha conta"
              }}<ArrowRight :size="18" />
            </button>
          </form>
          <button
            v-if="isDemo"
            class="btn btn-outline full demo-login"
            type="button"
            @click="enterDemo"
            :disabled="busy"
          >
            Explorar demonstração<ArrowUpRight :size="17" />
          </button>
          <p class="auth-switch">
            {{
              auth === "login"
                ? "Não tem uma conta?"
                : "Já faz parte da comunidade?"
            }}<button
              @click="
                auth = auth === 'login' ? 'register' : 'login';
                modalError = '';
              "
              :disabled="busy"
            >
              {{ auth === "login" ? "Cadastre-se grátis" : "Entre aqui" }}
            </button>
          </p>
        </div>
        <small class="auth-note">Pessoas reais. Experiências que ficam.</small>
      </section>
      <aside class="auth-art">
        <img :src="heroImage" alt="Pessoas reunidas em um evento ao vivo" />
        <div class="auth-art-overlay">
          <span class="auth-asterisk">✳</span>
          <h2>Menos scroll.<br />Mais histórias.</h2>
          <p>Seu próximo encontro pode mudar a forma como você vê o mundo.</p>
          <span class="auth-art-caption">CONECTA · FEITO PARA APROXIMAR</span>
        </div>
      </aside>
    </main>
    <main v-else-if="selected" class="container detail-page">
      <button class="back-link" @click="closeDetail">
        <ArrowLeft :size="16" />Voltar para os eventos
      </button>
      <div class="detail-grid">
        <article class="detail-main">
          <div class="detail-cover">
            <img :src="eventImage(selected)" :alt="selected.title" /><span
              class="category-badge"
              ><i></i>{{ selected.category }}</span
            >
          </div>
          <h1>{{ selected.title }}</h1>
          <div class="organizer-meta">
            <span class="avatar">{{ selected.user?.name[0] ?? "C" }}</span
            ><span
              ><small>ORGANIZADO POR</small
              ><strong>{{ selected.user?.name ?? "Organizador" }}</strong></span
            ><span class="meta-divider"></span><Users :size="21" /><span
              ><small>CAPACIDADE</small
              ><strong>{{ selected.capacity }} pessoas</strong></span
            >
          </div>
          <section class="about-event">
            <h2>Sobre o evento</h2>
            <p>{{ selected.description }}</p>
          </section>
        </article>
        <aside class="detail-sidebar">
          <section class="booking-card">
            <div class="booking-top">
              <span class="eyebrow">INSCRIÇÕES ABERTAS</span
              ><span
                v-if="selected.capacity - selected.registrations_count < 20"
                class="status draft"
                >Últimas vagas</span
              >
            </div>
            <h2>Grátis<span class="lime-dot">.</span></h2>
            <div class="event-facts">
              <div>
                <span class="fact-icon"><CalendarDays :size="21" /></span
                ><span
                  ><strong>{{ date(selected.starts_at) }}</strong
                  ><small
                    >{{ time(selected.starts_at) }} às
                    {{ time(selected.ends_at)
                    }}<template
                      v-if="date(selected.starts_at) !== date(selected.ends_at)"
                    >
                      ·
                      {{ date(selected.ends_at) }}</template
                    ></small
                  ></span
                >
              </div>
              <div>
                <span class="fact-icon"><MapPin :size="21" /></span
                ><span
                  ><strong>{{ selected.location }}</strong
                  ><small>{{ selected.city }}</small
                  ><a
                    :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selected.location + ' ' + selected.city)}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    >Ver no mapa<ExternalLink :size="11" /></a
                ></span>
              </div>
              <div>
                <span class="fact-icon"><Users :size="21" /></span
                ><span
                  ><strong
                    >{{
                      Math.max(
                        0,
                        selected.capacity - selected.registrations_count,
                      )
                    }}
                    lugares disponíveis</strong
                  ><small>Encontre sua comunidade</small></span
                >
              </div>
            </div>
            <p v-if="modalError" class="form-error" role="alert">
              {{ modalError }}
            </p>
            <button
              v-if="selected.user_id === user?.id"
              class="btn btn-purple full"
              @click="edit(selected)"
            >
              Editar meu evento<Pencil :size="16" /></button
            ><button
              v-else
              class="btn btn-purple full"
              @click="register"
              :disabled="
                busy ||
                !!registered ||
                selected.registrations_count >= selected.capacity ||
                selected.status !== 'published' ||
                new Date(selected.starts_at) <= new Date()
              "
            >
              <LoaderCircle v-if="busy" class="spin" :size="17" />{{
                registered
                  ? "Você já está inscrito"
                  : selected.status === "cancelled"
                    ? "Evento cancelado"
                    : new Date(selected.starts_at) <= new Date()
                      ? "Inscrições encerradas"
                      : selected.registrations_count >= selected.capacity
                        ? "Vagas esgotadas"
                        : "Garantir meu lugar"
              }}<ArrowUpRight :size="18" />
            </button>
            <p class="booking-note">
              Inscrição gratuita. Seu ingresso fica disponível em “Meus
              ingressos”.
            </p>
          </section>
          <section class="share-card">
            <h3>Coisas boas ficam melhores juntas.</h3>
            <p>Chame alguém para viver essa experiência.</p>
            <button class="btn btn-outline" @click="shareEvent(selected)">
              <LinkIcon :size="16" />Copiar link do evento
            </button>
          </section>
        </aside>
      </div>
    </main>
    <main v-else-if="view === 'explorar'">
      <section class="hero container" id="inicio">
        <div class="hero-layout">
          <div class="hero-copy">
            <span class="eyebrow hero-eyebrow"
              ><span class="live-dot"></span>ENCONTROS QUE FAZEM SENTIDO</span
            >
            <h1>
              Boas<br />conexões<br /><em>começam</em> ao<br />vivo<span
                class="lime-dot"
                >.</span
              >
            </h1>
            <p>
              Descubra experiências, pessoas e ideias que<br
                class="desktop-break"
              />
              tornam seus dias mais interessantes.
            </p>
          </div>
          <div class="hero-photo">
            <img
              :src="heroImage"
              alt="Pessoas aproveitando um show"
              width="900"
              height="640"
            />
            <div class="photo-label">
              <Sparkles :size="19" /><span
                ><strong>Gente que se encontra.</strong
                ><small>Histórias que ficam.</small></span
              >
            </div>
          </div>
        </div>
        <form
          class="search-bar"
          @submit.prevent="
            search();
            explore();
          "
        >
          <label class="search-keyword"
            ><Search :size="20" /><input
              v-model="query"
              aria-label="Buscar eventos"
              placeholder="O que você quer viver?"
              maxlength="100"
          /></label>
          <SearchSelect
            v-model="city"
            label="Cidade"
            :options="[
              { value: '', label: 'Todas as cidades' },
              ...cities.map((c) => ({ value: c, label: c })),
            ]"
            ><MapPin :size="18"
          /></SearchSelect>
          <SearchSelect
            v-model="category"
            label="Categoria"
            :options="[
              { value: 'Todos', label: 'Todas as categorias' },
              ...categories.slice(1).map((c) => ({ value: c, label: c })),
            ]"
            ><Compass :size="18"
          /></SearchSelect>
          <button class="btn btn-purple" type="submit">
            Buscar eventos<ArrowUpRight :size="17" />
          </button>
        </form>
      </section>
      <section class="discovery container" id="agenda">
        <div class="section-header">
          <div>
            <span class="eyebrow">PARA VOCÊ</span>
            <h2>Acontece por perto<span class="lime-dot">.</span></h2>
          </div>
          <button
            class="all-events"
            @click="
              query = '';
              city = '';
              category = 'Todos';
              onlySaved = false;
              search();
            "
          >
            Ver todos<ArrowUpRight :size="18" />
          </button>
        </div>
        <div class="discovery-tools">
          <div class="filters" aria-label="Filtrar por categoria">
            <button
              v-for="c in categories"
              :key="c"
              :class="['filter', { selected: category === c }]"
              :aria-pressed="category === c"
              @click="filter(c)"
            >
              {{ c }}
            </button>
          </div>
          <button
            :class="['saved-filter', { active: onlySaved }]"
            :aria-pressed="onlySaved"
            @click="onlySaved = !onlySaved"
          >
            <Heart :size="15" />Salvos<small>{{ saved.length }}</small>
          </button>
        </div>
        <div
          v-if="loading"
          class="event-grid skeleton-grid"
          aria-label="Carregando eventos"
          aria-busy="true"
        >
          <div v-for="i in 6" :key="i" class="skeleton-card">
            <div></div>
            <span></span><span></span>
          </div>
        </div>
        <div v-else-if="!visibleEvents.length" class="empty-state">
          <Search :size="35" />
          <h3>
            {{
              onlySaved
                ? "Seus próximos favoritos estão por aí."
                : "Nenhum encontro por aqui. Ainda."
            }}
          </h3>
          <p>
            {{
              onlySaved
                ? "Toque no coração de um evento para salvá-lo."
                : "Tente outra cidade, categoria ou palavra-chave."
            }}
          </p>
          <button
            class="btn btn-outline"
            @click="
              query = '';
              city = '';
              category = 'Todos';
              onlySaved = false;
              search();
            "
          >
            Ver todos os eventos<ArrowRight :size="16" />
          </button>
        </div>
        <div v-else class="event-grid">
          <EventCard
            v-for="event in visibleEvents"
            :key="event.id"
            :event="event"
            :saved="saved.includes(event.id)"
            @open="openEvent"
            @save="toggleSaved"
          />
        </div>
        <div v-if="!loading" class="results-footer">
          <span>{{
            onlySaved
              ? `${visibleEvents.length} favoritos nesta página`
              : `Mostrando ${events.length} de ${total} eventos`
          }}</span>
          <div v-if="lastPage > 1" class="pagination">
            <button
              class="icon-button"
              :disabled="page === 1"
              aria-label="Página anterior"
              @click="changePage(page - 1)"
            >
              <ChevronLeft /></button
            ><span>{{ page }} / {{ lastPage }}</span
            ><button
              class="icon-button"
              :disabled="page === lastPage"
              aria-label="Próxima página"
              @click="changePage(page + 1)"
            >
              <ChevronRight />
            </button>
          </div>
          <span class="result-note">Boas experiências. Entrada gratuita.</span>
        </div>
      </section>
      <section class="organizer-banner">
        <div class="container organizer-inner">
          <div>
            <span class="eyebrow">SEU MOMENTO</span>
            <h2>Toda boa ideia<br />merece uma <em>plateia.</em></h2>
            <p>
              Crie um evento, reúna sua comunidade e transforme<br
                class="desktop-break"
              />
              planos em encontros inesquecíveis.
            </p>
            <button class="btn btn-lime" @click="newEvent">
              Criar meu evento<ArrowUpRight :size="19" />
            </button>
          </div>
          <span class="banner-art" aria-hidden="true">✳</span>
          <div class="banner-note" aria-hidden="true">
            FAÇA<br />ACONTECER<span>↗</span>
          </div>
        </div>
      </section>
    </main>
    <main v-else-if="view === 'painel' && user" class="dashboard">
      <aside class="dashboard-sidebar">
        <a class="brand" href="#explorar" @click.prevent="navigate('explorar')"
          ><span class="brand-icon"><Sparkles :size="18" /></span>conecta<span
            class="brand-dot"
            >.</span
          ></a
        ><span class="sidebar-caption">PAINEL DO ORGANIZADOR</span>
        <nav aria-label="Painel do organizador">
          <button
            :class="{ active: panelTab === 'overview' }"
            @click="panelTab = 'overview'"
          >
            <LayoutDashboard :size="19" />Visão geral</button
          ><button
            :class="{ active: panelTab === 'events' }"
            @click="panelTab = 'events'"
          >
            <CalendarDays :size="19" />Meus eventos</button
          ><button
            :class="{ active: panelTab === 'attendees' }"
            @click="panelTab = 'attendees'"
          >
            <Users :size="19" />Participantes</button
          ><button @click="navigate('ingressos')">
            <TicketIcon :size="19" />Meus ingressos</button
          ><button @click="navigate('explorar')">
            <ArrowLeft :size="19" />Voltar para o site
          </button>
          <button class="mobile-only" @click="logout" :disabled="busy">
            <LogOut :size="17" />Sair da conta
          </button>
        </nav>
        <div class="sidebar-account">
          <span class="avatar">{{ user.name[0].toUpperCase() }}</span>
          <div>
            <strong>{{ user.name }}</strong
            ><small>{{ user.email }}</small>
          </div>
          <button
            class="icon-button"
            aria-label="Sair da conta"
            @click="logout"
            :disabled="busy"
          >
            <LogOut :size="17" />
          </button>
        </div>
      </aside>
      <section class="dashboard-content">
        <div class="section-header">
          <div>
            <span class="eyebrow">SEU ESPAÇO PARA FAZER ACONTECER</span>
            <h1>
              {{
                panelTab === "overview"
                  ? "Visão geral"
                  : panelTab === "events"
                    ? "Meus eventos"
                    : "Participantes"
              }}
            </h1>
            <p>
              Bem-vindo de volta, {{ user.name.split(" ")[0] }}! Veja o que está
              acontecendo.
            </p>
          </div>
          <button class="btn btn-purple" @click="newEvent">
            <Plus :size="18" />Criar novo evento
          </button>
        </div>
        <div v-if="panelTab === 'overview'" class="stats-grid">
          <div>
            <span class="stat-icon violet"><CalendarDays :size="23" /></span
            ><span>EVENTOS PUBLICADOS</span
            ><strong>{{ String(stats.published).padStart(2, "0") }}</strong
            ><small>Ideias que saíram do papel</small>
          </div>
          <div>
            <span class="stat-icon lime"><TicketIcon :size="23" /></span
            ><span>INSCRIÇÕES TOTAIS</span
            ><strong>{{ stats.registrations }}</strong
            ><small>Pessoas com encontro marcado</small>
          </div>
          <div>
            <span class="stat-icon blue"><TicketCheck :size="23" /></span
            ><span>CHECK-INS</span><strong>{{ checkinTotal }}</strong
            ><small>Conexões que aconteceram</small>
          </div>
        </div>
        <div class="management-card">
          <div class="management-header">
            <h2>
              {{
                panelTab === "attendees"
                  ? "Selecione um evento"
                  : "Gerenciar eventos"
              }}
            </h2>
            <div class="table-tools">
              <label class="table-search"
                ><Search :size="15" /><input
                  v-model="panelQuery"
                  aria-label="Buscar meus eventos"
                  placeholder="Buscar evento..." /></label
              ><select v-model="panelStatus" aria-label="Filtrar por status">
                <option value="all">Todos os status</option>
                <option value="published">Publicados</option>
                <option value="draft">Rascunhos</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          </div>
          <div v-if="loading" class="loading-state">
            <LoaderCircle class="spin" />Carregando painel…
          </div>
          <div v-else-if="!visibleMine.length" class="empty-state">
            <CalendarDays :size="35" />
            <h3>
              {{
                mine.length
                  ? "Nenhum evento corresponde à busca."
                  : "Sua primeira ideia começa aqui."
              }}
            </h3>
            <p>Crie, publique e acompanhe cada encontro em um só lugar.</p>
            <button class="btn btn-purple" @click="newEvent">
              Criar evento<Plus :size="17" />
            </button>
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>EVENTO</th>
                  <th>DATA</th>
                  <th>STATUS</th>
                  <th>INSCRIÇÕES</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="event in visibleMine" :key="event.id">
                  <td>
                    <div class="table-event">
                      <img :src="eventImage(event)" :alt="event.title" />
                      <div>
                        <button @click="openEvent(event)">
                          {{ event.title }}</button
                        ><small>{{ event.category }}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong>{{
                      new Date(event.starts_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                      })
                    }}</strong
                    ><small>{{ time(event.starts_at) }}</small>
                  </td>
                  <td>
                    <span :class="['status', event.status]">{{
                      status(event.status)
                    }}</span>
                  </td>
                  <td>
                    <div class="capacity">
                      <progress
                        :value="event.registrations_count"
                        :max="event.capacity"
                      ></progress
                      ><span
                        >{{ event.registrations_count }}/{{
                          event.capacity
                        }}</span
                      >
                    </div>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button
                        class="icon-button"
                        :aria-label="`Editar ${event.title}`"
                        @click="edit(event)"
                      >
                        <Pencil :size="16" /></button
                      ><button
                        class="icon-button"
                        :aria-label="`Participantes de ${event.title}`"
                        @click="openManage(event)"
                      >
                        <Users :size="17" /></button
                      ><button
                        class="icon-button"
                        :aria-label="`Compartilhar ${event.title}`"
                        @click="shareEvent(event)"
                      >
                        <LinkIcon :size="16" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
    <main v-else class="container tickets-page">
      <span class="eyebrow">EXPERIÊNCIAS COM SEU NOME</span>
      <h1>Meus ingressos<span class="lime-dot">.</span></h1>
      <p>O próximo encontro já tem lugar na sua agenda.</p>
      <div
        class="ticket-tabs"
        role="tablist"
        aria-label="Período dos ingressos"
      >
        <button
          role="tab"
          :aria-selected="ticketTab === 'upcoming'"
          :class="{ active: ticketTab === 'upcoming' }"
          @click="ticketTab = 'upcoming'"
        >
          Próximos eventos</button
        ><button
          role="tab"
          :aria-selected="ticketTab === 'history'"
          :class="{ active: ticketTab === 'history' }"
          @click="ticketTab = 'history'"
        >
          Histórico
        </button>
      </div>
      <div v-if="loading" class="loading-state">
        <LoaderCircle class="spin" />Carregando ingressos…
      </div>
      <div v-else-if="!visibleTickets.length" class="empty-state">
        <TicketIcon :size="38" />
        <h2>
          {{
            ticketTab === "upcoming"
              ? "Sua agenda está aberta a possibilidades."
              : "Suas histórias vão aparecer aqui."
          }}
        </h2>
        <p>Explore eventos e encontre uma experiência que combina com você.</p>
        <button class="btn btn-purple" @click="explore">
          Explorar eventos<ArrowUpRight :size="17" />
        </button>
      </div>
      <div v-else class="ticket-list">
        <article
          v-for="item in visibleTickets"
          :key="item.id"
          class="ticket-row"
        >
          <img
            class="ticket-cover"
            :src="eventImage(item.event)"
            :alt="item.event.title"
          />
          <div class="ticket-info">
            <div class="ticket-meta">
              <span class="category-label">{{ item.event.category }}</span
              ><span>REF: #{{ item.code.slice(0, 8).toUpperCase() }}</span>
            </div>
            <h2>{{ item.event.title }}</h2>
            <div class="ticket-facts">
              <div>
                <small>DATA E HORA</small
                ><strong
                  >{{ date(item.event.starts_at) }}<br />{{
                    time(item.event.starts_at)
                  }}</strong
                >
              </div>
              <div>
                <small>LOCALIZAÇÃO</small
                ><strong>{{ item.event.location }}</strong
                ><span>{{ item.event.city }}</span>
              </div>
            </div>
            <span
              :class="[
                'status',
                item.event.status === 'cancelled' ? 'cancelled' : 'published',
              ]"
              >{{
                item.event.status === "cancelled"
                  ? "Evento cancelado"
                  : item.checked_in_at
                    ? "Check-in realizado"
                    : "Inscrição confirmada"
              }}</span
            >
          </div>
          <div class="ticket-stub">
            <TicketIcon :size="30" /><span>SEU PRÓXIMO<br />ENCONTRO</span
            ><button class="btn btn-dark" @click="showTicket(item)">
              Ver ingresso<ArrowUpRight :size="15" />
            </button>
          </div>
        </article>
      </div>
    </main>
    <footer v-if="!auth && view !== 'painel'" class="footer">
      <div class="container footer-inner">
        <a class="brand" href="#explorar" @click.prevent="navigate('explorar')"
          ><span class="brand-icon"><Sparkles :size="17" /></span>conecta<span
            class="brand-dot"
            >.</span
          ></a
        ><span>Feito para aproximar pessoas, ideias e lugares.</span>
        <nav aria-label="Informações">
          <button @click="info = 'Sobre a Conecta'">Sobre</button
          ><button @click="info = 'Como funciona'">Ajuda</button
          ><button @click="info = 'Privacidade'">Privacidade</button>
        </nav>
      </div>
    </footer>
    <div v-if="notice" class="toast" role="status">
      <CheckCircle2 :size="19" />{{ notice
      }}<button
        class="icon-button"
        aria-label="Fechar aviso"
        @click="notice = ''"
      >
        <X :size="17" />
      </button>
    </div>
    <DialogSurface
      v-if="editing"
      :label="editingId ? 'Editar evento' : 'Criar evento'"
      :busy="busy"
      wide
      @close="editing = false"
      ><button
        class="close-button"
        @click="editing = false"
        aria-label="Fechar"
        :disabled="busy"
      >
        <X :size="20" /></button
      ><span class="eyebrow">TRANSFORME UMA IDEIA EM ENCONTRO</span>
      <h2>
        {{ editingId ? "Ajuste os detalhes." : "Vamos fazer acontecer." }}
      </h2>
      <p class="subtle">
        Seu evento, sua comunidade. A organização fica mais simples por aqui.
      </p>
      <form @submit.prevent="saveEvent">
        <label
          >NOME DO EVENTO<input
            v-model="form.title"
            required
            maxlength="160"
            placeholder="Um nome que desperte curiosidade"
        /></label>
        <div class="form-grid">
          <label
            >CATEGORIA<select v-model="form.category">
              <option v-for="c in categories.slice(1)" :key="c">
                {{ c }}
              </option>
            </select></label
          ><label
            >CAPACIDADE<input
              v-model.number="form.capacity"
              type="number"
              min="1"
              max="100000"
              required
          /></label>
        </div>
        <label
          >SOBRE O EVENTO<textarea
            v-model="form.description"
            required
            minlength="30"
            maxlength="10000"
            rows="4"
            placeholder="Conte o que as pessoas vão viver. Mínimo de 30 caracteres."
          ></textarea>
        </label>
        <div class="form-grid">
          <label
            >CIDADE<input
              v-model="form.city"
              required
              maxlength="100"
              placeholder="São Paulo" /></label
          ><label
            >LOCAL E ENDEREÇO<input
              v-model="form.location"
              required
              maxlength="255"
              placeholder="Nome do espaço e endereço" /></label
          ><label
            >COMEÇA EM<input
              v-model="form.starts_at"
              type="datetime-local"
              required /></label
          ><label
            >TERMINA EM<input
              v-model="form.ends_at"
              type="datetime-local"
              required
          /></label>
        </div>
        <p class="field-help">
          Os horários seguem o fuso do seu dispositivo e são salvos em UTC.
        </p>
        <label
          >VISIBILIDADE<select v-model="form.status">
            <option value="draft">Rascunho — somente você vê</option>
            <option value="published">
              Publicado — aberto para inscrições
            </option>
            <option value="cancelled">Cancelado — inscrições encerradas</option>
          </select></label
        >
        <p class="field-help">
          A capa é selecionada automaticamente conforme a categoria.
        </p>
        <p v-if="modalError" class="form-error" role="alert">
          {{ modalError }}
        </p>
        <button class="btn btn-purple full" type="submit" :disabled="busy">
          <LoaderCircle v-if="busy" class="spin" :size="18" />{{
            editingId ? "Salvar alterações" : "Criar evento"
          }}<ArrowUpRight :size="17" />
        </button></form
    ></DialogSurface>
    <DialogSurface
      v-else-if="manage"
      label="Participantes e check-in"
      :busy="busy"
      wide
      @close="manage = null"
      ><button
        class="close-button"
        @click="manage = null"
        aria-label="Fechar"
        :disabled="busy"
      >
        <X :size="20" /></button
      ><span class="eyebrow">CADA PESSOA CONTA</span>
      <h2>{{ manage.title }}</h2>
      <p class="subtle">
        {{ attendees.length }} inscritos ·
        {{ attendees.filter((t) => t.checked_in_at).length }} check-ins
        confirmados
      </p>
      <form class="checkin-form" @submit.prevent="checkin">
        <label
          >CÓDIGO DO INGRESSO<input
            v-model="checkCode"
            required
            placeholder="Cole o código UUID do ingresso" /></label
        ><button class="btn btn-purple" :disabled="busy" type="submit">
          <Check :size="18" />Confirmar entrada
        </button>
      </form>
      <p class="field-help">
        O QR code do participante contém o código do ingresso. Leia com seu
        aplicativo e cole aqui.
      </p>
      <p v-if="modalError" class="form-error" role="alert">
        {{ modalError }}
      </p>
      <div v-if="busy" class="loading-state">
        <LoaderCircle class="spin" />Processando…
      </div>
      <div v-else-if="!attendees.length" class="empty-state compact">
        <Users :size="30" />As inscrições deste evento aparecerão aqui.
      </div>
      <div v-else class="attendee-list">
        <div v-for="person in attendees" :key="person.id">
          <span class="avatar">{{ person.user?.name[0] }}</span>
          <div>
            <strong>{{ person.user?.name }}</strong
            ><small>{{ person.user?.email }}</small>
          </div>
          <span
            :class="['status', person.checked_in_at ? 'published' : 'draft']"
            >{{ person.checked_in_at ? "Presente" : "Aguardando" }}</span
          >
        </div>
      </div></DialogSurface
    >
    <DialogSurface
      v-else-if="ticket"
      label="Seu ingresso"
      :busy="busy"
      @close="ticket = null"
      ><div class="ticket-modal">
        <button
          class="close-button"
          @click="ticket = null"
          aria-label="Fechar"
          :disabled="busy"
        >
          <X :size="20" /></button
        ><span class="eyebrow">SEU LUGAR ESTÁ GARANTIDO</span>
        <h2>{{ ticket.event.title }}</h2>
        <p>
          {{ date(ticket.event.starts_at) }} ·
          {{ time(ticket.event.starts_at) }}
        </p>
        <p class="subtle">
          {{ ticket.event.location }} · {{ ticket.event.city }}
        </p>
        <span v-if="ticket.event.status === 'cancelled'" class="form-error"
          >Este evento foi cancelado pelo organizador.</span
        ><template v-else
          ><img
            v-if="qr"
            class="qr"
            :src="qr"
            alt="QR code do seu ingresso"
            width="240"
            height="240"
          />
          <p class="subtle">Apresente este código no check-in.</p>
          <span class="status published">{{
            ticket.checked_in_at ? "Check-in realizado" : "Inscrição confirmada"
          }}</span></template
        >
        <div class="ticket-code">
          <code>{{ ticket.code }}</code
          ><button
            class="icon-button"
            aria-label="Copiar código"
            @click="copyCode(ticket.code)"
          >
            <Copy :size="17" />
          </button>
        </div>
        <p v-if="modalError" class="form-error" role="alert">
          {{ modalError }}
        </p>
        <button
          v-if="
            !ticket.checked_in_at &&
            new Date(ticket.event.starts_at) > new Date()
          "
          class="text-button danger"
          @click="cancelTicket(ticket)"
          :disabled="busy"
        >
          Cancelar minha inscrição
        </button>
      </div></DialogSurface
    >
    <DialogSurface v-else-if="info" :label="info" @close="info = null"
      ><button class="close-button" @click="info = null" aria-label="Fechar">
        <X :size="20" /></button
      ><span class="eyebrow">FEITO PARA APROXIMAR</span>
      <h2>{{ info }}</h2>
      <template v-if="info === 'Como funciona'"
        ><p class="info-copy">
          Encontre um evento usando a busca ou os filtros. Crie sua conta,
          garanta seu lugar e acesse o QR code em “Meus ingressos”.
        </p>
        <p class="info-copy">
          Para organizar, escolha “Criar evento”, preencha os detalhes e
          publique. No painel, acompanhe inscrições e confirme a entrada dos
          participantes.
        </p></template
      ><template v-else-if="info === 'Privacidade'"
        ><p class="info-copy">
          A Conecta utiliza seu nome e e-mail para identificar sua conta e suas
          inscrições. O organizador pode visualizar os dados dos participantes
          dos próprios eventos.
        </p>
        <p class="info-copy">
          Seus eventos salvos ficam no armazenamento local deste navegador. Na
          prévia interativa, todos os dados são fictícios e ficam apenas neste
          dispositivo.
        </p></template
      >
      <p v-else class="info-copy">
        Conecta é uma plataforma de eventos criada para aproximar pessoas,
        ideias e lugares. Descubra encontros da sua comunidade ou dê vida à sua
        própria ideia — com eventos gratuitos e inscrições simples.
      </p></DialogSurface
    >
  </div>
</template>
