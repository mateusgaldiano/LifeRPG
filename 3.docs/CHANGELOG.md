# Changelog — LifeRPG OS

Registro de todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/).

> **Fonte única de versão:** [`1.core/version.js`](../1.core/version.js).
> A cada release, bump o valor lá **e** adicione uma entrada aqui.
> O mesmo número aparece nas Configurações (engrenagens) e no cache do Service Worker.

---

## [v2.1.12] — 2026-06-25

### Game design — Avaliação semanal (SINTONIA) mais justa
Antes a SINTONIA era **só pela % de conclusão**, então quem assumia 1 tarefa fácil e a cumpria (100%) ganhava **S**, enquanto quem assumia 10 e fazia 7 (70%) ficava em B — punindo a ambição. Novo cálculo:
- **Score = 70% Volume + 30% Consistência.** Volume = `min(100, conclusões × 6.5)`; Consistência = % do que foi assumido.
- **Gates de tempo:** **S** exige **≥ 2h** de atividade na semana; **A** exige **≥ 1h** (soma das durações das missões concluídas). Sem o tempo, o rank é rebaixado.
- O relatório agora mostra o **tempo total de atividade** ao lado das missões concluídas.

## [v2.1.11] — 2026-06-25
- **chore:** de-duplicação de higiene bucal na biblioteca de hábitos (`social.js`).

---

## [v2.1.10] — 2026-06-25

### Corrigido — Reset diário (bug: quests de ontem continuavam "concluídas")
Dois problemas combinados:
- **Sem reset ao vivo:** o reset só rodava no `loadGameData` (carregamento). Com o PWA aberto cruzando a meia-noite, nada resetava. **Fix:** `checkDayRolloverLive()` em `app.js` — verifica a virada do dia a cada minuto e no `visibilitychange`; ao detectar, salva e recarrega para disparar o reset.
- **Nuvem desfazia o reset:** `loadQuestsFromSupabase` reaplicava o `completed=true` antigo da nuvem após o reset local. **Fix:** marca `_lastDailyResetDate` quando o reset ocorre (`state.js`) e, na carga da nuvem, dailies não são remarcadas como concluídas se o reset já aconteceu hoje (`supabase-config.js`).

---

## [v2.1.9] — 2026-06-24

Lote de itens "S" (pequenos) de acessibilidade e game design.

### Adicionado
- **GAME-003** — countdown até o reset diário no topo da aba Missões (atualiza a cada minuto).
- **A11Y-003** — descrição textual do radar de atributos para leitores de tela (`role="img"` + `aria-describedby` + `.sr-only`).

### Melhorado
- **A11Y-001** — botão de remover quest (✕) passou de 28px para **44px** (alvo de toque mínimo WCAG, igual ao botão concluir).

### Já estavam prontos (removidos do pipeline)
- UX-003 (duração de toast), GAME-001 (teto de penalidade), GAME-002 (indicador de buff), A11Y-002 (ARIA), **UX-005** (o radar **já tinha** labels nos vértices).

### Avaliados e adiados (continuam no pipeline)
- **UX-006** (fontes do Weekly Report em mobile) — precisa do DOM exato do relatório; CSS visual que não consigo validar aqui.
- **SOCIAL-002** (botão de duelo no modal de perfil) — wiring no `social.js` (lazy), risco moderado sem teste.
- **BUG-002** (chat global) — código completo; falta só **verificar ao vivo** com o SQL aplicado.

---

## [v2.1.8] — 2026-06-24

Lote de Onboarding do pipeline.

### Adicionado
- **ONBOARD-001 (parcial)** — 3ª opção de gênero **Neutro** no wizard (alias de avatares para masculino). _Reorder dos steps (gênero após o nome) **não** feito: rewire de navegação de alto risco e baixo valor; o texto do passo de nome depende do gênero._
- **ONBOARD-002** — passo do Hook agora oferece **3 micro-hábitos** por arquétipo (cards selecionáveis); o escolhido vira a primeira daily (`applyArchetypeDeck` usa a escolha, com fallback por arquétipo).
- **ONBOARD-003** — ao concluir o onboarding, o banner de instalação do PWA é revelado (Android/desktop via `deferredPrompt`; iOS já exibe automaticamente). Função `window.promptInstallAfterOnboarding` no `pwa.js`.

