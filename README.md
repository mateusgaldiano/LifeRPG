# LifeRPG OS v2.5 ⚔️ — README para IAs

> Este README foi escrito para ser lido por IAs assistentes (Claude, Gemini, GPT, etc.) que irão ajudar no desenvolvimento. Leia tudo antes de sugerir qualquer alteração.

---

## O que é o projeto

**LifeRPG OS v2.5** é um app web de gamificação de hábitos pessoais — um "painel de alta performance" estilo RPG (inspirado em Solo Leveling / Arise — Level Up In Real Life). É uma **Single Page App (SPA) em HTML + CSS + JS puro**, sem frameworks, instalável como **PWA** no celular.

**Identidade visual:** Dark premium — fundo Obsidian Black (`#08090d`), neon Ciano Glacial (`#00f2fe` / `#00f0ff`), Ouro Escovado (`#fbbf24`), Esmeralda (`#10b981`). Glassmorphism, fonte **JetBrains Mono** + **Plus Jakarta Sans**. Efeitos hexagonais via `clip-path`.

---

## Estrutura de arquivos

```
/liferpg
├── index.html          # Estrutura HTML completa da UI (sidebar + main + modais + overlays)
├── app.js              # TODA a lógica do jogo — ver detalhes abaixo
├── styles.css          # Folha de estilos completa
├── sw.js               # Service Worker (cache offline + notificações agendadas)
├── manifest.json       # Configuração PWA
├── avatars/            # Imagens de avatar por rank: 1.rank-e.png a 6.rank-s.png
├── icons/              # Ícones PWA (192px e 512px)
└── README.md           # Este arquivo
```

---

## Estrutura do app.js (funções principais)

```
CONSTANTES GLOBAIS
  ALL_HABITS_DATABASE    → banco de hábitos com minLevel (1, 5, 10)
  IMPACT_QUOTES          → frases motivacionais de impacto (Goggins, Kobe, Madara, etc.)
  RANK_THRESHOLDS        → mapeamento level → rank (E/D/C/B/A/S)

ESTADO GLOBAL
  gameState              → objeto principal (ver schema abaixo)

RADAR CHART
  drawRadarChart()       → desenha hexágono no Canvas (declarada no topo para escopo global)
  window.drawRadarChart  → exportada explicitamente para acesso global

INICIALIZAÇÃO
  DOMContentLoaded       → loadGameData → syncQuestsByLevel → updateUI → setTimeout(drawRadarChart, 150)

UI RENDERERS
  updateUI()             → atualiza level, XP, gold, streak, rank badge, 3 barras de atributo, avatar, radar
  renderSkills()         → initSkillsState() + drawRadarChart()
  renderQuests()         → renderiza daily e side quests
  renderRewards()        → renderiza a Taverna

NOTIFICAÇÕES & IMPACTO
  showSystemToast(text)  → toast notification que aparece e some em 3s
  showImpactQuote()      → pop-up modal com frase motivacional (1ª quest + última quest do dia)

MECÂNICAS DO JOGO
  toggleQuest(id)        → completa/desmarca quest + XP/gold/skill
  adjustWater(id, op)    → controla copos de água
  addRewards(xp, gold)   → soma XP/gold + trigger levelUp se necessário
  addSkillXP(type)       → incrementa skill, verifica level up do atributo
  deductSkillXP(type)    → decrementa skill ao desmarcar quest
  syncQuestsByLevel()    → filtra ALL_HABITS_DATABASE pelo nível atual
  applyDailyPenalty()    → penalidade escalonada por dias de falha consecutiva
  checkAllDailies()      → verifica se completou tudo no dia, incrementa streak

PERSISTÊNCIA
  saveGameData()         → localStorage.setItem('lifeRPG_gameState_Mateus', JSON.stringify(gameState))
  loadGameData()         → carrega save, verifica reset diário, aplica penalidade se necessário

PWA & SETTINGS
  registerServiceWorker()
  setupSettingsListeners()  → notificações, export/import JSON
  setupInstallPrompt()      → banner de instalação (Android/iOS)
```

---

## Schema do gameState

```javascript
let gameState = {
  level: 1,
  xp: 0,
  xpToNext: 100,        // escala x1.3 a cada level up
  gold: 15,
  streak: 0,
  shields: 0,            // escudos ativos (0-3)
  consecutiveStreak7Days: 0,
  consecutiveMisses: 0,
  bossQuest: null,
  activeDungeon: null,
  lastCheckedDate: '',
  unlockedAchievements: [],
  lastQuoteDate: null,   // controle para impact quotes (1ª quest + última)
  quests: [],
  sideQuests: [],
  rewards: [...],
  skills: {
    physical:     { level: 1, xp: 0, xpToNext: 5 },
    mental:       { level: 1, xp: 0, xpToNext: 5 },
    productivity: { level: 1, xp: 0, xpToNext: 5 },
    social:       { level: 1, xp: 0, xpToNext: 5 },
    wisdom:       { level: 1, xp: 0, xpToNext: 5 },
    routine:      { level: 1, xp: 0, xpToNext: 5 }
  },
  messages: []
};
```

**Chave no localStorage:** `lifeRPG_gameState_Mateus`

---

## Mecânicas principais

