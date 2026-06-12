# LIFERPG OS v2.0 — Contexto para Claude (Debug do Radar Hexagonal)

## O que é o projeto

Estou desenvolvendo um app web de **gamificação de hábitos pessoais** chamado **LifeRPG OS v2.0** — um "painel de alta performance" estilo RPG (Tibia / Ragnarok / D&D). O visual é dark, estoico, premium: tema obsidian preto com neon ciano (#00f0ff), glassmorphism, fonte JetBrains Mono.

O app é uma **Single Page App em HTML + CSS + JS puro** (sem frameworks), rodando localmente via servidor HTTP simples (http://localhost:8080).

---

## O que estamos tentando implementar

### Feature: Gráfico Radar Hexagonal (Teia de Atributos)

Na **sidebar esquerda**, abaixo da barra de XP, existe uma seção chamada **"ATRIBUTOS & SKILLS"**.

Queremos exibir um **gráfico radar hexagonal** (igual ao de RPGs como Ragnarok ou ao Apex Legends) desenhado em **HTML5 Canvas**, mostrando 6 atributos do personagem:

| Eixo | Atributo |
|---|---|
| physical | FÍSICO |
| mental | ESTOICO |
| productivity | FOCO |
| social | CONEXÃO |
| wisdom | SABEDORIA |
| routine | ROTINA |

O gráfico deve:
- Ter **6 eixos** (hexágono) com 5 grades concêntricas
- Preencher com gradiente neon ciano translúcido proporcional ao nível de cada skill
- Mostrar **LV1, LV2...** de cada atributo nos vértices
- Atualizar dinamicamente quando o usuário completa hábitos

---

## O problema

**O canvas existe no DOM, o código JS não lança nenhum erro no console, a sintaxe está correta (validada com `node --check`), mas o hexágono simplesmente NÃO APARECE na tela.**

A seção "ATRIBUTOS & SKILLS" aparece com o wrapper (borda ciano sutil visível), mas o interior fica completamente vazio/preto.

---

## HISTÓRICO COMPLETO DE TENTATIVAS DE CORREÇÃO

### Tentativa 1 — Bug de CSS variable no Canvas
**Hipótese:** `ctx.fillStyle = 'var(--accent-blue)'` → CSS variables não funcionam no Canvas 2D API.

**Correção aplicada:** Substituiu todas as ocorrências de `var(--accent-blue)` por `#00f0ff` (hex literal) no código de canvas.

**Resultado:** Não resolveu. Canvas continua em branco.

---

### Tentativa 2 — Canvas width/height via CSS não configura buffer interno
**Hipótese:** Quando você define tamanho do canvas apenas via CSS (`.width: 240px`), as dimensões do buffer interno de pixel ficam com padrão (300×150 ou 0×0), e o draw acontece num contexto vazio.

**Correção aplicada:**
```javascript
canvas.width = 240;  // forçado no JS antes de qualquer draw
canvas.height = 240;
```

E também `width="240" height="240"` nos atributos HTML do `<canvas>`.

**Resultado:** Não resolveu. Canvas continua em branco.

---

### Tentativa 3 — Função não fechada (try sem catch)
**Hipótese:** Uma edição anterior inseriu `try {` mas o corpo da função ficou fora das chaves do try, causando erro silencioso de escopo.

**Correção aplicada:** Reescrita completa da função `drawRadarChart()` com try/catch corretamente estruturado. Validado com `node --check` → zero erros de sintaxe.

**Resultado:** Não resolveu.

---

### Tentativa 4 — setTimeout para garantir DOM+fontes carregados
**Hipótese:** O canvas pode estar sendo desenhado antes do DOM ou as fontes Google carregarem.

**Correção aplicada:**
```javascript
setTimeout(() => { drawRadarChart(); }, 150);
```
Adicionado no `DOMContentLoaded` como chamada extra além da que já existe dentro de `updateUI()`.

**Resultado:** Não resolveu.

---

### Tentativa 5 — Sidebar sem altura, overflow cortando o canvas
**Hipótese:** O `#app-container` tem `overflow: hidden`. A sidebar `#sidebar-panel` não tinha `height: 100%`, então ela crescia além da área visível e o canvas ficava cortado abaixo do viewport.

**Correção aplicada:**
```css
#sidebar-panel {
    height: 100%;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
}
```

**Resultado:** Não resolveu. O wrapper da seção ATRIBUTOS & SKILLS ficou visível (borda ciano aparece), mas o canvas interno continuou vazio.

---

### Tentativa 6 — Canvas 240px mais largo que a sidebar disponível
**Hipótese:** A sidebar tem 330px de largura total, menos 40px de padding em cada lado = 250px disponíveis. O canvas de 240px deveria caber, mas talvez não estivesse.

**Correção aplicada:**
- Reduzido canvas de `240×240` para `200×200`
- CSS do `#skills-radar-chart` com `max-width: 100%`
- Padding da sidebar reduzido de 28px para 20px

**Resultado:** Não resolveu.

---

### Tentativa 7 (ATUAL) — Raio mínimo muito pequeno → hexágono invisível
**Hipótese:** Quando todas as skills estão em LV1 com xp=0:
- `val = (1-1) + (0/5) = 0`
- `frac = min(0/5, 1.0) = 0`
- `r = (0.12 + 0.88 * 0) * 68 = 8.16px`

O hexágono está sendo **desenhado corretamente, mas com raio de apenas 8px** — um hexágono minúsculo no centro do canvas, quase invisível no fundo preto com preenchimento `rgba(0,240,255,0.05)` (praticamente transparente em área pequena).

**Correção aplicada:** Aumentar raio mínimo de `0.12` para `0.40`:
```javascript
const r = (0.40 + 0.60 * frac) * maxR;
// LV1 (frac=0): r = 0.40 * 68 = 27px  ← visível!
// LV6 (frac=1): r = 1.00 * 68 = 68px  ← borda do canvas
```

**Resultado:** EM TESTE — recarregue a página para verificar.

---

## ESTRUTURA DO CÓDIGO ATUAL

### index.html (completo)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>LifeRPG OS v2.0 ⚔️ - Painel de Alta Performance</title>
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="theme-color" content="#060708">
    <link rel="manifest" href="manifest.json">
    <link rel="apple-touch-icon" href="icons/icon-192.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="ambient-glow-orbs">
        <div class="glow-orb orb-1"></div>
        <div class="glow-orb orb-2"></div>
    </div>

    <div id="app-container">
        <aside id="sidebar-panel">
            <div class="brand-header">
                <div class="brand-logo"><!-- SVG settings icon --></div>
                <span class="brand-title">LifeRPG OS v2.0</span>
            </div>

            <div class="user-profile-card">
                <div class="avatar-wrapper">
                    <div class="avatar-ring-glow"></div>
                    <img id="char-avatar-img" class="avatar-image" src="avatar.png" alt="Mateus">
                </div>
                <div class="user-meta">
                    <h2 class="user-name">Mateus</h2>
                    <span class="user-subtitle">Alta Performance / Estoico</span>
                </div>
            </div>

            <div class="core-metrics-grid">
                <div class="metric-box gold-box">
                    <span class="metric-label">RECURSOS</span>
                    <span class="metric-value">🪙 <span id="lbl-gold">15</span> <span class="unit">AU</span></span>
                </div>
                <div class="metric-box streak-box">
                    <span class="metric-label">CONSISTÊNCIA</span>
                    <span class="metric-value">🔥 <span id="lbl-streak">0</span> <span class="unit">DIAS</span></span>
                </div>
            </div>

            <div class="xp-progress-section">
                <div class="xp-labels">
                    <span class="patente-lvl">OVERALL LEVEL <span id="lbl-level">1</span></span>
                    <span class="xp-values"><span id="lbl-xp-current">0</span> / <span id="lbl-xp-next">100</span> XP</span>
                </div>
                <div class="xp-track">
                    <div id="xp-bar-inner" class="xp-fill" style="width: 0%;"></div>
                </div>
            </div>

            <!-- O canvas que não está renderizando -->
            <div class="skill-tree-container">
                <h3 class="panel-subtitle">ATRIBUTOS & SKILLS</h3>
                <div class="radar-chart-wrapper">
                    <canvas id="skills-radar-chart" width="200" height="200"></canvas>
                </div>
            </div>
        </aside>

        <div id="main-content-panel">
            <!-- tabs: Quests / Taverna / Iroh -->
        </div>
    </div>

    <script src="app.js"></script>
</body>
</html>
```

---

### CSS relevante (styles.css)

```css
/* Container principal — tem overflow:hidden */
#app-container {
    width: 100%;
    max-width: 1024px;
    height: 100vh;
    background: rgba(8, 9, 12, 0.8);
    display: grid;
    grid-template-columns: 330px 1fr;
    position: relative;
    overflow: hidden;   /* ← pai corta overflow */
    z-index: 10;
}

@media (min-width: 1024px) {
    #app-container { height: 88vh; border-radius: 24px; }
}

/* Sidebar */
#sidebar-panel {
    background: rgba(10, 11, 14, 0.5);
    border-right: 1px solid rgba(255,255,255,0.04);
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    overflow-y: auto;
    overflow-x: hidden;
    position: relative;
    height: 100%;
    max-height: 100%;
}

