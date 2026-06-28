# LifeRPG OS — Pipeline de Pendências

> **Sincronizado automaticamente com `pipeline.html`.** Não editar à mão — editar o array `items` no HTML e ressincronizar.
> **Total: 10 itens pendentes.**

---

## 🔴 P0 — CRÍTICO (0)

*Nenhum item P0 pendente.*

## 🟡 P1 — ALTO (3)

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

---

## 🟢 P2 — MÉDIO (2)

### GAME-004 · Comeback mechanic para usuários que voltam após 7+ dias
**Cluster:** Game Design | **Esforço:** M | **Tipo:** Feature | **Fase:** Próximas semanas

```
1. Em state.js ou app.js, no boot do app, calcular dias desde last_active
2. Se days_absent >= 7: ativar flag gameState._comebackMode = true por 3 dias
3. Em game-logic.js, em addRewards(): se _comebackMode === true, multiplicar XP por 1.5
4. Mensagem especial do Iroh ao detectar retorno longo
5. Commit: "feat: Modo Retorno — 1.5x XP por 3 dias após ausência of 7+ dias"
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

---

## 🔵 P3 — BAIXO (5)

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
5. Achievement \"Recrutador\" ao convidar 3 amigos
6. Commit: \"feat: sistema de convite com link único e recompensas bilaterais\"
```

### GAME-008 · Rever e sugerir dungeons e boss quest
**Cluster:** Game Design | **Esforço:** M | **Tipo:** Enhancement | **Fase:** Futuro

```
No futuro, analisar com mais carinho as regras, gatilhos, balanceamento e variedade do pool de dungeons e boss quests.
```
