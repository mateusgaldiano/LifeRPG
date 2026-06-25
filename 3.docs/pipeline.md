# LifeRPG OS — Pipeline de Pendências

> **Sincronizado automaticamente com `pipeline.html`.** Não editar à mão — editar o array `items` no HTML e ressincronizar.
> **Total: 20 itens pendentes.**

---

## 🔴 P0 — CRÍTICO (1)

### BUG-002 · Mensagens do chat global não aparecem ao enviar
**Cluster:** Bug Crítico | **Esforço:** S | **Tipo:** Bug | **Fase:** Agora

Usuário envia mensagem, ela não aparece no canal. Provável causa: falta de subscription ativa no canal Realtime ou RLS bloqueando SELECT na tabela de chat.

```
Ver 1.core/modules/social.js.
1. Abrir `1.core/modules/social.js` e localizar a função de envio de mensagem do chat global
2. Verificar se existe subscription ativa no canal Realtime de chat (procurar por `.channel(` ou `.on('postgres_changes'`)
3. Se subscription não existir: criar `supabase.channel('global-chat').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_chat' }, callback).subscribe()`
4. No Supabase Dashboard → Authentication → Policies: confirmar que a tabela `global_chat` tem RLS policy de SELECT para usuários autenticados
5. Adicionar policy se ausente: `CREATE POLICY "Authenticated users can read chat" ON global_chat FOR SELECT TO authenticated USING (true);`
6. Testar: enviar mensagem e confirmar que aparece sem refresh
7. Commit: "fix: subscription Realtime no chat global + RLS policy de SELECT"
```

## 🟡 P1 — ALTO (9)

### PWA-001 · iOS Safari: virtual keyboard empurra chat UI
**Cluster:** Mobile & PWA | **Esforço:** M | **Tipo:** Bug | **Fase:** Próximas semanas

```
Ver 1.core/modules/social.js, 1.core/styles.css.
1. Abrir styles.css e localizar .modal-box-social ou o container do chat global
2. Substituir height: 90dvh por height: calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))
3. No input do chat (.chat-input-row), adicionar padding-bottom: env(safe-area-inset-bottom)
4. Em social.js, adicionar listener para visualViewport resize:
   if (window.visualViewport) {
     window.visualViewport.addEventListener('resize', () => {
       const chatBox = document.querySelector('.social-modal-body');
       if (chatBox) chatBox.style.height = window.visualViewport.height * 0.75 + 'px';
     });
   }
5. Testar no iPhone via BrowserStack ou dispositivo real: abrir chat, focar no input, confirmar que campo de input não é coberto pelo teclado
6. Commit: "fix: ajustar height do chat modal para visualViewport no iOS Safari"
```

### PWA-003 · Sem feedback de estado offline
**Cluster:** Mobile & PWA | **Esforço:** M | **Tipo:** Bug | **Fase:** Próximas semanas

```
1. Adicionar div no index.html logo após a abertura do body: <div id="offline-banner" class="offline-banner" style="display:none">⚡ MODO OFFLINE — dados serão sincronizados ao reconectar</div>
2. Em styles.css, criar .offline-banner: position fixed, top 0, width 100%, background #ef4444, color #fff, text-align center, padding 6px, font-size 12px, z-index 9999, font-family var(--font-hud), letter-spacing 1px
3. Em pwa.js, adicionar:
   window.addEventListener('offline', () => document.getElementById('offline-banner').style.display = 'block');
   window.addEventListener('online', () => { document.getElementById('offline-banner').style.display = 'none'; saveToCloud(); });
4. Commit: "feat: banner de modo offline + trigger de sync ao reconectar"
```

### UX-002 · 3 colunas de quest muito estreitas em mobile
**Cluster:** UX/Visual | **Esforço:** M | **Tipo:** Enhancement | **Fase:** Próximas semanas

```
Ver 1.core/styles.css.
1. Abrir styles.css e localizar .quests-three-columns
2. Modificar para ser responsivo:
   @media (max-width: 640px) {
     .quests-three-columns {
       grid-template-columns: 1fr;
     }
     .quest-attr-column {
       display: none;
     }
     .quest-attr-column.active-mobile {
       display: block;
     }
   }