### Evolução de personagem
- **Nível geral (Overall Level):** sobe com XP de qualquer quest. XP escala x1.3 por nível.
- **Ranks (Solo Leveling):** E (LV1-4) → D (LV5-9) → C (LV10-14) → B (LV15-19) → A (LV20-29) → S (LV30+). Cada rank muda o avatar.
- **Skills (6 atributos):** physical, mental, productivity, social, wisdom, routine.
- **3 Atributos Arise:** Willpower, Intellect, Health (calculados em `computeAttributes()`).
- **Títulos Dinâmicos:** baseados na dominância das skills (ex: Monge, Guerreiro, Estrategista).

### Sistema de Penalidade (Escalonado)
- 1 dia: -5% XP, sem zerar streak
- 2 dias: -15% XP, streak zerada
- 3 dias: -25% XP, regressão de skills
- 5+ dias: -40% XP, debuff 48h, regressão

### Dungeons, Boss Quests, Achievements, Sinergias
- Dungeons com prazo de 48h, Boss Quests por rank up, 8 troféus automáticos, bônus de sinergias.

### Impact Quotes (Frases de Impacto)
- Pop-up modal com frases de Goggins, Kobe, Madara, Tyrion, Rock Lee, Seneca, etc.
- Disparadas: 1ª quest do dia + última quest do dia.

### PWA & Backup
- Service Worker cache-first, notificações locais, instalável Android/iOS.
- Export/Import JSON completo.

---

## ✅ Pendências & Backlog — FASE 2

### 🔴 P0 — Bloqueador (Necessário para compartilhar com amigos)
- [ ] **Onboarding Personalizado** — Tela de primeiro login ("Qual seu nome, guerreiro?") para substituir o nome "Mateus" hardcoded. O nome deve ser salvo no `gameState.playerName` e usado dinamicamente em toda a interface.
- [ ] **Wizard de Configuração (3 telas)** — Após o nome: objetivo principal (Saúde / Produtividade / Equilíbrio / Tudo) + comprometimento diário (30min / 1h / 2h+). Permite personalizar quests por perfil.

### 🟡 P1 — Alto Impacto
- [ ] **Calendário de Consistência (Heatmap)** — Grid visual dos últimos 90 dias (verde = completou, vermelho = falhou, cinza = sem dados). Inspirado no GitHub Contributions. Torna a streak visualmente poderosa.
- [ ] **Notificações Push Reais (Firebase Cloud Messaging)** — Push notifications que chegam mesmo com celular bloqueado. Substitui o sistema atual de setTimeout no Service Worker.
- [ ] **Relatório Semanal de Performance** — Resumo automático todo domingo: dailies completadas, skill que mais evoluiu, streak atual vs recorde, posição no ranking.

### 🟠 P2 — Game Changers
- [ ] **Ranking Global entre Amigos (Leaderboard)** — Ranking via Firebase Realtime Database mostrando Nível, Streak e Rank de cada jogador. Gera accountability social.
- [ ] **Duelos PvP entre Amigos** — Desafiar um amigo para duelo de 7 dias. Quem completar mais dailies vence. Perdedor perde Ouro, vencedor ganha título "Campeão da Semana".
- [ ] **Persistência na Nuvem (Firebase Firestore)** — Migrar dados do localStorage para Firestore com autenticação simplificada. Elimina risco de perda de dados ao limpar cache.

### 🟢 P3 — Polish & Premium
- [ ] **Personalização de Avatar / Skins** — Skins desbloqueáveis compráveis com Ouro na Taverna. Armaduras visuais por Rank. Aura flamejante no Rank S.
- [ ] **Dark/Light Mode + Temas** — Opção de tema claro. Temas temáticos: "Solo Leveling", "Estoico", "Samurai", "Cyberpunk".
- [ ] **Chat com IA Real** — Substituir mensagens pré-configuradas por chamadas a um LLM via backend Node.js.

---

## Bugs resolvidos (contexto histórico)

| Bug | Causa | Solução |
|-----|-------|---------|
| Radar Canvas em branco | `display: inline` sobrescrevia CSS; raio mínimo ~8px | Forçar `display: block` no JS; raio mínimo 35% |
| Scroll travado no mobile | `overflow: hidden` no `body` | Media queries com `overflow: visible` |
| Avatar não carregava | Esperava `rank-e.png`, arquivos são `1.rank-e.png` | Mapeamento com prefixo numérico |
| Tela cortada no mobile | 4 abas não cabiam em telas < 360px | Nav com scroll horizontal + `max-width: 100vw` |
| App não atualizava no celular | SW cacheava versão antiga | Bump `CACHE_NAME` no sw.js |
| JS crashava após remoção do chat | Referências fantasma a `IROH_RESPONSES`, `renderChat`, `showChatBadge` | Substituição por `showSystemToast` e remoção de código morto |

---

## Decisões técnicas importantes

- **Sem frameworks:** HTML + CSS + JS puro. Zero dependências.
- **Canvas vs SVG:** Canvas para o radar chart (mais controle de animação futura).
- **CSS variables no Canvas:** NÃO funcionam. Usar hex literals (`#00f0ff`).
- **`drawRadarChart` no topo do app.js:** escopo global garantido.
- **gameState é var global (`let`):** acessível em todas as funções.
- **Impact Quotes substituem Chat:** O chat do Iroh foi removido na v2.5. Mensagens de sistema viraram Toasts (3s). Frases motivacionais são Pop-ups modais (1-2x por dia).
