# Changelog — LifeRPG OS

Registro de todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/).

> **Fonte única de versão:** [`1.core/version.js`](../1.core/version.js).
> A cada release, bump o valor lá **e** adicione uma entrada aqui.
> O mesmo número aparece nas Configurações (engrenagens) e no cache do Service Worker.

---

## [v2.1.38] — 2026-06-30
- **Fix · Meditação e Yoga/Alongamento deixam de colidir na Biblioteca:**
  - A detecção de conflito (`addHabitFromLibrary`, `social.js`) compartilhava os ícones 🧘 / 🧘‍♂️ entre os grupos de *meditação* e *yoga/alongamento*; como vários itens cruzavam ícones, bloqueava adicionar uma quando já existia a outra. Removidos os ícones 🧘 dessas duas regras — o conflito passa a ser só por texto (são atividades distintas). Verificado: yoga coexiste com meditação; duplicata de meditação ainda é bloqueada.

## [v2.1.37] — 2026-06-30
- **Curadoria da Biblioteca de Hábitos** (`HABIT_LIBRARY` em `state.js`, 62 → 63 itens):
  - **Removidos 6 redundantes:** `lib-idioma-easy` (Duolingo duplicado), `lib-diario-med` (diário sobreposto), `lib-caminhada2-med` (caminhada redundante), `lib-niver-easy` e `lib-bilhete-easy` (excesso de contatos rápidos), `lib-deepwork2-hard` (Deep Work duplicado).
  - **Adicionados 7:** *Leitura filosófica/religiosa* (Mental·F·10), *Planejar a própria carreira* (Prod·M·30), *Provocação para o time* (Prod·M·15), *Planejar reunião importante* (Prod·M·20), *Planejar carreira dos liderados* (Social·M·30), *Mensagem de networking* (Social·F·5), *Doar 1 objeto* (Rotina·F·5).
  - Não afeta quests já criadas (a biblioteca é só o catálogo de "adicionar").

## [v2.1.36] — 2026-06-29
- **Fix · Conclusões de missão agora sincronizam entre dispositivos:**
  - **Causa:** concluir uma quest subia só o estado do jogador (XP/Ouro/streak via `saveToSupabase`), mas **não** o flag `completed` de cada missão. Os checks do dia só iam à nuvem em syncs de boot específicos — então o outro dispositivo mostrava tudo como "não concluído".
  - **Correção (push):** `toggleQuest` e `adjustWater` agora enfileiram um `upsert` da quest no outbox (`queueQuestOp`), subindo `completed`/`completed_at`/contador junto. Sobe na hora se online, ou no próximo flush/reconexão.
  - **Correção (load):** `loadQuestsFromSupabase` troca o guard binário `resetToday` por checagem **por data do `completed_at`** (`cloudDoneToday`): uma daily concluída na nuvem só vale se foi feita **hoje**. Isso reflete os checks do dia entre dispositivos **e** mantém a proteção contra reaplicar conclusão de ontem após o reset diário.
  - Nota: XP/Ouro nunca se perderam (já subiam); o que faltava eram os ✓ visuais.

## [v2.1.35] — 2026-06-29
- **Fix · Sub-abas sociais (Amigos / Duelos / Clã) não trocavam de conteúdo:**
  - **Causa:** `initSocialSubTabs()` (liga os listeners de troca de sub-aba) era chamado em `ui.js` (`initTabs`) como referência **nua** a uma função do `social.js`, que é lazy e não é importado por `ui.js` — logo `typeof initSocialSubTabs` era sempre `'undefined'` e a chamada nunca executava. Os botões pegavam o destaque visual, mas o conteúdo ficava preso no CHAT. (O chat funcionava porque é wirado separadamente pelo `enterCommunityTab`.)
  - **Correção:** o wire-up de `initSocialSubTabs()` e `initFriendsSearchListeners()` passou a rodar dentro do `loadSocialModule()` (`app.js`), no momento em que o `social.js` é carregado e suas funções existem.
  - Verificado no preview: após o load natural do social, as 4 sub-abas trocam corretamente (botão ativo + conteúdo ativo), sem init manual.

