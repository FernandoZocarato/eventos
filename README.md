# Conecta — Boas conexões começam ao vivo

Plataforma de eventos com Laravel 10, PHP 8.1.5, Vue 3 e TypeScript. Interface em português, inspirada no site de referência fornecido e nas telas exportadas do UX Pilot.

## O que foi implementado

- Página inicial com busca por palavra-chave, cidade e categoria.
- Cards com fotografias, datas, vagas e favoritos salvos no navegador.
- Página de detalhes com informações do organizador, inscrição, mapa e compartilhamento.
- Login e cadastro com formulários acessíveis.
- Área de ingressos com próximos eventos, histórico e QR code.
- Painel com métricas, busca, filtros de status e gerenciamento de eventos.
- Criação/edição de eventos, lista de participantes e check-in manual por código.
- Layout responsivo, estados vazios, erros, carregamento e notificações.
- Diálogos com controle de foco, retorno ao elemento anterior e fechamento com Escape.

A primeira versão trabalha somente com eventos gratuitos. Pagamentos, uploads de capas, autenticação social, recuperação de senha e envio de e-mails ainda não estão implementados. As capas são selecionadas conforme a categoria.

## Estado do projeto

O frontend foi validado com TypeScript, build de produção e testes manuais da prévia. A instalação do Laravel 10 está bloqueada por avisos de segurança do Composer. O backend ainda não foi validado em execução. A migração de PHP/Laravel permanece pendente para operar com usuários reais; o bloqueio de segurança do Composer foi mantido.

Prévia publicada: https://conecta-eventos-visual.goldenfox66.chatgpt.site

## Duas formas de executar

### 1. Prévia independente do frontend

Requisitos: Node.js 22.12 ou superior e npm.

```bash
npm ci
npm run dev:demo
```

Abra o endereço mostrado pelo Vite. Em `Entrar`, use `Explorar demonstração`. A prévia cria uma personagem fictícia com eventos e ingressos de exemplo. É possível buscar, salvar eventos, se inscrever, cancelar, criar/editar eventos e conferir o painel.

A prévia usa armazenamento local e não faz chamadas ao Laravel. Nenhuma senha é armazenada. Não use dados pessoais reais. Para reiniciar a demonstração, limpe os dados do site no navegador. A faixa “Prévia interativa” identifica esse modo.

Build estático:

```bash
npm run build:demo
```

A pasta `dist/` pode ser publicada como site estático, com `index.html` na raiz. Esse build serve para demonstração visual, não para inscrições reais.

### 2. Aplicação completa com Laravel

Requisitos: PHP 8.1.5, Composer 2, extensões usuais do Laravel (`ctype`, `curl`, `dom`, `fileinfo`, `filter`, `hash`, `mbstring`, `openssl`, `pcre`, `pdo`, `session`, `tokenizer`, `xml`) e o driver PDO do banco escolhido. Para SQLite, habilite `pdo_sqlite` e `sqlite3`.

O PHP 8.1.5 é a plataforma configurada em `composer.json`. Laravel 10 é compatível com essa linha de PHP. JavaScript não depende da versão do PHP; Node é usado separadamente para compilar o frontend.

```bash
composer install
```

Copie `.env.example` para `.env`, crie o arquivo vazio `database/database.sqlite` e configure `DB_DATABASE` com seu caminho absoluto. No Windows, use barras normais, por exemplo `C:/projetos/eventos/database/database.sqlite`.

```dotenv
DB_CONNECTION=sqlite
DB_DATABASE=/caminho/absoluto/eventos/database/database.sqlite
```

Depois:

```bash
php artisan key:generate
php artisan migrate --seed
npm ci
npm run build
php artisan serve
```

Abra `http://localhost:8000`. Para desenvolvimento com atualização automática, execute `npm run dev` em outro terminal, mantendo `php artisan serve` em execução.

O build normal usa a API Laravel real. Não é necessário habilitar modo demo no `.env`. A seleção é feita pelo comando do Vite: somente `--mode demo` ativa os mocks.

O seed cria eventos futuros e um organizador fictício com senha aleatória; ele não cria credenciais públicas. Cadastre sua própria conta pela interface para organizar eventos reais no ambiente local.

## Compatibilidade e segurança

