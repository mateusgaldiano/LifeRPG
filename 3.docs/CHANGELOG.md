# Changelog — LifeRPG OS

Registro de todas as mudanças relevantes do projeto. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/).

> **Fonte única de versão:** [`1.core/version.js`](../1.core/version.js).
> A cada release, bump o valor lá **e** adicione uma entrada aqui.
> O mesmo número aparece nas Configurações (engrenagens) e no cache do Service Worker.

---

## [v2.5.19] — 2026-07-12
- **Baús de Foco Diário (Early Bird / Night Owl):** recompensam a consistência de horário e induzem o hábito de abrir o app 2×/dia.
  - **🌅 Baú do Caçador Matutino:** conclua 1 hábito **antes das 09h** → ganha um baú que só abre **após as 18h**.
  - **🌙 Baú da Patrulha Noturna:** conclua 1 hábito **após as 20h** → resgate **na manhã seguinte**.
  - Recompensa (50/50): bônus de Ouro (escala com o rank) ou a **Poção de Foco** (+50% de XP nas missões por 30 min). O gatilho de ganho roda em `toggleQuest` (`checkDailyChestEarn`); o status é derivado de datas (`gameState.dailyChest`), calculado em tempo real (`none`/`locked`/`ready`/`opened`), e um banner clicável aparece no topo das Missões (`renderDailyChests`). Poção de Foco entra em `getActiveXpMultiplier` (empilha ×1,5 multiplicativo com os tomos).
- **❄️ Amuletos de Fim de Semana (Weekend Freeze):** amuleto na Taverna (600 Ouro) que congela o próximo **sábado** ou **domingo**. Ao virar o dia, o reset diário perdoa automaticamente as faltas da data congelada: **sem penalidade, sem reset de streak**, `consecutiveMisses` zerado e o dia marcado como neutro no histórico. Ideal para detox/descanso de fim de semana sem arruinar a sequência. Datas ficam em `gameState.frozenDates`; amuletos vencidos são consumidos no rollover. Não é possível congelar o mesmo dia duas vezes.
- Persistência via `gameState`/localStorage (mesmo padrão de `shields`/`activeDungeon`); migração aditiva em `loadGameData`. A Poção de Foco (`buffs.focusPotionExpiresAt`) sobrevive ao sync de buffs da nuvem (fica local).

## [v2.5.18] — 2026-07-12
- **Novos itens de loja na Taverna (3 mecânicas de economia/retenção):**
  - **⏳ Ampulheta de Chronos (Restauração Retroativa de Streak):** item caro (2500 Ouro) que reverte uma sequência perdida recentemente, apagando a falha — combate o churn de quem esquece de abrir o app e perde um streak longo. Restrições: só reverte perda ocorrida nos **últimos 3 dias** e **uso único a cada 30 dias**. Ao resetar o streak, o `applyDailyPenalty` agora tira um *snapshot* (`gameState.lostStreak = { value, lostOn }`) que a Ampulheta consome; o uso zera `consecutiveMisses` e arma o cooldown (`lastHourglassAt`).
  - **🗝️ Chaves de Portal (Masmorras sob demanda):** 6 chaves (uma por atributo — Ferro/Físico, Mente/Sabedoria, Zen/Mental, Foco/Produtividade, Laços/Social, Ordem/Rotina), 300 Ouro cada, que abrem uma masmorra focada na skill escolhida na hora. Dá controle ao jogador para evoluir atributos atrasados no radar em vez de esperar a masmorra aleatória do agendamento. `spawnDungeon(forcedSkill)` passou a aceitar uma skill forçada (bypassa o agendamento, mantém a regra de "uma masmorra por vez"). Exige 1 habilidade em Nível 3+ e nenhuma masmorra ativa.
  - **🏛️ Tributo Semanal ao Sistema (dreno de fim de jogo):** doação voluntária que converte 1000 Ouro em +5 XP na habilidade escolhida — taxa dura de propósito, para drenar o excedente de ouro de quem já maximizou tudo. Limite de **1× por semana** (cooldown por semana ISO em `lastTributeWeek`) e liberado a partir do nível 10. Novo helper `grantRawSkillXP(skill, amount)` concede uma quantidade exata de skill XP com carry-over de nível.
  - Persistência: os três campos novos vivem no `gameState` (localStorage), mesmo padrão de `shields`/`activeDungeon` — mecânicas consumíveis não sincronizadas via RPC. Migração aditiva em `loadGameData` dá default a saves antigos.

## [v2.5.17] — 2026-07-08
- **Avisos de falha/punição agora persistem até o usuário fechar no X.** Antes, a mensagem que explicava *por que* você falhou e *qual* a punição (−XP, reset de streak, debuff) era um toast que sumia sozinho em ~3s (o `toastFadeOut` da CSS disparava em 2.6s), sem dar tempo de ler. Agora: (1) **todo** toast ganhou um botão **✕** pra dispensar manualmente; (2) toasts do tipo `toast-alert` (falha diária, recaída de vício, escudo/poção consumidos) **não somem sozinhos** — a CSS remove o fade-out e o JS não agenda a remoção automática; só saem no ✕. As mensagens de penalidade do reset diário passaram a usar `toast-alert`.