## [v2.1.34] — 2026-06-29
- **Fix CRÍTICO · `game-logic.js` com erro de sintaxe quebrava o app inteiro:**
  - **Causa raiz:** a inclusão do Sistema de Desafios Semanais (commit `841d862`) inseriu o bloco *dentro* de `completeDungeon()`, e a chave `}` de fechamento da função acabou fechando a `checkWeeklyChallengeReset`. Resultado: `completeDungeon` nunca fechava → todo o resto do arquivo ficava aninhado nela → `export {}` no fim virava "dentro de função" → `SyntaxError: Unexpected token 'export'`.
  - **Impacto:** como `app.js` (e `social.js`) importam `game-logic.js`, o **grafo de módulos ES inteiro falhava ao linkar** — o app não bootava e o `social.js` (lazy) nunca carregava, deixando os botões **Amigos / Duelos / Clã** sem listener (sintoma reportado).
  - **Correção:** restaurado `renderQuests();` + a chave de fechamento da `completeDungeon` logo após o `setTimeout`, deixando `WEEKLY_CHALLENGES_POOL`, `getWeekNumber` e `checkWeeklyChallengeReset` (esta é exportada) corretamente em escopo de módulo.
  - Verificado: `node --check` OK, grafo ESM linka, e no preview o `social.js` carrega e as 3 sub-abas trocam normalmente.

## [v2.1.33] — 2026-06-28
- **FIX #3 · PvP usa saldo de ouro autoritativo do servidor:**
  - Novo helper `window.refreshGoldFromCloud()` ([`supabase-config.js`](../1.core/supabase-config.js)) re-busca o `gold` real da tabela `users` após mutações de duelo (a RPC já debita/reembolsa server-side).
  - `submitPvpChallenge`, e os handlers de **aceitar** e **cancelar** desafio (`loadDuelsList`) deixaram de fazer dedução/reembolso local "às cegas" (`gameState.gold ±= aposta`) e passaram a chamar `refreshGoldFromCloud()`. Elimina divergência entre o HUD e o banco.
  - `btnReject` intacto (o rejeitante não apostou; reembolso do desafiante vem no próximo sync dele).

## [v2.1.32] — 2026-06-28
- **Substituição de Rótulos de Ranks por Dificuldades nas Quests:**
  - **Exibição Limpa de Dificuldade:** Removido o termo "Rank X" (como RANK E, RANK D, etc.) dos cartões de missões e do modal de criação de novas quests.
  - **Nomenclatura Visual Uniforme:** As badges de quests na UI exibem agora apenas os nomes de dificuldades amigáveis:
    - `Fácil` (anteriormente *RANK E*)
    - `Intermediário` (anteriormente *RANK D*)
    - `Difícil` (anteriormente *RANK C*)
    - `Muito Difícil` (anteriormente *RANK B*)
    - `Heroico` (anteriormente *RANK A*)
    - `Lendário` (anteriormente *RANK S*)

## [v2.1.31] — 2026-06-28
- **Simplificação de Ranks na Criação (Três Níveis Clássicos):**
  - **Reversão para Três Níveis de Dificuldade:** Removida a possibilidade de criar quests personalizadas com Ranks B, A e S no formulário de criação em `index.html` e `ui.js`. Isso preserva as grandes recompensas de ouro exclusivamente para Dungeons semanais e Boss Quests (subidas de Rank de avatar).
  - **Renomeação Amigável:** As opções no modal de criação foram rebatizadas e alinhadas:
    - **Fácil (Rank E):** +10 XP / +10 Ouro
    - **Intermediário (Rank D):** +25 XP / +20 Ouro
    - **Difícil (Rank C):** +50 XP / +40 Ouro

