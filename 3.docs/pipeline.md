# LifeRPG OS — Pipeline de Entregas

> **Sincronizado com `pipeline.html`.** Não editar à mão — editar o array `items` no HTML e ressincronizar.
> **Atualizado em 01/09/2026 (v2.5.71) — pós-minimalização.** Total: 13 itens pendentes.
>
> Contexto: o app passou por uma grande minimalização (v2.5.53–v2.5.71). Foram **removidos** Taverna, Ouro, PvP (Duelos), Masmorras, Conquistas, Desafio Semanal e o tutorial in-game. Foram **mantidos** o Chefe da Semana e a nova espinha dorsal: Caminho escuro + Estrela do Dia + 3 provas (Corpo/Mente/Mundo) + trilha + Ofensiva (streak). A tese de produto é o **Efeito Duolingo = granularidade** (não social).

---

## 🔴 P0 — CRÍTICO (0)

*Nenhum item P0 pendente.*

## 🟠 P1 — ALTO (2)

### JUICE-001 · Háptica + micro-sons no loop diário  · **⭐ próxima entrega recomendada**
**Cluster:** UX / Visual | **Esforço:** M | **Tipo:** Feature | **Fase:** Agora

```
Sem assets (respeita "sem build"): sons via WebAudio (synth curto) + tátil via navigator.vibrate.
Gatilhos: concluir hábito, encher segmento de prova (Corpo/Mente/Mundo), fechar a Estrela do Dia, ganhar escudo, rank-up.
Toggle liga/desliga nas Configurações (default ON), persistido no gameState.
Capacitor Android: navigator.vibrate roda no WebView — validar no device.
Commit: "feat: juice — háptica + micro-sons no loop diário"
```

### GRAN-001 · Passos-por-hábito na trilha
**Cluster:** Game Design | **Esforço:** L | **Tipo:** Feature | **Fase:** Próximas semanas

```
O núcleo da tese: o gap é GRANULARIDADE, não social.
Permitir subdividir um hábito em micro-passos (ex.: "3 séries") que enchem o nó gradualmente ao longo do dia
— resolvendo o "não posso correr 10x no mesmo dia".
Ver caminho.js buildNodes/buildProvas e o modelo de conclusão (count/total >= 0.70).
Commit: "feat: passos-por-hábito na trilha do Caminho"
```

## 🟡 P2 — MÉDIO (5)

### JUICE-002 · Overlay de celebração de milestone de ofensiva
**Cluster:** UX / Visual | **Esforço:** M | **Tipo:** Feature | **Fase:** Próximas semanas

```
Ao cruzar 7 / 30 / 100 / 365 dias, overlay curto (chama grande + número + selo do marco).
Ver ui.js STREAK_MILESTONES e renderStreakModal. Sem libs — CSS + canvas leve; respeitar prefers-reduced-motion.
Commit: "feat: celebração de milestone de ofensiva"
```

### RET-001 · Modo Retorno (comeback pós-ausência 7+ dias)
**Cluster:** Game Design | **Esforço:** M | **Tipo:** Feature | **Fase:** Próximas semanas

```
No boot (app.js/state.js), calcular dias desde last_active.
Se >= 7: gameState._comebackMode = true por 3 dias; em addRewards() multiplicar XP por 1.5 enquanto ativo.
Mensagem especial do Sistema ao detectar o retorno (a voz do próprio app, não personagem externo).
Commit: "feat: Modo Retorno — 1.5x XP por 3 dias após ausência de 7+ dias"
```

### ENG-004 · Faxina de código morto das features removidas
**Cluster:** Engenharia | **Esforço:** M | **Tipo:** Tech Debt | **Fase:** Próximas semanas