## [v2.5.16] — 2026-07-08
- **Refactor: `completedIds` agora usa coluna dedicada `history.completed_ids` (jsonb).** A v2.5.15 resolvia a persistência dos nomes de hábitos concluídos enfiando o array dentro de `skills_xp._completedIds` — mas `skills_xp` tem significado próprio (XP por skill), então era uma gambiarra semântica. Migração no Supabase adiciona `history.completed_ids jsonb NOT NULL DEFAULT '[]'`, move qualquer resquício de `skills_xp._completedIds` pra ela e limpa o `skills_xp`. O upload passa a gravar em `completed_ids`; o download lê de lá (com fallback transitório pro `skills_xp._completedIds`, caso um sync da v2.5.15 tenha rodado antes desta versão). Sem perda de dado e sem quebra de retrocompatibilidade.

## [v2.5.15] — 2026-07-08
- **Fix: persistência da lista de hábitos concluídos (`completedIds`) no banco de dados:**
  - **Problema:** A tabela `history` do Supabase não possui uma coluna para `completedIds`. Portanto, sempre que o usuário limpava o cache local do navegador, reinstalava o PWA ou fazia login em um novo dispositivo, os nomes das tarefas concluídas no histórico eram perdidos, zerando as contagens de hábitos individuais (como "Deepstash") na aba Visão Geral/Dashboard.
  - **Solução:** Como a coluna `skills_xp` é do tipo `jsonb` (objeto JSON arbitrário), agora passamos a embutir o array `completedIds` de forma transparente dentro de `skills_xp` sob a chave privada `_completedIds` durante o sync de upload. No sync de download, decodificamos essa chave de volta para restaurar o `completedIds`. Isso preserva o histórico de nomes de tarefas com 100% de retrocompatibilidade e sem precisar alterar a estrutura física do banco.

## [v2.5.14] — 2026-07-08
- **Fix: prevenção definitiva de re-upload de dados mock para o Supabase:** Adicionado um filtro de segurança na rotina `saveAllHistoryToSupabase()` para garantir que qualquer entrada mock/fantasma (sem `completedIds` reais e sem `xpEarned`) seja excluída antes de tentar fazer upload para a nuvem. Isso interrompe de vez o ciclo vicioso onde dados mock deletados diretamente da nuvem eram re-enviados pelo cliente do jogo.

## [v2.5.13] — 2026-07-08
- **Fix: limpeza definitiva de dados mock na Visão Geral.** O filtro anterior (`total===8`) não detectava mock entries cujos campos `total`/`count` foram corrompidos por ciclos de sync local↔nuvem. Novo critério: qualquer entrada de histórico **sem `completedIds` preenchido** (array vazio ou ausente) **E sem `xpEarned`** é considerada fantasma/mock e removida. Migração única com flag `mock_purge_v2`. O mesmo filtro é aplicado dentro de `loadHistoryFromSupabase()` para impedir que entries fantasma do localStorage sobrevivam ao merge pós-sync.

## [v2.5.12] — 2026-07-08
- **Fix: dados mock persistentes na aba Visão Geral mesmo após deletar do Supabase.**
  - **Causa raiz:** `loadHistoryFromSupabase()` fazia merge não-destrutivo que começava com **todo** o localStorage. Entradas mock locais que não existiam na nuvem permaneciam intocadas no merge. Além disso, a detecção de mock (`isMockHistoryEntry`) verificava `completedIds === undefined`, mas entradas mock que passaram por `normalizeHistoryEntry()` ganhavam `completedIds: []` e `xpEarned: 0` — escapando da limpeza.
  - **Correções:** (1) `isMockHistoryEntry` agora aceita `completedIds` vazio (`[]`) e `xpEarned: 0` como equivalentes a ausente. (2) `loadHistoryFromSupabase` purga entradas mock do resultado final do merge antes de atribuir a `gameState.history`.

## [v2.5.11] — 2026-07-08
- **Fix: persistência e cálculo da Sequência de Abstinência (Streak de Vícios):**
  - **Sincronização com a Nuvem:** O `addictionStreak` (streak de vícios) e `_addictionRelapsedToday` (flag de recaída do dia) não eram salvos no Supabase, fazendo com que a sequência de vícios fosse zerada ou desincronizada constantemente ao fazer login em múltiplos dispositivos ou ao ocorrer um sync "nuvem ganha". Agora ambas as propriedades são salvas e carregadas do JSON `settings` do jogador.
  - **Cálculo Robusto no Reset Diário:** O reset diário dependia apenas do flag `_addictionRelapsedToday`, o que podia causar descompassos se o flag não estivesse persistido. Agora, o reset diário também analisa as quests de vício ativas do dia anterior: se qualquer vício tiver sido deixado sem concluir (`completed === false`), o sistema reconhece a recaída e reseta o streak para 0, mesmo se o flag temporário estiver ausente.