## [v2.1.30] — 2026-06-28
- **Suporte Total de Ranks na Criação de Quests e Ouro Fácil (+10):**
  - **Ajuste de Ouro Fácil (Easy):** Elevado o retorno de ouro da dificuldade Fácil (Rank E) de $8 \rightarrow \mathbf{10\text{ ouro}}$ nas missões normais e da biblioteca.
  - **Novos Ranks na Criação de Quests (B, A, S):** Adicionado suporte para criação de missões com dificuldades/ranks mais altos no modal de criação em `index.html` e `ui.js`:
    - **Rank B (Muito Difícil):** +75 XP / +60 Ouro
    - **Rank A (Heroico):** +100 XP / +80 Ouro
    - **Rank S (Lendário):** +150 XP / +120 Ouro
  - **Renderização Dinâmica de Badges:** Atualizada a lógica de renderização de badges em `ui.js` para mapear dinamicamente e exibir corretamente os rótulos de Ranks superiores (RANK B, RANK A, RANK S) em Daily Quests e Side Quests.

## [v2.1.29] — 2026-06-28
- **Melhorias de Ouro Base e Escalabilidade de Streak (Rebalanceamento Econômico):**
  - **Aumento no Ouro Base de Quests:** Elevado o retorno de ouro de todas as dificuldades de missões:
    - **Fácil (Easy):** $5 \rightarrow \mathbf{8\text{ ouro}}$.
    - **Médio (Medium):** $15 \rightarrow \mathbf{20\text{ ouro}}$.
    - **Difícil (Hard):** $30 \rightarrow \mathbf{40\text{ ouro}}$.
  - **Ampliação do Multiplicador de Streak (Consistência):**
    - **Streak 7+ dias:** $+10\% \rightarrow \mathbf{+15\%}$ (0.15).
    - **Streak 14+ dias:** $+20\% \rightarrow \mathbf{+30\%}$ (0.30).
    - **Streak 30+ dias:** $+30\% \rightarrow \mathbf{+50\%}$ (0.50).
  - **Ajuste Fino de Preço do Foco Lendário:**
    - Reprecificado o **Pergaminho do Foco Lendário** (`buff_legendary_focus`) de $600 \rightarrow \mathbf{400\text{ ouro}}$ na Taverna e nas regras de venda. Isso viabiliza um ROI positivo e recompensador no mid-to-late game (lucro de até +480 ouro com setup otimizado) mantendo o prejuízo/bloqueio estratégico no early-game.

## [v2.1.28] — 2026-06-28
- **Supressão de Toasts de Erro de Sync quando Offline:**
  - **Checagem de navigator.onLine nas APIs do Supabase:** Adicionada verificação de status de conexão ativa antes de realizar chamadas de rede no Supabase em `saveToSupabase`, `saveBuffsToSupabase`, `deleteBuffFromSupabase`, `syncQuestsToSupabase`, `saveAllHistoryToSupabase` e `syncInventoryToSupabase`.
  - **Experiência Offline Silenciosa:** Evita a exibição redundante e alarmante de toasts como `TypeError: Failed to fetch` e `Erro de Sincronização` quando o jogador realiza ações normais offline. O banner vermelho já indica o status e a sincronização automática acontecerá transparentemente quando a conexão retornar.

## [v2.1.27] — 2026-06-28
- **Banner de Status Offline & Sync Automático (PWA-003 - P1 Alto):**
  - **Banner Indicador Offline:** Adicionado elemento de banner vermelho no topo da tela (`#offline-banner`) com mensagem informativa visual quando o navegador perde a conexão com a internet.
  - **Estilização Neon-Red Glass:** Criada classe `.offline-banner` no styles.css com posicionamento fixo, bloqueio de cliques (para não interferir com a UI do cabeçalho) e visual vibrante.
  - **Eventos de Status de Rede:** Configurados listeners para os eventos `online` e `offline` no `pwa.js` (inicializados no boot do `app.js`).
  - **Sincronização Automática na Reconexão:** Ao restabelecer a conexão com a rede, o banner desaparece e, caso o usuário esteja autenticado, uma sincronização automática com a nuvem (`saveToCloud()`) é disparada de forma silenciosa para enviar todas as alterações enfileiradas offline.