/* Wrapper do canvas */
.radar-chart-wrapper {
    width: 100%;
    min-height: 210px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 6px 0;
    background: rgba(0, 240, 255, 0.015);
    border: 1px solid rgba(0, 240, 255, 0.08);
    border-radius: 16px;
    position: relative;
    overflow: visible;
    margin-top: 6px;
}

#skills-radar-chart {
    display: block;
    max-width: 100%;
}
```

---

### app.js — função drawRadarChart() atual (completa)

```javascript
// Chamadas para drawRadarChart:
// 1. DOMContentLoaded → updateUI() → renderSkills() → drawRadarChart()
// 2. DOMContentLoaded → setTimeout 150ms → drawRadarChart()
// 3. Toda vez que updateUI() é chamado (ao completar quests, etc.)

// gameState.skills (estado inicial):
let gameState = {
    level: 1,
    xp: 0, xpToNext: 100, gold: 15, streak: 0,
    skills: {
        physical:     { level: 1, xp: 0, xpToNext: 5 },
        mental:       { level: 1, xp: 0, xpToNext: 5 },
        productivity: { level: 1, xp: 0, xpToNext: 5 },
        social:       { level: 1, xp: 0, xpToNext: 5 },
        wisdom:       { level: 1, xp: 0, xpToNext: 5 },
        routine:      { level: 1, xp: 0, xpToNext: 5 }
    }
};

