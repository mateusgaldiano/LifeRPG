# LifeRPG OS — Handoff de Contexto (para novo chat)

## O projeto
PWA de hábitos gamificado estilo **Solo Leveling**. **Vanilla HTML/CSS/JS** (sem frameworks, **sem build/empacotador**). Backend **Supabase** (auth Google + Postgres). Deploy **GitHub Pages**. Local: `C:\Users\mateu\.gemini\antigravity\scratch\liferpg`.

## Convenções CRÍTICAS (ler antes de mexer)
- **Versão única:** `1.core/version.js` → `self.APP_VERSION`. Bump aqui = invalida cache do SW **e** versão exibida nas Configurações. A cada mudança de app: **bump version.js + entrada no `3.docs/CHANGELOG.md`**.
- **Deploy:** `git push origin dev:main` (produção). **Dev (`dev-origin`) está PAUSADO** — não pushar lá.
- **⚠️ Cache do SW (v2.1.20):** stale-while-revalidate no `index.html` + **sem reload automático**. Resultado: **versão nova só aparece após reabrir ~2x** (ou `Ctrl+Shift+R`). É trade-off do load instantâneo, não bug.
- **Arquitetura:** módulos ES em `1.core/modules/` (`state.js`, `ui.js`, `game-logic.js`, `pwa.js`, `weekly-report.js`, `social.js`). `supabase-config.js` é **script clássico** (expõe `window.*`). `social.js` carrega **lazy** (idle). Entry: `1.core/app.js`.
- **Hook do ambiente:** editar `.md` no projeto dispara um agente de "feedback" (geralmente negado por permissão) — ignore o erro.
- **Validar JS antes de commit:** `node --check` (módulos ES: copiar p/ `.mjs` antes).
- **SQL do Supabase:** o assistente NÃO roda; entrega `.sql` em `3.docs/` e o usuário roda no SQL Editor.

## Estado atual: **v2.1.20** (no ar)

## O que esta sessão construiu

### Economia repensada (tema principal)
- **SINTONIA** (avaliação semanal, `weekly-report.js`): `score = 0.7×Volume + 0.3×Consistência`. Volume = `min(100, conclusões × 2)`. Faixas: **S>95, A≥85, B≥70, C≥50, D≥30, E<30**. **Gates de tempo:** S≥2h, A≥1h de atividade/semana. Recompensas (semanais): S 160/300, A 100/200, B 60/120, C 30/60, D 10/30, E 0.
- **Tomos de XP (3 tiers, loja):** Básico 2×/1d/80 · Intermediário 3×/3d/360 · Avançado 5×/5d/800. Buff guarda `gameState.buffs.xpMult`; aplicação via `getActiveXpMultiplier()`.
- **Multiplicador de renda por rank** (`addRewards`): D ×1.1 · C ×1.2 · B ×1.35 · A ×1.5 · S ×1.75 · Nacional ×2.0 · Monarca ×2.5. Destrava a curva de fim de jogo.
- **Reavaliação de Rank** (ralo estrutural, modelo "cerimônia"): rank sobe por nível (mérito); compra OPCIONAL escalonada dá título de prestígio. Custos: D 250 · C 600 · B 1.200 · A 2.500 · S 4.500 · Nacional 7.000 · Monarca 12.000. Títulos: O Iniciado · O Caçador · A Elite · O Herói · Soberano · Lendário · O Monarca. Estado: `gameState.rankEvaluationsClaimed`. Banner no topo da aba Missões.

### Bugs/fixes
- **Reset diário** (quests de ontem ficavam concluídas): timer ao vivo `checkDayRolloverLive` (app.js) + nuvem não reaplica `completed` antigo (`_lastDailyResetDate`).
- **Sync de cosméticos na nuvem:** títulos/bordas/reavaliações vão no `settings` (helper `applyCloudCosmetics`).
- **Login Google** (não redirecionava), **higiene bucal 0/2**, **avatares → WebP** (15MB→2.4MB), **lazy-load do social.js**, vários **a11y** (44px, ARIA, sr-only radar), **GAME-003** countdown de reset.
- **Performance de boot (v2.1.20, feita pelo Antigravity, revisada e OK):** removida dupla-init do Supabase (trava `authBootStarted`), `Promise.all` nas queries de sync, overlay some na hora com save local (offline-first), SW stale-while-revalidate, removido reload do SW.

## Pendências / follow-ups
- **Curva de XP de propósito longa** (~1 ano+ até Monarca) — NÃO encurtar.
- `checkAndFinalizeDuels()` roda a cada sync (overhead pequeno; poderia ser menos frequente).
- Pipeline de tarefas: `3.docs/pipeline.html` (fonte) + `pipeline.md` (gerado dele) — manter em sincronia. Itens P0+ pendentes lá (ex.: BUG-002 chat global precisa só de verificação ao vivo; SEG-001 VAPID; ENG-003 PurgeCSS descartado por conflitar com "sem build").
- Scripts SQL a rodar no Supabase (se ainda não): `fix_p0_db.sql`, `sec_chat_ratelimit.sql`, `fix_sync_username_persons.sql`.

## Gotchas de teste
- Versão nova: reabrir ~2x ou `Ctrl+Shift+R`.
- Botão "Sincronizar" = só dados (não atualiza código). Arrastar p/ baixo = reload.