## [v2.1.26] — 2026-06-28
- **Fix do Chat Global (BUG-002 - P0 Crítico):**
  - **Exibição Otimista de Mensagens:** O envio de mensagens de chat agora usa `.insert().select()` e insere a mensagem na UI localmente de forma imediata e transparente caso a transação seja bem-sucedida, sem depender exclusivamente do Realtime.
  - **Prevenção de Duplicados:** Implementado controle no `appendMessageUI` que verifica o ID do elemento no DOM para evitar renderização duplicada entre a postagem local e a subscription.
  - **Robustecimento do Realtime:** Removido o filtro de coluna no Postgres Changes (`filter: 'channel=eq.global'`), que falhava silenciosamente em diversos cenários, e transferida a filtragem de canal (`global`) diretamente para o callback em JavaScript.

## [v2.1.25] — 2026-06-28
- **Endurecimento e Rebalanceamento Geral da Economia:**
  - **Preços da Loja e Taverna Reajustados:** Aumento de $2\times$ a $6\times$ nos consumíveis e cosméticos (ex: Poção de Auto-Cura de 400 para 800, Escudo de 500 para 1000, e Borda Imperador Arise de 4000 para 6000).
  - **Foco Lendário Viabilizado:** Aumento do multiplicador do Foco Lendário de $x3$ para **$x5$** (quíntuplo) de ouro na próxima quest, readequando o custo de 600 ouro como uma aposta viável e desafiadora de late-game.
  - **Correção de Divergência HTML vs JS:** Todos os preços e travas de nível (como Grimório exigindo nível 20+) foram sincronizados com exatidão entre o frontend e a lógica JS.
  - **Correção de Preço no Tutorial:** Resolvido bug sutil em `social.js` que redefinia o preço da skin *Mestre das Sombras* para 250 ouro (agora corrigido para o novo preço de 2000 ouro).
  - **Depreciação de Código Legado:** Marcada a função `renderRewards()` em `ui.js` como `@deprecated`.

## [v2.1.24] — 2026-06-27
- **META-001 · 5 novos achievements** (catálogo expandido de 16 → 21):
  - **Missões:** *Dia Lendário* (5 missões num dia, 30💰/raro), *Veterano* (50 no total, 80💰/raro), *Lenda* (100 no total, 200💰/lendário).
  - **Social & PvP:** *Gladiador* (1ª vitória em duelo PvP, 100💰/raro), *Aliança* (3 amigos, 50💰/incomum).
  - **Contadores novos** em `gameState`: `_totalQuestsCompleted` (incrementa ao concluir, decrementa ao desmarcar), `_maxDailyCompleted` (pico de conclusões num dia), `_pvpWins` (derivado do histórico de duelos, idempotente). Migração automática para usuários existentes.
  - **2 categorias novas** na aba de Conquistas (`renderAchievements`): *MISSÕES* 📜 e *SOCIAL & PVP* 🤝.

## [v2.1.23] — 2026-06-27
- **Outbox de operações de quest (sync confiável de adições E exclusões):**
  - **Fila de intenções (`gameState.questOps`):** cada adição/edição registra uma op `upsert` e cada exclusão registra uma op `delete` ([`state.js` → `queueQuestOp`](../1.core/modules/state.js)). Persiste no `localStorage` junto com o estado; migração automática para usuários existentes.
  - **`flushQuestOps()`** ([`supabase-config.js`](../1.core/supabase-config.js)) replica a fila no Supabase (upsert por id ou delete por id), removendo cada op só após sucesso — falha/offline mantém na fila. Disparado: ao adicionar/excluir (se online), no início de `syncFromCloud`/`forceLoadFromCloud` (**antes** de puxar) e no evento `online` (reconexão).
  - **Exclusões agora são duráveis offline:** o `confirmRemoveQuest` deixou de chamar `deleteQuestFromCloud` na hora (que falhava silenciosamente sem rede) e passou a enfileirar a op — sobe no próximo flush.
  - **Merge guiado pela fila:** o load da nuvem só preserva quests locais com `upsert` pendente. Resolve a ambiguidade do merge por diferença de conjuntos do v2.1.22 — uma quest deletada em **outro aparelho** não é mais ressuscitada.
  - **Refactor:** mapeamento quest→linha extraído em `questToRow()` (fonte única, reusado por `syncQuestsToSupabase` e `flushQuestOps`); helper `findLocalQuest()`.