function drawRadarChart() {
    try {
        const canvas = document.getElementById('skills-radar-chart');
        if (!canvas) { console.error('[Radar] canvas não encontrado!'); return; }
        const ctx = canvas.getContext('2d');
        if (!ctx) { console.error('[Radar] contexto 2d nulo!'); return; }

        // Força dimensões do buffer interno do canvas
        canvas.width = 200;
        canvas.height = 200;

        const W = 200, H = 200;
        const cx = W / 2, cy = H / 2;  // cx=100, cy=100
        const maxR = 68;                 // raio máximo

        ctx.clearRect(0, 0, W, H);

        const skillTypes  = ['physical', 'mental', 'productivity', 'social', 'wisdom', 'routine'];
        const skillLabels = {
            physical: 'FÍSICO', mental: 'ESTOICO', productivity: 'FOCO',
            social: 'CONEXÃO', wisdom: 'SABEDORIA', routine: 'ROTINA'
        };
        const N = skillTypes.length; // 6 → hexágono

        // 1. Grades hexagonais concêntricas
        ctx.lineWidth = 1;
        for (let g = 1; g <= 5; g++) {
            const r = (g / 5) * maxR;
            ctx.beginPath();
            for (let i = 0; i < N; i++) {
                const a = (i * 2 * Math.PI) / N - Math.PI / 2;
                const x = cx + r * Math.cos(a);
                const y = cy + r * Math.sin(a);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.strokeStyle = g === 5 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)';
            ctx.stroke();
        }

        // 2. Linhas dos eixos
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        for (let i = 0; i < N; i++) {
            const a = (i * 2 * Math.PI) / N - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + maxR * Math.cos(a), cy + maxR * Math.sin(a));
            ctx.stroke();
        }

        // 3. Teia de valores
        // ATENÇÃO: raio mínimo de 40% para que LV1 (frac=0) ainda mostre hexágono visível
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
            const type  = skillTypes[i];
            const skill = (gameState.skills && gameState.skills[type]) || { level: 1, xp: 0, xpToNext: 5 };
            const val   = (skill.level - 1) + (skill.xp / (skill.xpToNext || 5));
            const frac  = Math.min(val / 5, 1.0);
            const r     = (0.40 + 0.60 * frac) * maxR;
            // LV1 xp=0 → r = 0.40 * 68 = 27.2px  (hexágono pequeno mas visível)
            // LV6 xp=0 → r = 1.00 * 68 = 68px     (borda máxima)
            const a = (i * 2 * Math.PI) / N - Math.PI / 2;
            i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
                    : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
        ctx.closePath();

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        grad.addColorStop(0, 'rgba(0,240,255,0.35)');
        grad.addColorStop(1, 'rgba(0,240,255,0.05)');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. Bolinhas nos vértices
        for (let i = 0; i < N; i++) {
            const type  = skillTypes[i];
            const skill = (gameState.skills && gameState.skills[type]) || { level: 1, xp: 0, xpToNext: 5 };
            const val   = (skill.level - 1) + (skill.xp / (skill.xpToNext || 5));
            const frac  = Math.min(val / 5, 1.0);
            const r     = (0.40 + 0.60 * frac) * maxR;
            const a     = (i * 2 * Math.PI) / N - Math.PI / 2;
            ctx.beginPath();
            ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#00f0ff';
            ctx.fill();
        }

        // 5. Rótulos de texto (nome + nível)
        for (let i = 0; i < N; i++) {
            const type  = skillTypes[i];
            const skill = (gameState.skills && gameState.skills[type]) || { level: 1, xp: 0, xpToNext: 5 };
            const a     = (i * 2 * Math.PI) / N - Math.PI / 2;
            const dist  = maxR + 19;
            const lx    = cx + dist * Math.cos(a);
            const ly    = cy + dist * Math.sin(a);
            const cos   = Math.cos(a);

            ctx.textBaseline = 'middle';
            ctx.textAlign = Math.abs(cos) < 0.2 ? 'center' : cos > 0 ? 'left' : 'right';

            ctx.font = 'bold 7px "JetBrains Mono", monospace';
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.fillText(skillLabels[type], lx, ly - 7);

            ctx.font = 'bold 9px "JetBrains Mono", monospace';
            ctx.fillStyle = '#00f0ff';
            ctx.fillText(`LV${skill.level}`, lx, ly + 6);
        }

    } catch (err) {
        console.error('[Radar] Erro ao desenhar:', err);
    }
}
```

---

## Perguntas para o Claude

1. **Com o raio mínimo de 40%, o hexágono apareceu?** Se sim, o bug era o tamanho mínimo (tentativa 7). Se não, o canvas realmente não está renderizando nada.

2. **Se ainda não apareceu** — pode haver algum problema de CSS que "esconde" o canvas mesmo ele sendo desenhado? Por exemplo: `opacity: 0`, `visibility: hidden`, `transform: scale(0)`, ou algum `z-index` negativo herdado por um elemento pai?

3. **Existe algum problema estrutural no meu approach?** O canvas está dentro de um `<aside>` com `overflow-y: auto`, que está dentro de um `<div>` com `overflow: hidden`. Isso pode fazer o canvas ser desenhado fora do clip?

4. **Sugestão de debug rápido:** Pode adicionar temporariamente `ctx.fillStyle = 'red'; ctx.fillRect(0, 0, 200, 200);` como primeira instrução do try para testar se o canvas está visível em absoluto? Se um retângulo vermelho não aparecer, é problema de CSS/visibilidade. Se aparecer, é problema na lógica de desenho.

5. **Reescreve a função completa do zero** de forma garantida, se souber qual é o problema.