3. Em index.html, adicionar tabs de seleção de coluna para mobile (Vontade / Intelecto / Vitalidade) que aparecem apenas em mobile (display none em desktop)
4. Em ui.js, adicionar listener nos tabs mobile para alternar qual .quest-attr-column tem a classe active-mobile
5. Primeira coluna ativa por padrão no load mobile
6. Commit: "feat: layout responsivo de quests em mobile (1 coluna com tabs)"
```

### UX-004 · Level Up overlay não mostra o que desbloqueou
**Cluster:** UX/Visual | **Esforço:** M | **Tipo:** Enhancement | **Fase:** Próximas semanas

```
Ver 1.core/modules/ui.js, index.html.
1. Em ui.js, localizar a função triggerLevelUpOverlay
2. Após calcular o novo nível, buscar em ALL_HABITS_DATABASE os hábitos com minLevel === novoNivel
3. Buscar em BOSS_QUEST_BY_LEVEL se o novo nível ativa uma boss quest
4. Adicionar no overlay HTML (index.html) uma div #levelup-unlocks logo abaixo do .levelup-new-level
5. Injetar via JS: lista de novos hábitos + boss quest ativada (se houver) + próximo rank (se rank up)
6. Estilizar: fundo rgba(124,58,237,0.1), border roxa, padding 10px, font-size 12px
7. Commit: "feat: overlay de Level Up exibe hábitos desbloqueados e boss quest ativada"
```

### UX-006 · Weekly Report com texto pequeno em mobile
**Cluster:** UX/Visual | **Esforço:** S | **Tipo:** Enhancement | **Fase:** Próximas semanas

```
Ver 1.core/styles.css.
1. Abrir styles.css e localizar estilos do .weekly-report-modal-box
2. Garantir font-size mínimo de 11px em todos os elementos internos do modal
3. No grid de dias (Perfeitos/Bons/Falhados), alterar de 3 colunas para 2 colunas em mobile:
   @media (max-width: 480px) { .weekly-report-modal-box .report-days-grid { grid-template-columns: 1fr 1fr; } }
4. Aumentar padding interno de 8px para 12px nos .report-stat-card
5. Taxa de Sobrevivência: aumentar font-size de 38px para 34px em mobile para caber melhor
6. Commit: "fix: legibilidade do Weekly Report em mobile — font sizes e grid responsivo"
```

### SOCIAL-001 · Friends: busca por prefixo ao invés de username exato
**Cluster:** Social | **Esforço:** M | **Tipo:** Feature | **Fase:** Próximas semanas

```
Ver 1.core/modules/social.js.
1. Em social.js, localizar a função de busca de amigos (provavelmente triggerFriendSearch ou similar)
2. Substituir query de busca exata por ILIKE:
   .from('persons').select('id, username, level, rank').ilike('username', `%${searchTerm}%`).limit(5)
3. Exibir resultados como lista de 5 cards com: avatar placeholder, username, nível e botão "ADICIONAR"
4. Commit: "feat: busca de amigos por prefixo (ILIKE) ao invés de username exato"
```

### SOCIAL-002 · Sem botão de desafio PvP no modal de perfil
**Cluster:** Social | **Esforço:** S | **Tipo:** Feature | **Fase:** Próximas semanas

```
1. Em index.html, localizar o modal #modal-player-profile
2. Adicionar antes do botão de amizade existente:
   <button id="btn-profile-pvp-challenge" class="btn-submit" style="width:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);color:#000;margin-bottom:8px;">⚔️ DESAFIAR PARA DUELO</button>
3. Em social.js, ao abrir o modal de perfil de outro jogador, salvar o ID do jogador em window._profileViewTarget
4. Adicionar listener no btn-profile-pvp-challenge: ao clicar, pré-preencher o modal #modal-pvp-challenge com window._profileViewTarget e abrir
5. Commit: "feat: botão de desafio PvP direto do modal de perfil do jogador"
```

### MKT-002 · "Streak em risco" push notification às 22h
**Cluster:** Marketing | **Esforço:** M | **Tipo:** Feature | **Fase:** Próximas semanas

```
1. Criar Supabase Edge Function `send-streak-reminder` que:
   - Busca todos os users com push_subscription ativo que NÃO completaram nenhuma daily hoje
   - Envia push notification com payload: { title: '⚠️ LifeRPG — Streak em Risco', body: 'Seu streak de X dias não sobrevive à meia-noite sem uma missão.' }