---

## [v2.1.7] — 2026-06-24

### Engenharia
- **ENG-002 (variante segura)** — `social.js` (~110KB) deixou de ser importado estaticamente; agora é carregado via `import()` dinâmico em **idle** (`requestIdleCallback`, fallback `setTimeout`), fora do caminho do 1º paint. A inicialização (`setupSocialModalListeners`, `setupHabitLibraryAndTabs`) e os globais `window.*` são hidratados em `loadSocialModule()` após o load. _Escolhida a variante "defer em idle" em vez de "on-demand ao abrir o modal" porque o `social.js` é um god-module que também contém a biblioteca de hábitos e o tutorial (ambos críticos no boot) — on-demand exigiria split do módulo._

---

## [v2.1.6] — 2026-06-24

### Engenharia
- **ENG-001 (conclusão)** — avatares convertidos de PNG para **WebP** (qualidade 80): **15,4 MB → 2,4 MB (–85%)**. Referências de avatar no `ui.js` agora apontam para `.webp`, com `.png` mantido como fallback no `onerror`. Os PNGs seguem no repo como fallback.

---

## [v2.1.5] — 2026-06-24

Lote de Segurança e Engenharia do pipeline.

### Segurança
- **SEC-001** — reforço **server-side** do rate limit do chat global: trigger `enforce_chat_rate_limit` (máx. 10 msgs/min por usuário) em [`3.docs/sec_chat_ratelimit.sql`](sec_chat_ratelimit.sql). _O frontend já limitava 1 msg/2s ([social.js](../1.core/modules/social.js) `handleSendMessage`)._
- **SEG-002** — auditoria de RLS disponível em [`3.docs/fix_p0_db.sql`](fix_p0_db.sql) (rodar no Supabase).
- **SEC-003** — já resolvido na v2.1.3 (cleanup de presença no `pagehide`).

### Engenharia
- **ENG-001** — `loading="lazy"` + `decoding="async"` nos avatares de modal; avatar do header com `decoding="async"`. _(WebP feito na v2.1.6.)_

### Deploy
- Fluxo de homologação (Dev) **pausado** no CLAUDE.md — push só no prod por enquanto.

---

## [v2.1.4] — 2026-06-24

### Corrigido
- **GAME-002 (fix)** — o indicador de XP duplo sumia ao concluir uma quest (o badge ficava preso ao card, que esmaece quando concluído). Trocado por um **indicador persistente** no cabeçalho da barra de XP, atualizado no `updateUI()` — agora fica visível enquanto o buff estiver ativo. Vale também para o Foco Lendário (x3 💰).

---

## [v2.1.3] — 2026-06-24

Lote de itens "S" do pipeline (puro código, aditivos).

### Adicionado
- **GAME-002** — badge de buff ativo (⚡ 2x XP / x3 💰) nos cards de quest quando o buff está vigente.

### Corrigido / Melhorado
- **GAME-001** — teto de penalidade para iniciantes (< nível 10): XP máx. 10%, sem perda de atributos e streak só reseta com 3+ falhas (reduz churn de novatos).
- **UX-003** — toasts do Iroh agora têm duração proporcional ao tamanho do texto (até 8,5s para mensagens longas).
- **A11Y-002** — `role`/`aria-live` em toasts e overlays (level-up, quest cleared, penalidade) + `@media (prefers-reduced-motion: reduce)`.
- **SEC-003** — presença removida no `pagehide` (evita sessões "zumbi" no chat/online).

### Pipeline
- Removido **UX-001** (não era bug — descartado a pedido). `pipeline.html`/`pipeline.md` sincronizados (36 itens).

## [v2.1.2] — 2026-06-24

- **Estética:** sub-abas da aba Social (CHAT/AMIGOS/DUELOS/CLÃ) migradas para o tema claro e correção do overflow do "CLÃ" (`white-space:nowrap`, fontes/spacing menores, "CHAT GLOBAL"→"CHAT").

## [v2.1.1] — 2026-06-24

Rodada de correções de cloud sync, login, ranks e consolidação de versão.