## [v2.5.10] — 2026-07-07
- **Fix: aba Visão Geral não puxava os dados (heatmap sempre vazio).** O heatmap anual buscava `history[d.toDateString()]` (ex.: `"Mon Jul 06 2026"`) enquanto o histórico é chaveado por `localDateStr` (`"2026-07-06"`) — nunca batia, então todos os 365 quadradinhos ficavam cinza. Exatamente o bug que a CLAUDE.md alerta sobre `toDateString()`. Corrigido para `localDateStr(d)`.
- **Progresso de HOJE aparece na hora.** O histórico de um dia só era gravado no rollover diário, então a atividade de hoje nunca aparecia no dashboard até o dia seguinte. Agora o dia atual é computado ao vivo do estado das quests (sem gravar) e entra no heatmap + métricas imediatamente.
- **Limpeza dos "números genéricos".** Saves anteriores à v2.5.8 gravaram no localStorage os 90 dias de histórico FALSO da antiga MOCK DATA — remover a *geração* (v2.5.8) não apagou o que já estava salvo. Adicionada uma limpeza única no `loadGameData` que purga só as entradas com a assinatura exata do mock (`total===8`, `count ∈ {0,2,5,8}`, sem `completedIds`/`xpEarned`); entradas reais carregam `completedIds` e não são tocadas.

## [v2.5.9] — 2026-07-07
- **Fix (perda de dados): vícios sumiam ao sincronizar com a nuvem.** `loadQuestsFromSupabase` só reconstruía quests dos tipos `daily`/`weekly`/`side` — o tipo `addiction` não batia com nenhum filtro, então todo vício era descartado num sync "nuvem vence" (ou no botão de sincronizar) assim que sua op de outbox flushava. Adicionado o mapeamento de `addiction` no load (preservando `completed`/abstinência e incluindo os ids no merge). Bug existia desde a v2.5.0.
- **Fix: vício "abstinente" contava como quest concluída.** Como vícios nascem `completed: true`, três lugares os contavam como missão concluída: a conquista *"Conclua sua primeira Missão"* auto-desbloqueava ao só adicionar um vício; o pico diário (`_maxDailyCompleted`) inflava; e a "frase de impacto da primeira quest do dia" disparava na quest errada. Os três agora excluem `type === 'addiction'`.

## [v2.5.8] — 2026-07-06
- **Fix: atribuição de skill/tempo no relatório deixou de depender de "join por título".** O histórico salvava só o *título* de cada quest concluída (`completedIds`) e o relatório/heatmap re-cruzavam por `title` para achar skill e duração — o que falhava silenciosamente (caía em Rotina/5min) se houvesse títulos repetidos, uma quest renomeada ou excluída. Agora cada conclusão é **denormalizada** no momento em que acontece: `{ id, title, skill, duration }`. Os leitores (worker do relatório, caminho síncrono e heatmap "Top Hábitos") usam skill/duração direto, sem lookup, e continuam aceitando entradas antigas (string) via fallback. Imune a rename/duplicação de título.
- **Removido MOCK DATA de produção.** O `loadGameData` gerava **90 dias de histórico falso** quando o save tinha nível > 1 e histórico vazio — artefato de dev que poluía heatmap e estatísticas de usuários reais. Removido.

## [v2.5.7] — 2026-07-06
- **Testes automatizados + núcleo puro testável.** Criado `1.core/modules/game-math.js`: um módulo **sem dependência de DOM/estado/localStorage** que centraliza `RANK_THRESHOLDS` + `getRankForLevel`, `getXpToNextForLevel` e `computeSintoniaTier`/`SINTONIA_TIER_MAP`. `state.js`, `utils.js` e `weekly-report.js` agora **re-exportam** dessa fonte única (superfície de import intacta, zero duplicação). Isso destrava testes de verdade: `tests/game-math.test.mjs` roda com `node --test "tests/**/*.test.mjs"` e cobre fronteiras de tier da Sintonia + gates de tempo, a curva de XP (100·nível^1.5, monotonicidade) e as fronteiras de rank. **11 testes, todos passando.** (`package.json` é local/gitignored, então o comando canônico é o `node --test` direto.) Motivação: importar os módulos de UI/estado no Node trava (efeitos colaterais no topo) — extrair o núcleo puro é o que torna o código testável.

## [v2.5.6] — 2026-07-06
- **Refactor (manutenção): Radar Chart extraído para módulo próprio.** As 3 funções do gráfico de radar (`drawRadarChart` + helpers `getSkillColor`/`drawVertexMarker`, ~190 linhas) saíram de `ui.js` para `1.core/modules/radar-chart.js` — unidade de render autocontida que só depende de `gameState.skills`. `ui.js` caiu de 2260 → 2069 linhas e re-exporta `drawRadarChart` (superfície do `app.js` intacta). Bônus: removido um **import morto** (`drawRadarChart`) de `utils.js`, eliminando um ciclo de import `utils → ui`. Sem mudança de comportamento. Adicionado ao cache do SW.

