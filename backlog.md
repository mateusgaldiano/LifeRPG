# Backlog de Pendências — LifeRPG OS v2.5 ⚔️

Esta lista consolida o status atualizado de todas as pendências, bugs e melhorias planejadas para o LifeRPG OS.

---

## 📋 Tabela de Pendências Abertas

| Feature / Item | Severidade | Esforço | Cluster / Área | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Criar Projeto Firebase e Adicionar Chaves** | 🔴 Crítico | Pequeno (Ação Usuário) | Infraestrutura / Cloud | Depende do Usuário |
| **Push Notifications Reais (OS/Web Push)** | 🟡 Médio | Médio / Alto | PWA / Local | Aberto |
| **Ranking Global entre Amigos** | 🟡 Médio | Alto | Social / Multiplayer | Bloqueado por Cloud DB |
| **Duelos PvP Assíncronos** | 🟢 Baixo | Alto | Social / Multiplayer | Bloqueado por Cloud DB |

---

## ✅ Histórico de Itens Resolvidos

### Correções de Bugs & Ajustes
- [x] **Bug: Dungeon ativa + "NENHUMA MISSÃO ATIVA"** — Corrigida a renderização do contêiner para considerar se a dungeon ativa está incompleta.
- [x] **Títulos do Avatar Zoom desalinhados com Ranks** — Alinhamento dinâmico baseado na função `getRankForLevel()` e dicionário `titleMap`.
- [x] **Perks e Sinergias sem separação visual** — Inclusão de cabeçalhos e bordas neon separadoras nos contêineres de HUD.
- [x] **Sinergia Vontade de Ferro** — Emoji quebrado corrigido de `=%` para `⚡`.

### PWA & UX (Mobile)
- [x] **Header fixo no mobile** — Corrigido com `position: fixed` e body scroll.
- [x] **Streak overflow no HUD mobile** — Compactação de elementos e `white-space: nowrap`.
- [x] **Auditoria Visual de Viewport** — Ajustes finos de margins, canvas e layouts mobile de 375px a 430px.

### Mecânicas de Jogo (GDD)
- [x] **Curva de XP de Skill** — Nova fórmula progressiva e ganho escalonado.
- [x] **Títulos de Rank dinâmicos** — Nome de rank e títulos (Monge-Atleta, Aprendiz Desperto, etc.).
- [x] **Sinergias de Atributos** — Willpower, Intellect, Health com buffs reais.
- [x] **Rank Perks** — Foco Matinal, Mente de Diamante, Momentum, O Sistema, Lenda Imortal.
- [x] **Boss Quests de Rank Up** — Bloqueio de rank e progressos em side quests especiais.
- [x] **Dungeons (Missões de Elite)** — Trigger automático ao nível 3 de skill, prazos e recompensas em dobro.
- [x] **Penalidade com Profundidade** — Missão de Resgate de 4h, escalonamento e debuffs.

### Engajamento & Feedback Visual
- [x] **Relatório Semanal de Performance** — Exibição do modal de resumo semanal de XP, progresso e taxa de conclusão às segundas-feiras.
- [x] **Multiplicadores & Tiers de Streak** — Escalabilidade de bônus (+10% a +50% XP/Gold) e chips primitivos convertidos em chips pulsantes (bronze, prata, ouro, neon-ciano).
- [x] **Overlay Comemorativo de Conquistas** — Feedback visual ao vivo no momento de desbloquear troféus.
- [x] **Aba de Troféus (Troféus/Glyphs)** — Correção completa de caracteres UTF-8 corrompidos e adição de ícone `🔒` de cadeado para itens bloqueados.
- [x] **Loop de Retenção D1 ➔ D2** — Boas-vindas personalizadas ao retornar no segundo dia com progresso prévio.
- [x] **Feedback Visual de Penalidade** — Atributos piscam em vermelho translúcido ao sofrer regressão.
- [x] **Empty State na Visão Global** — Dashboard amigável e motivador para novos usuários.
- [x] **Onboarding de Features Desbloqueadas** — Modais explicativos automáticos ao liberar Taverna (Nível 5) e Dungeons (Nível 10).

### Novas Features & IA
- [x] **Biblioteca de Hábitos** — Alinhamento de 30 hábitos prontos com abas Criação/Biblioteca, filtros de skill, busca ao vivo e modal de confirmação.
- [x] **Chat com Mentor IA (Claude)** — Chat interativo com o Tio Iroh (Avatar) alimentado pelo estado real do jogador no RPG, API Key e CORS Proxy customizável.
- [x] **Loja de Skins e Equipamentos na Taverna** — Skins premium (Mestre das Sombras, Monarca da Névoa, Imperador Arise) adicionadas à loja da Taverna e equipáveis pelo painel de Zoom.