2. No pg_cron, agendar: SELECT cron.schedule('streak-reminder', '0 22 * * *', $SELECT net.http_post(url := current_setting('app.edge_functions_url') || '/send-streak-reminder', headers := '{"Authorization": "Bearer " || current_setting("app.service_role_key")}')$);
3. Em pwa.js, garantir que push_subscription do usuário é salvo em uma tabela `push_subscriptions` ao se inscrever
4. Commit: "feat: push notification de streak em risco às 22h via Edge Function + pg_cron"
```

### META-001 · Novos achievements — expandir catálogo
**Cluster:** Meta-Progressão | **Esforço:** M | **Tipo:** Feature | **Fase:** Próximas semanas

```
Ver 1.core/modules/game-logic.js.
1. Em game-logic.js, localizar o array ACHIEVEMENTS_DEFS
2. Adicionar os seguintes achievements ao array:
   { id: 'quests_5_day', title: 'Dia Lendário', desc: 'Complete 5 missões em um único dia', icon: '🔥', rewardGold: 30, rarity: 'raro', check: (gs) => (gs._maxDailyCompleted || 0) >= 5, progress: (gs) => ({ cur: Math.min(gs._maxDailyCompleted || 0, 5), max: 5 }) },
   { id: 'quests_50_total', title: 'Veterano', desc: 'Complete 50 missões no total', icon: '⚔️', rewardGold: 80, rarity: 'raro', check: (gs) => (gs._totalQuestsCompleted || 0) >= 50, progress: (gs) => ({ cur: Math.min(gs._totalQuestsCompleted || 0, 50), max: 50 }) },
   { id: 'quests_100_total', title: 'Lenda', desc: 'Complete 100 missões no total', icon: '👑', rewardGold: 200, rarity: 'lendário', check: (gs) => (gs._totalQuestsCompleted || 0) >= 100, progress: (gs) => ({ cur: Math.min(gs._totalQuestsCompleted || 0, 100), max: 100 }) },
   { id: 'pvp_first_win', title: 'Gladiador', desc: 'Vença seu primeiro duelo PvP', icon: '🏆', rewardGold: 100, rarity: 'raro', check: (gs) => (gs._pvpWins || 0) >= 1, progress: (gs) => ({ cur: Math.min(gs._pvpWins || 0, 1), max: 1 }) },
   { id: 'friends_3', title: 'Aliança', desc: 'Tenha 3 amigos no sistema', icon: '🤝', rewardGold: 50, rarity: 'incomum', check: (gs) => (gs._friendsCount || 0) >= 3, progress: (gs) => ({ cur: Math.min(gs._friendsCount || 0, 3), max: 3 }) }
3. Em toggleQuest, incrementar gs._totalQuestsCompleted++ ao completar qualquer quest
4. Commit: "feat: 5 novos achievements — Dia Lendário, Veterano, Lenda, Gladiador, Aliança"
```

## 🟣 P2 — MÉDIO (3)

### GAME-004 · Comeback mechanic para usuários que voltam após 7+ dias
**Cluster:** Game Design | **Esforço:** M | **Tipo:** Feature | **Fase:** Próximas semanas

```
1. Em state.js ou app.js, no boot do app, calcular dias desde last_active
2. Se days_absent >= 7: ativar flag gameState._comebackMode = true por 3 dias
3. Em game-logic.js, em addRewards(): se _comebackMode === true, multiplicar XP por 1.5
4. Mensagem especial do Iroh ao detectar retorno longo
5. Commit: "feat: Modo Retorno — 1.5x XP por 3 dias após ausência de 7+ dias"
```

### GAME-005 · Dungeon pool: expandir para 20+ missões com raridade
**Cluster:** Meta-Progressão | **Esforço:** M | **Tipo:** Feature | **Fase:** Próximas semanas

```
Ver 1.core/modules/state.js.
1. Em state.js, localizar DUNGEON_POOL
2. Expandir para pelo menos 20 entradas cobrindo todos os 6 skills
3. Adicionar campo rarity: 'comum' | 'raro' | 'épico' com multiplicadores de recompensa 1x / 1.5x / 2.5x
4. Épico: chance de 10%, Raro: 25%, Comum: 65%
5. Em game-logic.js, spawnDungeon(): usar Math.random() para determinar raridade e aplicar multiplicador de recompensa
6. Commit: "feat: expandir dungeon pool para 20+ missões com sistema de raridade"
```

### MKT-003 · Weekly Report: botão de compartilhar
**Cluster:** Marketing | **Esforço:** M | **Tipo:** Feature | **Fase:** Próximas semanas

```
Ver 1.core/modules/weekly-report.js, index.html.
1. Em index.html, adicionar botão no modal-weekly-report: <button id="btn-share-report" class="btn-submit btn-secondary" style="width:100%;margin-top:8px;">📤 COMPARTILHAR RELATÓRIO</button>
2. Em weekly-report.js, no listener do btn-share-report:
   - Usar html2canvas (importar do CDN) para capturar o modal como imagem
   - Se Web Share API disponível: navigator.share({ files: [imageFile], title: 'Meu Relatório LifeRPG' })
   - Fallback: download direto da imagem