### Adicionado
- Buffs persistidos no Supabase via tabela `user_buffs` (doubleXp, autoHeal, legendaryFocus). `0641c82`
- Versão do app exibida no modal de Configurações. `f556f49` `dfd2283`
- `username` sincronizado em `persons` + dados da conta (email/nome/username) no modal de Configurações. `ee001c0`
- Nova progressão de ranks: **A** (20–24), **S** (25–29), **Nacional** (30–34), **Monarca** (35+). Removido Governante. `c3e34d1`
- **Fonte única de versão** em `1.core/version.js`, lida pela UI e pelo Service Worker. `4c4e3e5`

### Corrigido
- `adjustWater()` não aplicava o buff de XP dobrado (quest de água ignorava `isDoubleXpActive()`). `92b8439`
- `doubleXpExpiresAt` era sobrescrito no merge cloud/local. `d2673a4`
- `username` passou a ser lido de `persons` em vez de `users` (ensureUserProfile, syncFromCloud, forceLoadFromCloud). `063f5c7`
- Login com Google não redirecionava (removido `skipBrowserRedirect`) e não falha mais em silêncio — agora reporta erro claro se o SDK não carregar ou o provedor estiver desabilitado. `7ceeb4a` `fa5c539`
- Higienização bucal virou contador **0/2** (auto-corrige saves antigos sem contador; não herda o 8 da água). `ab1ca67`

### Banco de dados (Supabase)
- Recriada a função `sync_user_state_secure` e forçado reload do schema cache do PostgREST (resolve _"Could not find the function … in the schema cache"_). `746623b`
- Restaurada `users.username` e sincronizada com `persons.username` — corrige PvP, ranking e RPC quebrados pela migração de username. `25bba7e`
- Validação de rank do RPC alinhada aos tiers reais do app. `a809ef3` `c3e34d1`
- Script idempotente de alinhamento do banco: [`3.docs/fix_sync_username_persons.sql`](fix_sync_username_persons.sql).

### Documentação & triagem do pipeline (P0)
- `CLAUDE.md` seção 6 reescrita: Firebase → Supabase + arquitetura ES Modules (resolve **TECH-001**).
- Criado `3.docs/CHANGELOG.md` (este arquivo) como registro de versões.
- Criado `3.docs/fix_p0_db.sql`: auditoria de RLS (**SEG-002**), reaplicação do chat global (**BUG-002**) e pg_cron de finalização de duelos (**BUG-004**) — rodar no Supabase.
- `3.docs/pipeline.html` reconciliado: removidos os itens já concluídos (**TECH-001, BUG-005, PWA-002, META-002**); pendentes mantidos.
- Verificados como **já implementados** (sem ação necessária): BUG-001 (upsert + `maybeSingle` + try/catch), BUG-003 (manifest com `start_url`/`scope` relativos), BUG-005 (listeners de ranking/taverna), MKT-001 (meta tags og/twitter + `og-preview.png`), PWA-002 (SW com `skipWaiting`/`clients.claim`/limpeza de cache), META-002 (avatares E–S nos dois gêneros).
- Pendências P0 que exigem ação externa: **UX-001** (escalonamento de fontes do modal Settings — requer validação visual) e **SEG-001** (gerar par VAPID + configurar Secrets no Supabase).

### Notas de versão
- Antes desta versão havia **dois números** independentes: `CACHE_VERSION` do Service Worker (chegou a `v1.5.7`) e `APP_VERSION` da UI (`v2.1.0`). Foram **unificados** em `v2.1.1`.

---

## [v2.1.0] — baseline anterior

Estado do app antes desta rodada de correções (referência).

---

## Processo de release

1. Aplicar e validar as mudanças de código (`node --check` nos `.js` alterados).
2. Bump da versão em [`1.core/version.js`](../1.core/version.js) (ex.: `v2.1.1` → `v2.1.2`).
3. Adicionar uma entrada aqui no topo, com data e mudanças agrupadas (Adicionado / Corrigido / Banco de dados).
4. Se houver alteração de schema/RPC no Supabase, versionar o `.sql` em `3.docs/` e rodar no SQL Editor.
5. Commit + push em `dev-origin dev:main` (homologação) e, após validar, `origin dev:main` (produção).