O requisito de PHP 8.1.5 exige uma versão antiga do framework. Laravel 10 encerrou as correções de segurança em fevereiro de 2025. Antes de operar um serviço público com usuários reais, atualize PHP e Laravel para versões suportadas e resolva os avisos do `composer audit` e `npm audit`.

As dependências PHP não foram instaladas neste ambiente porque PHP/Composer não estão disponíveis. Não há `composer.lock` validado aqui. A resolução de versões precisa ser conferida na máquina de desenvolvimento com PHP 8.1.5; não use `--ignore-platform-reqs` para contornar incompatibilidades. Se o Composer bloquear pacotes antigos por avisos de segurança, prefira atualizar a plataforma em vez de desabilitar a proteção.

## Estrutura

```text
app/Http/Controllers/      autenticação, eventos e inscrições
app/Models/                modelos e relacionamentos
routes/web.php             API com sessão/CSRF e página Vue
database/migrations/       tabelas de eventos e inscrições
database/seeders/          eventos fictícios com datas futuras
resources/js/App.vue       telas, navegação e fluxos da interface
resources/js/components/   cards e diálogos acessíveis
resources/js/api.ts        comunicação com Laravel
resources/js/demo.ts       simulação exclusiva da prévia estática
resources/js/types.ts      contratos TypeScript
resources/js/media.ts      seleção das fotografias
resources/css/app.css      identidade visual e responsividade
public/images/             imagens locais
```

## API

Todas as rotas JSON ficam em `/app-api`, sob middleware web para sessão e CSRF.

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/session` | Usuário atual e token CSRF |
| POST | `/login`, `/register`, `/logout` | Conta e sessão |
| GET | `/events` | Busca pública paginada |
| GET | `/events/{id}` | Detalhes |
| GET | `/my-events` | Eventos do organizador |
| POST / PUT | `/events`, `/events/{id}` | Criar/editar |
| GET | `/registrations` | Ingressos do usuário |
| POST | `/events/{id}/registrations` | Inscrição |
| DELETE | `/registrations/{id}` | Cancelamento |
| GET | `/events/{id}/attendees` | Participantes do organizador |
| POST | `/events/{id}/checkin` | Validar código do ingresso |

A autorização é aplicada no backend. A inscrição usa transação e bloqueio do evento para controlar capacidade em bancos com suporte a bloqueio por linha. Para concorrência em produção, use PostgreSQL ou MySQL em vez de SQLite. Cada pessoa pode se inscrever uma vez em cada evento, com restrição única no banco.

## Hospedagem Laravel

O diretório público do servidor deve apontar para `public/`, nunca para a raiz do projeto. Configure o banco persistente, gere uma `APP_KEY` própria, use HTTPS, `APP_ENV=production`, `APP_DEBUG=false` e `SESSION_SECURE_COOKIE=true`. Execute `php artisan migrate --force` após preparar o banco. Execute `npm ci` e `npm run build` antes de publicar; os arquivos gerados ficam em `public/build/` e não são versionados. Node não precisa estar executando no servidor.

## Validação desta entrega

- Verificação de tipos com `vue-tsc` e build de produção com Vite.
- Build estático de demonstração separado do build Laravel.
- Inspeção visual em navegador e testes manuais da prévia: navegação, autenticação fictícia, inscrição e ingresso com QR code, painel e participantes.
- Backend PHP ainda precisa de execução e testes de integração em ambiente compatível.

## Créditos visuais

As fotografias são as mesmas URLs públicas do Unsplash utilizadas pela referência fornecida, armazenadas localmente para reduzir dependências externas. Referências dos arquivos em `public/images/`:

- `hero.jpg`: https://images.unsplash.com/photo-1506157786151-b8491531f063
- `creativity.jpg`: https://images.unsplash.com/photo-1511578314322-379afb476865
- `business.jpg`: https://images.unsplash.com/photo-1556761175-b413da4baf72
- `jazz.jpg`: https://images.unsplash.com/photo-1511192336575-5a79af67a629
- `community.jpg`: https://images.unsplash.com/photo-1529156069898-49953e39b3ac
- `running.jpg`: https://images.unsplash.com/photo-1552674605-db6ffd4facb5
- `design.jpg`: https://images.unsplash.com/photo-1540575467063-178a50c2df87