```
Remover funções órfãs e DOM residual das features desligadas (Taverna/Ouro/PvP/Masmorras/Conquistas/Desafios/Tutorial),
deixadas guardadas/no-op durante a minimalização.
⚠️ MANTER a coluna `gold` DORMANTE no DB (não remover — quebraria o sync). Só remover o código de app.
node --check em cada módulo ES antes do commit.
Commit: "chore: faxina de código morto das features removidas"
```

### ONB-001 · Polir onboarding (copy, progresso, tom escuro)
**Cluster:** Onboarding | **Esforço:** M | **Tipo:** Enhancement | **Fase:** Próximas semanas

```
Barra de progresso de passos, copy mais curta/direta, visual alinhado ao tom escuro do Caminho.
Ver app.js decideOnboarding (fluxo já corrigido — falta o polish visual).
Commit: "feat: polish do onboarding"
```

### MKT-003 · Weekly Report: botão de compartilhar
**Cluster:** Marketing | **Esforço:** M | **Tipo:** Feature | **Fase:** Futuro

```
Ver 1.core/modules/weekly-report.js, index.html.
1. Botão no modal-weekly-report.
2. Capturar o modal como imagem (canvas nativo — evitar CDN por causa do "sem build").
3. Web Share API se disponível (navigator.share com files); fallback: download da imagem.
Commit: "feat: botão de compartilhar relatório semanal como imagem"
```

---

## 🔵 P3 — BAIXO (6)

### SYS-001 · Dar "rosto"/reações ao Sistema
**Cluster:** UX / Visual | **Esforço:** L | **Tipo:** Feature | **Fase:** Futuro

```
Mensagens contextuais do Sistema: abrir o app, concluir uma prova, fechar a estrela, quebrar/salvar streak, rank-up.
Tom de voz único (o "Sistema" do Solo Leveling), curto e impactante. Pool de linhas + gatilhos.
Commit: "feat: reações do Sistema"
```

### JUICE-003 · Cutscene de rank-up
**Cluster:** UX / Visual | **Esforço:** M | **Tipo:** Feature | **Fase:** Futuro

```
Momento orquestrado ao trocar de rank (E→D→...→S): novo avatar entra, selo do rank, respiro.
Reusar a paleta --cv-* do Caminho.
Commit: "feat: cutscene de rank-up"
```

### GAME-007 · Prestige após Rank S
**Cluster:** Meta-Progressão | **Esforço:** L | **Tipo:** Feature | **Fase:** Futuro

```
Ao atingir o topo, opção de "Ascender": reseta XP mas mantém hábitos e histórico.
gameState.prestige_level (0..3); +5% XP permanente por nível; borda/avatar especial.
Commit: "feat: Prestige — progressão além do Rank S"
```

### GAME-008 · Rever o Chefe da Semana (balanceamento/variedade)
**Cluster:** Game Design | **Esforço:** M | **Tipo:** Enhancement | **Fase:** Futuro

```
Analisar regras, gatilhos, balanceamento e variedade do Chefe da Semana
(Masmorras foram removidas — não voltar a elas).
Commit: "balance: Chefe da Semana"
```

### FEAT-003 · Landing page pública com CTA de instalação
**Cluster:** Marketing | **Esforço:** L | **Tipo:** Feature | **Fase:** Futuro

```
landing.html na raiz. Headline, 3 benefícios, screenshots, botão "INSTALAR O SISTEMA".
Estética: o NOVO tom escuro do Caminho (paleta --cv-*), não o roxo/ciano antigo. og:image e twitter:card próprios.
Commit: "feat: landing page pública com CTA de instalação do PWA"
```

### FEAT-004 · Sistema de convite com link único
**Cluster:** Marketing | **Esforço:** M | **Tipo:** Feature | **Fase:** Futuro

```
Tabela invite_codes (code PK, created_by, used_by, created_at, used_at). Código único no cadastro.
Recompensa SEM Ouro (Ouro foi removido): dar 1 escudo de ofensiva a quem convida quando o convidado fecha a 1ª semana.
Commit: "feat: sistema de convite com link único"
```
