# Pendências — LifeRPG OS v2.0

Esta lista consolida as pendências e bugs mapeados para desenvolvimento no LifeRPG OS v2.0.

---

## PENDÊNCIAS — LifeRPG OS v2.0

### 🔴 CRÍTICO (bugs ativos)

**1. Header fixo no mobile**
`.brand-header` nunca ficou fixo de forma confiável porque `position: sticky` depende de uma cadeia de `overflow` nos ancestrais que quebra toda vez que outro elemento é modificado. Solução definitiva: trocar para `position: fixed` com `padding-top` compensatório no `#sidebar-panel`.

**2. Sinergia "Vontade de Ferro" com ícone corrompido**
`icon: '=%'` na primeira entrada de `SYNERGY_DEFS` — emoji quebrou durante alguma edição. Corrigir para `icon: '⚡'` ou similar.

---

### 🟠 FEATURES ESPECIFICADAS MAS NÃO IMPLEMENTADAS

**3. Biblioteca de Hábitos no modal Nova Quest**
Foi totalmente especificada (30 hábitos curados, abas CRIAR/BIBLIOTECA, busca, filtros por skill, mini-modal de confirmação) mas nunca foi para o código. O `HABIT_LIBRARY` não existe no `app.js` atual.

**4. Loja de Skins na Taverna**
Código parcial existe (`buySkin`, `unlockedSkins`, 3 avatares gerados por IA salvos em `/avatars`), mas a UI da Taverna não exibe nenhuma seção de skins. O jogador não tem como comprar ou equipar os avatares premium.

---

### 🟡 MELHORIAS DE ENGAJAMENTO

**5. Streak multiplier imperceptível**
Fórmula atual: `1 + streak * 0.005`. Com 7 dias o bônus é 3,5% — invisível e não motivador. Trocar por escada visível com badge animado no chip de streak:
- 3 dias = +10% XP
- 7 dias = +20% XP + Gold bônus
- 14 dias = +35% XP
- 30 dias = +50% XP + título especial

**6. Achievements sem feedback visual**
`ACHIEVEMENTS_DEFS` e `checkAchievements` existem, mas o desbloqueio não tem overlay/toast comemorativo. O jogador conquista coisas sem saber. Criar um mini overlay "CONQUISTA DESBLOQUEADA" com ícone e título, igual ao Quest Cleared, que aparece no momento do unlock.

**7. Loop de retenção D1→D2 vazio**
Após o onboarding e a "Primeira Missão", o sistema some. Não há segundo toque do Sistema reconhecendo que o usuário voltou no dia seguinte, nem mensagem de acompanhamento. Implementar: ao abrir o app no segundo dia com pelo menos 1 missão concluída no dia anterior, exibir um toast especial de boas-vindas com reconhecimento do progresso de ontem.

**8. Penalidade sem feedback de atributo**
A penalidade desconta XP mas não mostra qual skill foi afetada. Se o usuário não treinou, o Físico deveria piscar `-1` no radar. Conectar a causa à consequência torna a mecânica educativa em vez de só punitiva.

**9. Visão Global — estado vazio sem contexto**
Com histórico vazio (usuário novo), todas as métricas mostram zero sem explicação. Adicionar estado vazio desenhado: texto motivacional + instrução ("Complete missões para ver seu histórico aqui") que some automaticamente após o primeiro dia com dados.

**10. Sem onboarding para features desbloqueadas**
Quando o usuário chega no Nível 5 e a Taverna fica disponível, não há explicação. Quando o Boss Quest aparece, o toast some in 3s. Implementar um sistema de "primeira vez": um pequeno modal explicativo que aparece uma única vez quando uma feature importante é desbloqueada pela primeira vez (`localStorage` flag por feature).

---

### 🔵 FEATURES NOVAS (backlog)

**11. Chat com IA real (Claude)**
O chat do Iroh foi removido. Reintroduzir como assistente com IA real: um `fetch` para a API do Claude com system prompt que conhece o `gameState` do jogador (nível, streak, missões do dia, skills). O mentor responde com personalidade, contextualizado com o progresso real do usuário.

**12. Missões de Elite por skill**
Quando uma skill atinge LV3+, uma side quest exclusiva aparece automaticamente associada àquele atributo com XP/Gold maior e um badge especial. Cria um incentivo direto para especializar skills.

**13. Sistema de "primeira vez" por feature**
Ver item 10 — mas expandido para todas as features principais: primeira Boss Quest, primeiro Weekly Boss, primeira Dungeon, primeira conquista. Cada uma com um mini modal de contexto na primeira aparição.