## [v2.5.5] — 2026-07-06
- **Refactor (manutenção): Biblioteca de Hábitos extraída para módulo próprio.** As ~380 linhas da biblioteca de hábitos (busca/filtro/render + modal de confirmação + adição ao estado) saíram de `social.js` — onde não tinham nada de "social" — para o novo `1.core/modules/habit-library.js`. `social.js` caiu de 2726 → 2342 linhas e faz re-export das funções públicas, mantendo a superfície de import do `app.js` intacta. Sem mudança de comportamento. Adicionado ao cache do Service Worker.

## [v2.5.4] — 2026-07-06
- **Fix de perda de dados no sync do histórico:** o load da nuvem fazia `gameState.history = {}` e reconstruía só com os dados do servidor — apagando dias que só existiam localmente (ex.: progresso acumulado offline antes de outro aparelho sincronizar). Além disso havia um descasamento de nomes de campo: o upload lia `questsDone`/`questsTotal` (inexistentes no registro local, subindo sempre 0/0) e o download gravava esses mesmos nomes, enquanto heatmap e relatório semanal leem `count`/`total` — então após qualquer sync "nuvem vence" o heatmap e a Sintonia zeravam. Agora o histórico usa um **merge não-destrutivo** (união por data, mantendo o registro com mais conclusões e preservando `completedIds` local) com um **normalizador** que padroniza o formato canônico e **auto-cura** saves antigos corrompidos. As quests já eram protegidas por outbox (flush-antes-de-ler).

## [v2.5.3] — 2026-07-06
- **Bump de cache:** invalidação forçada do Service Worker (`liferpg-cache-v2.5.3`) para garantir que todos os clientes peguem a geração mais recente de HTML/JS/CSS na próxima visita. Sem mudança funcional.

## [v2.5.2] — 2026-07-06
- **Fórmula da Sintonia Semanal unificada:** eliminada a duplicação da fórmula de tier/recompensa entre `weekly-report.js` e `report-worker.js`, que podia gerar relatórios inconsistentes conforme o caminho de execução (Worker vs. síncrono). Agora o `report-worker.js` é **apenas agregador** (devolve os agregados brutos + `completedTitles`) e a decisão de tier vive numa **única função pura exportada**, `computeSintoniaTier({ completedQuests, survivalRate, totalMinutes })`. O `totalMinutes` passa a ser calculado na Main Thread; ambos os caminhos (Worker e fallback síncrono) usam exatamente a mesma fórmula.

## [v2.5.1] — 2026-07-06
- **Novo vício na Biblioteca:** adicionado **"Não jogar"** 🎮 à curadoria de vícios do filtro VÍCIOS.

## [v2.5.0] — 2026-07-06
- **Sistema de Vícios:** Novo tipo de quest `addiction` para rastrear abstinência. Vícios **nascem completos** (limpo por padrão) a cada novo dia; desmarcar registra uma **recaída**, que aplica um debuff de **-30% de XP por 24h** e zera a `addictionStreak` (sequência de dias sem recaída). Remarcar no mesmo dia = arrependimento, que **remove o debuff** (se nenhum outro vício estiver desmarcado). Nova seção **VÍCIOS** na aba de Missões (com contador 🔥 de dias limpos), tipo **🔥 VÍCIO** no criador de quest personalizada (sem skill/XP/gold), e filtro **VÍCIOS** na Biblioteca de Hábitos com uma curadoria de vícios comuns. O debuff persiste na nuvem via `user_buffs` (`addictionPenalty`).

## [v2.4.1] — 2026-07-06
- **Sintonia Semanal baseada 100% em volume absoluto:** A Sintonia Semanal foi alterada para depender puramente da quantidade absoluta de quests concluídas na semana, eliminando a penalização por taxa de conclusão (% de sobrevivência). Além disso, sincronizei a lógica de cálculo entre a Main Thread (`weekly-report.js`) e o Web Worker (`report-worker.js`), corrigindo um bug que reportava o tempo total de atividades semanal como `0min`.

## [v2.4.0] — 2026-07-06
- **Ajuste na regra de penalidades:** A partir de agora, a penalidade diária por falha de quests só é aplicada se a taxa de conclusão das missões ativas do dia for **menor que 70%**. Se o usuário concluir 70% ou mais das quests, ele não será punido, e o contador de falhas consecutivas (`consecutiveMisses`) será zerado.

## [v2.3.9] — 2026-07-06
- **Fix: inicialização das listas de quests e side quests.** Corrigido um bug onde `gameState.quests` ou `gameState.sideQuests` ficavam `undefined` se estivessem ausentes no estado carregado do `localStorage` (ex.: de versões antigas do app ou saves antigos), o que causava um erro silencioso de `TypeError: Cannot read properties of undefined (reading 'push')` ao tentar adicionar uma quest personalizada/avulsa (fazendo com que o botão "LANÇAR QUEST" não funcionasse).

## [v2.3.8] — 2026-07-05
- **Quest personalizada: removido o campo de Ícone** (redundante com a Categoria). O ícone agora é derivado automaticamente da categoria escolhida (Físico 💪, Sabedoria 📚, Foco 🎯, Conexão 🤝, Mental 🧠, Rotina 🛏️).