## [v2.1.22] — 2026-06-27
- **Fix crítico — perda de quests adicionadas offline (data loss):**
  - **Causa raiz:** `loadQuestsFromSupabase` fazia overwrite destrutivo (`gameState.quests = data...`), apagando qualquer quest local ainda não sincronizada. Como adicionar uma quest não a sobe para a nuvem no dia a dia (só `saveToSupabase`/estado do jogador sobe), uma quest criada offline existia apenas no `localStorage` e era destruída no primeiro load da nuvem (pull-to-refresh ou boot com "nuvem ganha").
  - **Merge não-destrutivo:** o load agora preserva as quests/side-quests locais cujo `id` não existe na nuvem (adições não sincronizadas) e, estando online, sobe o conjunto mesclado (superset da nuvem) para torná-las duráveis — o `delete-orphans` não remove nada por ser superset. Um refresh nunca mais apaga uma quest recém-criada.
  - **Guard de offline no pull-to-refresh:** `forceLoadFromCloud` e o gesto de puxar-para-baixo agora abortam graciosamente quando `!navigator.onLine`, com aviso ao usuário, sem tocar no estado local.

## [v2.1.21] — 2026-06-27
- **Modo Offline Robusto (P0):**
  - **Lib do Supabase vendorizada:** o SDK (`@supabase/supabase-js@2.108.2`) deixou de ser carregado via CDN jsdelivr e passou a ser servido localmente em [`1.core/vendor/supabase.min.js`](../1.core/vendor/supabase.min.js), eliminando a dependência de rede no boot e o risco de o CDN estar lento/fora do ar.
  - **Cache do Service Worker:** o arquivo vendorizado foi adicionado ao `ASSETS_TO_CACHE` do `sw.js`, garantindo boot offline confiável após o primeiro acesso.
  - **Blindagem do boot (`supabase-config.js`):** `createClient` agora é guardado por `SUPABASE_AVAILABLE`; se a lib não existir, `supabaseClient` fica `null` e `initSupabase` resolve graciosamente em modo offline-first (localStorage), sem lançar erro no console nem travar a UI.

## [v2.1.20] — 2026-06-26
- **Otimização de Performance de Inicialização (Startup):**
  - **Service Worker:** Estratégia *Stale-While-Revalidate* implementada para o `index.html`, removendo reloads automáticos intrusivos na detecção de `SW_UPDATED` (atualização aplicada no próximo boot frio).
  - **Remoção de Duplo Boot:** Exclusão do `getSession` assíncrono redundante em paralelo com `onAuthStateChange` na inicialização do Supabase, com o acréscimo da trava de boot `authBootStarted`.
  - **Paralelização de Sync (`Promise.all`):** Leituras (`quests`, `history`, `inventory`, `buffs` e profile) e escritas no Supabase unificadas em promessas paralelas no `syncFromCloud` e no `forceLoadFromCloud`.
  - **Prevenção de Concorrência & Abort Check:** Adicionada a trava `syncStarted` para impedir sincronizações concorrentes e cancelamento imediato de sync caso o usuário mude de conta/logout no meio da operação.
  - **Dismiss Instantâneo do Overlay:** Ocultação do loading overlay em ~150ms se houver dados em localStorage, usando duplo `requestAnimationFrame` para garantir pintura limpa (sem flash em branco).