3. Commit: "feat: botão de compartilhar relatório semanal como imagem"
```

## ⚪ P3 — FUTURO (7)

### ENG-003 · styles.css: PurgeCSS e minificação para produção
**Cluster:** Engenharia | **Esforço:** M | **Tipo:** Tech Debt | **Fase:** Futuro

```
1. Configurar build script com PurgeCSS: npx purgecss --css 1.core/styles.css --content index.html 1.core/**/*.js --output 1.core/styles.min.css
2. Atualizar link no index.html para styles.min.css em produção
3. Target: reduzir de 110KB para < 40KB gzipped
4. Commit: "perf: PurgeCSS no pipeline de produção — remover CSS não utilizado"
```

### GAME-007 · Prestige system após Rank S (nível 30)
**Cluster:** Meta-Progressão | **Esforço:** L | **Tipo:** Feature | **Fase:** Futuro

```
1. Definir mecânica: ao atingir nível 30, opção de "Ascender" — reseta XP para 0 mas mantém hábitos e conquistas
2. Adicionar campo gameState.prestige_level (inicia em 0)
3. Benefício do prestige: +5% multiplicador permanente de XP por nível de prestige (max 3)
4. Avatar especial dourado para prestige 1+ com borda especial automática
5. Commit: "feat: Prestige system — progressão além do Rank S"
```

### FEAT-001 · Aba MENTOR (Tio Iroh IA via Claude API) — desabilitar display:none
**Cluster:** Meta-Progressão | **Esforço:** XL | **Tipo:** Feature | **Fase:** Futuro

```
1. Criar Supabase Edge Function `mentor-chat` que recebe { message, gameState_summary } e chama Claude API
2. System prompt: persona do Tio Iroh com contexto do gameState do jogador (nível, streak, skills, missão atual)
3. Em index.html: remover style="display:none" da <section id="tab-chat">
4. Adicionar botão da aba Mentor na nav: <button class="tab-link" data-tab="chat">🎓 MENTOR</button>
5. Em ui.js, criar função sendMentorMessage() que chama a Edge Function e renderiza resposta
6. Commit: "feat: ativar aba Mentor — Tio Iroh IA contextualizado com gameState do jogador"
```

### FEAT-002 · Sistema de missões semanais
**Cluster:** Game Design | **Esforço:** L | **Tipo:** Feature | **Fase:** Futuro

```
1. Criar tabela weekly_challenges (id, title, description, target_count, skill, xp_reward, gold_reward, week_number, year)
2. Implementar lógica de contagem semanal separada do streak diário
3. UI: banner na aba Missões mostrando desafio semanal atual com barra de progresso
4. Resetar contagem toda segunda-feira às 00h via pg_cron
5. Commit: "feat: sistema de Desafios Semanais com recompensas de XP e Gold"
```

### FEAT-003 · Landing page pública com CTA de instalação
**Cluster:** Marketing | **Esforço:** L | **Tipo:** Feature | **Fase:** Futuro

```
1. Criar arquivo landing.html na raiz do repo (ou subdomínio separado)
2. Conteúdo: headline, 3 benefícios principais, screenshots do app, botão "INSTALAR O SISTEMA"
3. Estética: manter visual Solo Leveling — fundo escuro, neon purple/cyan, fonte Orbitron
4. Adicionar og:image e twitter:card próprios da landing
5. Commit: "feat: landing page pública com CTA de instalação do PWA"
```

### FEAT-004 · Sistema de convite com link único
**Cluster:** Marketing | **Esforço:** M | **Tipo:** Feature | **Fase:** Futuro

```
1. Criar tabela invite_codes (code text PK, created_by uuid, used_by uuid, created_at, used_at)
2. Gerar código único ao usuário se inscrever (8 chars alfanumérico)
3. URL de convite: https://mateusgaldiano.github.io/LifeRPG/?invite=CODE
4. Ao novo usuário completar onboarding com invite code: +50 Gold para quem convidou, +30 Gold para o novo
5. Achievement "Recrutador" ao convidar 3 amigos
6. Commit: "feat: sistema de convite com link único e recompensas bilaterais"
```

### FEAT-005 · Roadmap gamificado dentro do app ("NEXUS")
**Cluster:** Meta-Progressão | **Esforço:** S | **Tipo:** Feature | **Fase:** Futuro

```
1. Criar modal #modal-roadmap com título "NEXUS — Missões do Sistema"
2. Listar features futuras como "missões bloqueadas": Clãs, Chat Privado, Mentor IA, Desafios Semanais
3. Cada item com status: EM DESENVOLVIMENTO / EM TESTES / EM BREVE
4. Adicionar botão de acesso no header ou sidebar
5. Commit: "feat: modal de roadmap gamificado — 'NEXUS — Missões do Sistema'"
```