## [v2.3.7] — 2026-07-05
- **Quest personalizada agora tem seletor de CATEGORIA.** Antes, toda quest criada em "Criar Personalizada" não tinha `skill` e caía sempre em Rotina (fallback). Adicionado um dropdown com os 6 tipos na ordem da tela inicial (Físico, Sabedoria, Foco, Conexão, Mental, Rotina); o valor é gravado em `skill` nas quests diária/semanal/avulsa, então a atividade vai pra coluna certa (ex.: leitura "deepstash" → Sabedoria).

## [v2.3.6] — 2026-07-05
- **Biblioteca de Hábitos (modal "Nova Quest") ordenada.** A lista agora vem com os 6 tipos na **mesma ordem da tela inicial** (Físico → Sabedoria → Foco → Conexão → Mental → Rotina) e, dentro de cada tipo, por dificuldade (**Fácil → Intermediário → Difícil**). Os botões de filtro também foram reordenados pra bater com a tela inicial.

## [v2.3.5] — 2026-07-05
- **Fix: linha de recursos (Ouro / Streak / Grupo) vazava da tela no celular.** Os chips tinham `flex: 1` mas `min-width: auto`, então não encolhiam e a linha estourava a largura — o chip de Grupo saía pra fora. Agora usam `flex: 1 1 auto` + `min-width: 0` (cada um pega o espaço que precisa) e há um ajuste de tamanho para telas ≤430px. Verificado em 360/375px e desktop, sem overflow nem corte, inclusive com Ouro de 4 dígitos.

## [v2.3.4] — 2026-07-03
- **Fix: modal de perfil do jogador (3 bugs).**
  - **Botão X não fechava:** `setupPlayerProfileListeners` (que liga o X e o botão de duelo) nunca rodava — era chamado em `ui.js` com um guard `typeof`, mas a função não é exportada, então o guard sempre falhava. Agora é chamado dentro de `setupSocialModalListeners` (mesmo módulo).
  - **Atributos apareciam "Lvl NaN":** o código lia as skills como número (`val/100`), mas hoje elas são objetos `{level, xp, xpToNext}`; e usava a chave `focus` em vez de `productivity` (por isso só Foco mostrava algo). Corrigido para ler o objeto e usar a chave certa (com fallback pro formato numérico antigo).
  - **Modal cortado / sem rolagem no mobile:** `.modal-box-profile` não tinha limite de altura; agora usa `max-height: calc(100dvh - 56px)` + `overflow-y: auto`.

## [v2.3.3] — 2026-07-03
- **Fix: botão de notificações agora liga E desliga (era só "Ativar" e travava).** Quando a permissão estava concedida, o botão virava "ATIVADO" e ficava `disabled` — impossível desativar. Agora é um toggle real:
  - Como o navegador não permite revogar a permissão via JS, "desativar" remove a inscrição de push e marca `enabled=false` (flag local `gameState.notificationsEnabled` + `user_notif_prefs`), então o servidor para de enviar.
  - "ativar" pede permissão (se preciso), re-inscreve e marca `enabled=true`.
  - No login, não re-inscreve se o usuário tinha desativado.

## [v2.3.2] — 2026-07-03
- **Notificações push respeitam o horário configurado no app (fase 2).** O slider Manhã/Noite agora controla de verdade o push do servidor.
  - `pwa.js`: nova `syncNotifPrefsToCloud()` grava os horários na tabela `user_notif_prefs`, já convertidos pra UTC usando o fuso do próprio dispositivo (`getTimezoneOffset`) — o servidor não precisa saber timezone de ninguém. Chamada ao salvar horários e no login/concessão de permissão.
  - Edge Function `send-push`: nova ação `trigger_scheduled` — roda a cada 15 min e dispara pra quem tem horário (manhã ou noite) caindo no bloco de 15 min atual (precisão ~15 min; cada horário dispara 1x/dia).
  - **Backend (você aplica):** `3.docs/setup_push_phase2_horarios.sql` cria `user_notif_prefs` + RLS e troca o cron fixo por um a cada 15 min (`trigger_scheduled`).

## [v2.3.1] — 2026-07-03
- **Notificações push reais (parte cliente).** Corrigido o motivo de nunca terem funcionado: havia **três chaves VAPID públicas diferentes** no projeto (pwa.js, Edge Function e uma terceira), então o serviço de push rejeitava tudo por mismatch. Agora tudo usa **um único par de chaves** novo.
  - `pwa.js`: chave pública VAPID atualizada; `subscribeUserToPush` passa a remover uma inscrição antiga quando a chave difere (evita `InvalidStateError` na rotação de chave).
  - Edge Function `send-push`: passa a ler a chave pública do env (fonte única), com fallback na chave nova.
  - **Backend (você aplica no Supabase):** `3.docs/setup_push_notifications.sql` (tabela `push_subscriptions` no schema correto + RLS + agendador pg_cron às 19h BRT) e o guia `3.docs/PUSH_SETUP.txt`. Descoberto e resolvido um conflito: havia duas definições incompatíveis de `push_subscriptions` (`users(id)` vs `auth.users(id)`).
  - iOS: só recebe push como PWA instalado (Adicionar à Tela de Início), iOS 16.4+.