## [v2.1.19] — 2026-06-26
- **Títulos de rank renomeados:** A = "O Herói", S = "Soberano", Nacional = "Lendário".
- **Sincronização na nuvem** de cosméticos: `unlockedTitles`, `unlockedBorders`, `activeTitle`, `activeBorder` e `rankEvaluationsClaimed` agora vão para o `settings` (save em `ensureUserProfile` + `saveToSupabase`) e voltam via `applyCloudCosmetics()` no `syncFromCloud`/`forceLoadFromCloud`. Resolve a lacuna multi-device de títulos/reavaliações.

## [v2.1.18] — 2026-06-26

### Economia — Reavaliação de Rank (ralo estrutural)
Modelo cerimônia + prestígio (mérito preservado): o rank do avatar sobe por nível; a **Reavaliação** é uma compra OPCIONAL que entrega o **título de prestígio** do rank.
- Custo escalonado: D 250 · C 600 · B 1.200 · A 2.500 · S 4.500 · Nacional 7.000 · Monarca 12.000.
- Títulos: O Iniciado · O Caçador · A Elite · Herói Lendário · O Soberano · Nível Nacional · O Monarca (auto-equipados, cor dourada).
- Banner no topo da aba Missões aparece quando há uma reavaliação disponível.
- `gameState.rankEvaluationsClaimed` rastreia as já feitas. _(Conhecido: títulos/reavaliações ainda não sincronizam pra nuvem — persistem no localStorage; sync é follow-up.)_

## [v2.1.17] — 2026-06-26

### Economia — Multiplicador de renda por rank
- XP e ouro por quest agora escalam com o rank do avatar: D ×1.1 · C ×1.2 · B ×1.35 · A ×1.5 · S ×1.75 · Nacional ×2.0 · Monarca ×2.5 (Candidato/E ×1.0). Aplicado em `addRewards`, compõe com streak/sinergia/grupo/tomo. Destrava a curva de fim de jogo e alimenta o loop rank→renda→tomos. (SINTONIA semanal segue flat.)

## [v2.1.16] — 2026-06-26

### Loja — Tomos de XP em 3 tiers (Caminho B: duração + custo)
- **Pergaminho de Sabedoria:** 2× XP · 1 dia · 80 ouro.
- **Tomo do Conhecimento:** 3× XP · 3 dias · 360 ouro.
- **Grimório Lendário:** 5× XP · 5 dias · 800 ouro (custo-benefício melhor — 40/unidade — mas só quem é rico/ranqueado alcança).
- Buff agora guarda `xpMult` (2/3/5); aplicação de XP usa `getActiveXpMultiplier()`; persistência na nuvem via `buff_type` (doubleXp/tripleXp/megaXp), sem migração de schema. Indicador no HUD mostra o multiplicador real.

## [v2.1.15] — 2026-06-26
- **SINTONIA S mais rara:** fator de volume `× 6.5 → × 2` (satura em ~50 conclusões/semana). Antes 5/10 perfis tiravam S; agora só os hiper-dedicados. Simulação: Iron Man/Personal/Concurseiro = S, Empreendedor = A, Executivo = C.

## [v2.1.14] — 2026-06-26
- **Recompensas da SINTONIA dobradas:** S 160/300, A 100/200, B 60/120, C 30/60, D 10/30, E 0/0 (concedidas no fechamento semanal).

## [v2.1.13] — 2026-06-26

### Game design — Faixas da SINTONIA mais duras (estilo Solo Leveling)
- Novas faixas de score: **S > 95** (raríssimo), **A ≥ 85**, **B ≥ 70**, **C ≥ 50**, **D ≥ 30**, **E < 30**.
- Adicionado o rank **E** (abaixo de 30). Recompensas: S 80/150, A 50/100, B 30/60, C 15/30, **D 5/15**, **E 0/0**.
- Adicionado o estilo `.rank-glow-a` (faltava — o rank A ficava sem cor).
- Os gates de tempo seguem valendo (S ≥ 2h, A ≥ 1h).

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
