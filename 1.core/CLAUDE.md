# CLAUDE.md — Guia de Contexto do LifeRPG OS

Guia rápido de referência sobre a arquitetura, stack, convenções e regras de desenvolvimento do projeto **LifeRPG OS**.

---

## 🚀 1. Descrição do Projeto
O **LifeRPG OS** (v2.0) é um aplicativo web progressivo (PWA) de gamificação de hábitos e tarefas diárias. O app transforma a vida cotidiana do usuário em um RPG de turnos, onde o cumprimento de rotinas concede Experiência (XP), Ouro e Streaks de progresso, enquanto falhas aplicam penalidades aos atributos do personagem.

---

## 🛠️ 2. Stack Tecnológica e Restrições
*   **Core**: HTML5 Semântico, CSS3 Vanilla (com variáveis semânticas, layouts responsivos, Dynamic Viewport Height `100dvh` e Glassmorphism) e JavaScript ES6+ Puro (Vanilla).
*   **PWA**: Service Worker (`sw.js`) funcional para suporte a modo offline completo e cache de recursos estáticos.
*   **Não usar**: Frameworks JavaScript (React, Vue, Angular, Svelte) nem pré-processadores/empacotadores complexos (Vite, Webpack, Babel) na base principal.
*   **Estilo Visual**: Design responsivo com foco no mobile-first. O tema ativo padrão é o **Neblina Ártica (Light Mode)**.

---

## ⚙️ 3. Regras de Desenvolvimento
*   **Validação de Sintaxe**: Sempre rodar `node -c app.js` no console local antes de commitar alterações no JavaScript para evitar quebras no boot do navegador.
*   **Sincronização de Código**: A cada modificação estrutural no `app.js`, o arquivo espelho `app.txt` **deve** ser atualizado com o mesmo conteúdo.
*   **Mobile-First e Acessibilidade**:
    *   Touch target de botões e links de ação deve ter no mínimo **44px** (diretriz de acessibilidade WCAG).
    *   inputs de formulários e caixas de texto devem ter `font-size: 16px` no CSS para evitar o zoom automático indesejado do iOS Safari.
*   **Manipulação de Datas**: Nunca usar métodos nativos de string de fuso horário local (como `toDateString()`) para comparadores de data no gameState, pois isso quebra o controle após a meia-noite em fusos não-UTC. Sempre usar a função utilitária `localDateStr()` declarada em `app.js`.

---

## 🐙 4. Repositórios e Fluxo de Trabalho (Git) & Workflow de Deploy
*   **Fluxo de Deploy**:
    1.  Toda alteração que vai para produção ou homologação **exige** o bump da **versão única** em `1.core/version.js`:
        `self.APP_VERSION = 'v2.X.Y';`. Esse valor é a fonte única — alimenta tanto a versão exibida nas Configurações quanto o `CACHE_VERSION` do Service Worker (`sw.js` lê via `importScripts`). **Não** há mais dois números.
    2.  Registrar a mudança em `3.docs/CHANGELOG.md` (entrada nova no topo, com data e mudanças agrupadas).
    3.  Subir para o repositório principal de produção:
        PowerShell: `git push origin dev:main`
    4.  **Homologação (Dev) PAUSADA:** **não** pushar em `dev-origin` por enquanto — o Dev não está sendo usado e seu deploy do Pages estava travando. Validar direto no prod. Retomar `git push dev-origin dev:main` só quando o Dev for reativado.
*   **Repositório de Testes (Dev)**:
    *   **Remoto**: `dev-origin` (aponta para `https://github.com/mateusgaldiano/LifeRPG_Dev`)
    *   **Deploy**: Roda no GitHub Pages a partir da branch `main` do remoto `dev-origin`.
*   **Repositório de Produção (Prod)**:
    *   **Remoto**: `origin` (aponta para `https://github.com/mateusgaldiano/LifeRPG`)
    *   **Deploy**: Deploy de produção estável.
*   **Mensagens de Commit**: Seguir o padrão de Commits Semânticos:
    *   `feat:` para novas funcionalidades.
    *   `fix:` para correções de bugs.
    *   `docs:` para atualizações na documentação.
    *   `style:` para ajustes estéticos, formatação ou variáveis de estilo CSS.

---

## 📐 5. Arquitetura e Decisões Técnicas
*   **Variável de Estado Global (`gameState`)**:
    *   O estado de progresso é salvo sob o objeto centralizado `gameState` (nível, atributos, inventário, conquistas, missões diárias, etc.).
    *   Persistido e sincronizado no cache local do navegador através da chave `lifeRPG_state` no `localStorage`.
    *   Inclui um sanitizador de encoding para recuperar strings ou emojis corrompidos na transferência de arquivos.
*   **Radar Chart (Gráfico de Radar)**:
    *   Renderizado programaticamente em tempo real em um elemento Canvas 2D (`cx = 130`, `cy = 130`, `maxR = 72`).
    *   As labels e eixos são desenhados de forma estática com a cor `#0f1f35` no light mode.
*   **Biblioteca de Hábitos**:
    *   Implementada nativamente com uma curadoria de 30 hábitos estruturados. É carregada como aba principal no modal de criação de novas quests.
*   **Cosméticos & Taverna**:
    *   Moeda interna: Ouro.
    *   Loja de Skins habilitada para avatares premium (como Mist Monarch, Shadow Master e Arise Emperor).

---

## 🐛 6. Estado Atual, Bugs e Pendências
*   **Supabase / Cloud Save**: A autenticação (OAuth Google) e a sincronização com o Postgres do Supabase estão implementadas em `1.core/supabase-config.js` (script clássico, **não** é ES Module). Tabelas: `persons`, `users`, `quests`, `history`, `items`, `inventory`, `user_buffs`, `analytics_events`, `chat_messages`, `friendships`, `pvp_duels`, `push_subscriptions`. O state sincroniza via RPC `sync_user_state_secure` (validações de nível/XP/rank no servidor). Scripts de schema em `3.docs/*.sql`.
*   **Arquitetura ES Modules**: entry point `1.core/app.js`; módulos em `1.core/modules/` (`state.js`, `utils.js`, `ui.js`, `game-logic.js`, `social.js`, `pwa.js`, `weekly-report.js`, `report-worker.js`). O `supabase-config.js` permanece script clássico e expõe funções em `window.*`.
*   **Versão**: fonte única em `1.core/version.js` (ver seção 4). Histórico em `3.docs/CHANGELOG.md`.
*   **Notificações Push (VAPID)**: a estrutura do Service Worker está pronta; os disparos em segundo plano dependem de Edge Function + par de chaves VAPID configurado nos Secrets do Supabase (a chave privada **nunca** vai para o repositório). Pendência aberta — ver `3.docs/pipeline.html` (SEG-001).