## [v2.3.0] — 2026-07-03
- **Biblioteca de Hábitos — revisão completa das 5 categorias restantes** (Mental, Foco, Sabedoria, Rotina, Conexão), fechando a reorganização iniciada na v2.2.4 (Físico).
  - **Mental:** *Fácil* — removidos "Sons da natureza", "Visualizar metas" e "3 afirmações positivas"; adicionados "Diário de gratidão" e "Meditação guiada" (Brain Dump e Leitura filosófica mantidos). *Intermediário* — "Diário de reflexões" renomeado para "Escrever diário"; adicionados "Escrever sobre ideias futuras" e "Escrever sobre preocupações"; "Meditar" renomeado para "Meditação profunda". *Difícil* — adicionados "Meio dia de silêncio", "Dia sem redes" e "Sessão de terapia".
  - **Foco:** *Fácil* — removidos "Organizar a mesa" e "Bloquear distrações"; adicionados "Inbox zero" e "Celular no modo avião". *Intermediário* — removido "Tarefa estratégica"; adicionado "Automatizar uma tarefa". *Difícil* — adicionados "Planejar o trimestre" e "Estruturar Feedback/Meritocracia".
  - **Sabedoria:** *Fácil* — removido "Anotar aprendizados"; "Vídeo / TED Talk" e "Estude um idioma" encurtados para "TED Talk" e "Estudar idioma"; adicionado "Podcast educativo". *Intermediário* — removido "Leitura técnica"; adicionado "Documentário" (Ler livro mantido). *Difícil* — adicionado "Estudar para certificação" (Curso online mantido).
  - **Rotina:** "30s de banho frio" migrado para Físico/Fácil (skill trocada de `routine` para `physical`). Adicionados "Tomar vitaminas/remédio" (Fácil), "Organizar um cômodo" (Intermediário) e "Revisar orçamento do mês" (Difícil).
  - **Conexão:** "Mensagem para um amigo" renomeado para "Mensagem para família/amigo". Intermediário reduzido a um único item, "Ligar família/amigos" (substitui "Ligar para um amigo", "Ligar/vídeo com parente" e "Refeição em família", removidos). Adicionado "Voluntariado" no Difícil (Passear com pet removido).
  - Verificado no preview: 61 itens na Biblioteca, sem ids duplicados, sem skill inválida, console limpo, zero referências órfãs aos ids removidos.

## [v2.2.4] — 2026-07-03
- **Biblioteca de Hábitos — reorganização da categoria Físico.**
  - *Fácil:* removidos "Respiração profunda" e "Agachamentos e flexões"; adicionado "15 min de exercício" (guarda-chuva pros exercícios leves).
  - *Intermediário:* "Caminhada / corrida" renomeado para "Caminhada"; adicionado "Treino de mobilidade" (HIIT mantido).
  - *Difícil:* "Ciclismo / esporte" → "Ciclismo"; "Musculação / natação" → "Natação"; adicionados "Corrida longa", "Trilha / hiking" e "Artes marciais" (Treino de força mantido).

## [v2.2.3] — 2026-07-03
- **Fix crítico: missões sumiam após a atualização das 6 colunas (bug de cache do Service Worker).** O `sw.js` servia o `index.html` com estratégia *stale-while-revalidate* (gravava o HTML novo no cache) mas os JS/CSS com *cache-first* (nunca revalidavam). Resultado: o SW antigo acabava com o `index.html` novo (6 colunas) + o `ui.js` antigo (que procurava os 3 ids de coluna que não existem mais) no mesmo cache → as 6 colunas apareciam vazias. Correções:
  - **`sw.js`:** app shell (HTML + módulos JS + CSS) passa a usar *network-first* com fallback pro cache — HTML e JS ficam sempre da mesma geração. Cache-first fica só para assets estáticos (imagens/ícones).
  - **`pwa.js`:** registro do SW agora usa `updateViaCache: 'none'` e dispara `reg.update()` a cada boot (garante que um bump de versão seja detectado, sem ficar preso no cache HTTP); quando uma versão nova ativa, a página recarrega uma vez (com guarda anti-loop) para aplicar o bundle novo e consistente.
  - **Recuperação automática:** como o próprio `sw.js` mudou, navegadores presos no estado quebrado pegam o novo SW na próxima verificação; o `activate` já apaga o cache antigo poluído. Recuperação imediata manual: um *hard refresh* (Ctrl+Shift+R) força os arquivos novos.

## [v2.2.2] — 2026-07-03
- **Fix: título cosmético da Taverna nunca aparecia.** O título dinâmico (por skill dominante) sobrescrevia incondicionalmente o título comprado/equipado (ex.: "O Implacável", títulos de reavaliação de rank) logo em seguida no `updateUI()`. Agora o dinâmico só se aplica quando não há título cosmético equipado; desequipar volta ao dinâmico normalmente. Bug pré-existente encontrado na auditoria da v2.2.0.

