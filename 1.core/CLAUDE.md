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

## 🐙 4. Repositórios e Fluxo de Trabalho (Git)
*   **Fluxo de Deploy**: Sempre subir as alterações para testes e validações no repositório de desenvolvimento antes de atualizar o repositório principal de produção.
*   **Repositório de Testes (Dev)**:
    *   **Remoto**: `dev-origin` (aponta para `https://github.com/mateusgaldiano/LifeRPG_Dev`)
    *   **Deploy**: Roda no GitHub Pages a partir da branch `main` do remoto `dev-origin`.
    *   **PowerShell comando**: `git push dev-origin dev:main` (envia a branch local `dev` para a principal de desenvolvimento).
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
*   **Firebase / Cloud Save**: A lógica de autenticação do Google e sincronização assíncrona com Firestore está totalmente pronta e mapeada no script `firebase-config.js`. Contudo, a persistência online e as features sociais (como rankings e PvP de streaks) dependem da inserção das credenciais finais do usuário no arquivo de configuração do console do Firebase.
*   **Notificações Push**: A estrutura do Service Worker está configurada para gerir notificações locais e horários de configuração, mas os disparos em segundo plano necessitam da integração do FCM ou Web Push API com um servidor de persistência de chaves de assinatura (VAPID).