## [v2.2.1] — 2026-07-03
- **Fix: cards de Foco sem acento colorido.** O seletor CSS usava `data-skill="focus"`, mas a skill se chama `productivity` — a regra nunca casava, então cards de Foco (e a masmorra com fallback) ficavam sem a borda verde. Bug pré-existente encontrado na auditoria pós-v2.2.0.
- **Docs:** README atualizado (remoção da menção aos 3 atributos) e espelho `6.dev/app.txt` re-sincronizado com o `app.js` atual (regra do CLAUDE.md).

## [v2.2.0] — 2026-07-03
- **Removida a camada de "3 atributos" (Força de Vontade/Intelecto/Saúde) — o hexágono de 6 skills passa a ser a única fonte de progressão.** Os 3 atributos eram só a média de pares das mesmas 6 skills já mostradas no radar, e essa duplicação foi a causa da confusão do item anterior (Meditar contava como Intelecto no cálculo mas aparecia como Força de Vontade na tela). Mudanças:
  - **Título do personagem** agora é baseado na skill mais alta, com nome temático: Físico → Guerreiro(a), Rotina → Estoico(a), Mental → Monge/Monja, Sabedoria → Sábio(a), Foco → Estrategista, Social → Conector(a). Sem skill dominante clara, mantém "Desperto(a)"; todas baixas, "Novato(a)".
  - **Missões**: as 3 colunas (Força de Vontade/Intelecto/Saúde) viram 6, uma por skill (Físico, Sabedoria, Foco, Conexão, Mental, Rotina), reaproveitando a mesma ordem e cores do hexágono.
  - **Sinergias**: as mesmas 5 de sempre (Vontade de Ferro, Mente Afiada, Corpo e Mente, O Sistema, Lenda Imortal), com os mesmos bônus e a mesma dificuldade — só que agora checam skills específicas em vez do atributo removido.
  - Texto flutuante ao concluir quest e o flash de penalidade por falha agora referenciam a skill específica (ex.: "FOCO ↑") em vez do atributo agrupado.

## [v2.1.50] — 2026-07-03
- **"Lançar finanças" sai do Intelecto, vira Rotina.** Destoava da categoria (era o único item administrativo entre hábitos de leitura/reflexão); agora conta pra Força de Vontade junto com o resto de Rotina.

## [v2.1.49] — 2026-07-03
- **Fix: hábitos "Mental" contavam para Força de Vontade em vez de Intelecto.** Meditar, Leitura filosófica e o resto da categoria Mental (Brain Dump, Diário de reflexões, Visualizar metas, Afirmações, Sons da natureza) apareciam na coluna Força de Vontade e disparavam "+1 FORÇA DE VONTADE" ao concluir, mas o cálculo real do atributo (`computeAttributes`) já somava Mental em Intelecto — uma inconsistência entre o que a tela mostrava e o que era calculado. Rebalanceado para 2x2x2: Físico + Rotina → Força de Vontade; Mental + Sabedoria → Intelecto; Foco/Produtividade + Social → Saúde. De quebra, corrige um bug em que o XP de Foco/Produtividade nunca contava de fato para a barra de Saúde (a fórmula usava uma chave `focus` que não existe nos skills salvos).

## [v2.1.48] — 2026-07-03
- **Fix: migração para masmorras já presas em `completed:true`.** O fix da v2.1.45 impedia o problema em masmorras futuras, mas não limpava as que já tinham concluído (2/2) *antes* do deploy — como essas já estavam `completed`, `bumpDungeonProgress` nunca chamava `completeDungeon()` de novo, então o banner ficava preso pra sempre. Agora, ao carregar o save, qualquer `activeDungeon` já `completed` é zerado automaticamente (XP/ouro já haviam sido creditados, nada é perdido).

## [v2.1.47] — 2026-07-03
- **Simplifica o toggle de Atributos:** removido o ícone de olho separado (não estava funcionando/confundia). Agora o próprio botão "VER/OCULTAR ATRIBUTOS" (antigo "VER/OCULTAR GRÁFICO") esconde e mostra tudo junto — radar, as 3 barras, Sinergias Ativas e Rank Perks — em um clique só. Botão visível em desktop e mobile (antes só aparecia no mobile).

## [v2.1.46] — 2026-07-02
- **Novo ícone "Ocultar Atributos":** botão de olho ao lado de "VER GRÁFICO" que esconde/mostra de uma vez o hexágono, as 3 barras de atributo, as Sinergias Ativas e os Rank Perks. Estado persiste em `localStorage` (`lifeRPG_attrsCollapsed`), igual ao toggle do gráfico.

## [v2.1.45] — 2026-07-02
- **Fix: banner de Masmorra concluída não sumia.** `completeDungeon()` marcava `activeDungeon.completed = true` mas nunca zerava `gameState.activeDungeon`, e o `renderQuests()` só escondia o banner quando o campo era `null`/`undefined` — não checava `.completed`. Resultado: masmorra ficava "presa" na tela mesmo com progresso 100% até o próximo spawn sobrescrever o objeto. Agora `completeDungeon()` zera `gameState.activeDungeon` ao concluir, igual já acontecia na expiração.

## [v2.1.44] — 2026-07-02
- **Biblioteca de Hábitos oculta o que o usuário já tem:** ao abrir "Nova Quest", hábitos que já existem como missão ativa (diária, semanal ou side quest) somem da lista da Biblioteca, evitando duplicidade. Comparação por título (case-insensitive).

## [v2.1.43] — 2026-07-01
- **Removido o conceito de "hábitos por nível" (auto-unlock):** `ALL_HABITS_DATABASE` esvaziado e `syncQuestsByLevel()` vira no-op. A **Biblioteca passa a ser o catálogo único** — nada mais é adicionado automaticamente ao subir de nível. Seguro: não remove quests existentes; a notificação de level-up já era guardada por `length > 0`.
- **Biblioteca reordenada:** dentro de cada atributo, itens similares ficam adjacentes (ex.: os 3 treinos juntos; leitura/estudo juntos; carreira/networking juntos).

## [v2.1.42] — 2026-07-01
- **Enxugamento das atividades (menos clutter):**
  - **Biblioteca 63 → 50:** todos os títulos encurtados; removidos 13 itens redundantes/de nicho (Descompressão, Definir MIT, Planejar blocos, Pomodoro, Deep Work, Captura de ideias, Limpeza digital, Estudar conceito, Estudo aprofundado, Meal Prep, Provocação p/ time, e 2 das 3 meditações). Sobrou **1 meditação** ("Meditar").
  - **Movidos para Produtividade:** "Carreira dos liderados" e "Mensagem de networking" (antes em Social).
  - **Hábitos por nível 25 → 21:** títulos encurtados (sem o "(X min)"); removidas as 3 meditações e "Mensagem à família". (Apagar dessa lista é seguro — `syncQuestsByLevel` só preserva/adiciona, nunca remove quests já existentes.)

## [v2.1.41] — 2026-07-01
- **Fix · Desafio Semanal concluído continuava aparecendo:** o banner ficava visível (mostrando `6/6`) até a virada da semana. Agora **some assim que é concluído** (reaparece na segunda com o novo desafio). Enquanto em andamento, segue visível normalmente.
- **Fix · Masmorras antigas (pré-v2.1.40) mostravam "0/?":** as masmorras que já estavam ativas antes da reforma não tinham objetivo (`target`). Adicionado backfill no load — recebem alvo por nível e progresso 0, então concluem normalmente com hábitos da skill (sem o antigo botão "ATACAR BOSS", que não existe mais).

## [v2.1.40] — 2026-07-01
- **Masmorras reformuladas (estilo SAO) — mini-boss por skill:**
  - **Objetivo real:** cada masmorra agora pede *"conclua N hábitos de [Skill] em 48h"*, com barra de progresso `X/N`. Conclui **automaticamente** ao bater o alvo (concluindo hábitos da skill dela) — acabou a conclusão manual por clique (que causava conclusão acidental).
  - **Alvo escala por nível + raridade:** base por nível (1–9→2, 10–19→3, 20–29→4, 30+→5) **+** raridade sorteada (Comum +0 / Rara +1 / Épica +2). Recompensa continua × raridade (×1/×1.5/×2.5).
  - **Spawn agendado:** 1 masmorra garantida **todo sábado** + **30%/semana** de uma extra num dia entre seg–qui (com perdão: nasce no próximo acesso da semana se você não abrir no dia). Removido o spawn antigo (ao completar todas as dailies).
  - Mantém: gate de "1 skill em LV3+", prazo 48h e −100 XP se expirar. Boss de Rank segue sendo o ápice de cada tier.

## [v2.1.39] — 2026-06-30
- **Remoção da detecção de colisão entre atividades** (`addHabitFromLibrary`, `social.js`):
  - A regra por palavras-chave/ícones gerava muitos **falsos positivos** (ex.: "água" pegava banho gelado; "ler" pegava "ace**ler**ado"; "acordar" travava todo hábito matinal; "higienização" misturava bucal e skincare) e impedia o usuário de montar a rotina que quisesse.
  - Removida por inteiro — inclusive o bloqueio de título idêntico. Agora qualquer atividade pode ser adicionada livremente (inclusive duplicada). Verificado no preview: água + banho gelado, 2 meditações e item duplicado entram sem bloqueio.

## [v2.1.38] — 2026-06-30
- **Fix · Meditação e Yoga/Alongamento deixam de colidir na Biblioteca:**
  - A detecção de conflito (`addHabitFromLibrary`, `social.js`) compartilhava os ícones 🧘 / 🧘‍♂️ entre os grupos de *meditação* e *yoga/alongamento*; como vários itens cruzavam ícones, bloqueava adicionar uma quando já existia a outra. Removidos os ícones 🧘 dessas duas regras — o conflito passa a ser só por texto (são atividades distintas). Verificado: yoga coexiste com meditação; duplicata de meditação ainda é bloqueada.
- **UX · Títulos longos da Biblioteca encurtados:** 12 hábitos com nomes muito longos ganharam versões resumidas (ex.: "Passear com animal de estimação ou acompanhar parceiro em caminhada" → "Passear com pet ou parceiro"), preservando as palavras-chave usadas na detecção de conflito.

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
