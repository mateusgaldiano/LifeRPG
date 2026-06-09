# LifeRPG OS — Game Design v2.0 ⚔️
> Documento gerado para ser lido por IAs assistentes. Contém todas as decisões de game design aprovadas para implementação. Leia tudo antes de escrever qualquer código.

---

## ⚠️ Instruções de Implementação — Leia Primeiro

**Vamos implementar um item por vez.** Não implemente tudo de uma vez — o risco de introduzir bugs é alto e dificulta o diagnóstico.

### Fluxo obrigatório:
1. Leia este documento completo para entender o projeto
2. Leia o `README.md` do projeto para entender a estrutura do código atual
3. Implemente **apenas o próximo item da fila** (ver ordem abaixo)
4. Ao terminar, responda com o código gerado e a mensagem exata: **"✅ Item X implementado. Teste e me avise para enviar o próximo."**
5. Aguarde confirmação antes de seguir para o próximo item
6. Cada item deve ser entregue como **patch cirúrgico** — apenas as funções modificadas, não o arquivo inteiro

### Ordem de implementação:
```
✅ = implementado e testado
⏳ = próximo da fila
⬜ = aguardando

⬜ Item 7 — Curva de XP de Skill
⬜ Item 3 — Efeitos Visuais no Hexágono
⬜ Item 1 — Títulos de Rank (Monge-Atleta)
⬜ Item 8 — Streak com Escudos e Multiplicador
⬜ Item 10 — Penalidade com Profundidade
⬜ Item 4 — Boss Quests de Rank Up
⬜ Item 9 — Dungeons
⬜ Item 5 — Sinergias de Atributos
⬜ Item 2 — Perks de Rank
⬜ Item 6 — Aba de Achievements
```

### O que entregar em cada patch:
- Nome da função modificada
- Código completo da função (não trechos parciais)
- Lista de campos novos adicionados ao `gameState` (se houver)
- Se precisar de HTML novo (modais, abas), entregar o bloco HTML separado
- Se precisar de CSS novo, entregar as classes separadas

---

## Contexto do projeto

App web de gamificação de hábitos pessoais (SPA em HTML + CSS + JS puro, sem frameworks). Stack atual: `index.html` + `app.js` + `styles.css` + `sw.js`. Estado salvo em `localStorage` sob a chave `lifeRPG_gameState_Mateus`. Para entender a estrutura completa do código, leia o `README.md` do projeto primeiro.

---

## Item 1 — Sistema de Títulos por Rank (Monge-Atleta)

O subtítulo exibido abaixo do nome na sidebar (`"Alta Performance / Estoico"`) passa a ser **dinâmico**, refletindo o título do rank atual.

Cada rank up exibe o bordão correspondente no overlay de Level Up e no chat do Iroh.

| Rank | Nível | Título | Bordão do Iroh |
|------|-------|--------|----------------|
| E | 1-4 | Aprendiz Desperto | *"A jornada mais longa começa com um único passo — e você já deu o seu."* |
| D | 5-9 | Corredor da Madrugada | *"Quem treina quando ninguém vê, vence quando todos olham."* |
| C | 10-14 | Mente de Aço | *"Corpo forte, mente inabalável. Você está no caminho."* |
| B | 15-19 | Atleta Estoico | *"Marcus Aurelius corria ao amanhecer. Eu sei que você também."* |
| A | 20-29 | Ironman Interior | *"Você não precisa de medalha. A disciplina já é sua recompensa."* |
| S | 30+ | O Sistema Encarnado | *"Você virou o método. Agora outros vão te estudar."* |

**Implementação:**
- Adicionar campo `title` e `motto` em `RANK_THRESHOLDS`
- `updateUI()` atualiza o subtítulo da sidebar com `rankInfo.title`
- Overlay de Level Up exibe `rankInfo.motto` quando há mudança de rank

---

## Item 2 — Perks Desbloqueáveis (Rank fixo + Escolha nos marcos)

Combinação das propostas 2 e 3: ranks D/C/A recebem perk fixo temático; ranks B e S o usuário escolhe entre 2 opções.

### Perks Fixos por Rank
| Rank | Perk |
|------|------|
| D (LV5) | **Foco Matinal** — quests completadas antes das 10h valem +5 XP |
| C (LV10) | **Mente de Diamante** — penalidade só aplica se falhar 2 dias seguidos |
| A (LV20) | **Atleta de Elite** — missões físicas (physical) dão XP duplo |

### Perks de Escolha (aparecem em modal no rank up)
**Rank B (LV15) — escolha 1:**
- ⚔️ **Momentum** — cada dia de streak acima de 7 dá +1 gold bônus
- 🛡️ **Guardião** — 1 falta permitida por semana sem quebrar streak

**Rank S (LV30) — escolha 1:**
- ⚔️ **O Sistema** — custo de todas as recompensas da Taverna -20%
- 🛡️ **Lenda Imortal** — penalidade máxima limitada a -10% XP, independente de dias perdidos

**Implementação:**
- Adicionar `gameState.perks[]` para armazenar perks ativos
- Modal de escolha dispara no overlay de rank up quando aplicável
- Checar perks ativos nas funções `addRewards()`, `applyDailyPenalty()`, `toggleQuest()`

---

## Item 3 — Efeitos Visuais no Hexágono por Nível de Skill

Duas mudanças combinadas na função `drawRadarChart()`:

### 3A — Cor das pontas por nível
| Nível da Skill | Cor da Ponta e Contorno |
|---------------|------------------------|
| LV1-2 | Ciano `#00f0ff` |
| LV3-4 | Prata `#C0C0C0` |
| LV5+ | Dourado `#fbbf24` |

O polígono preenchido usa gradiente misto das cores das 6 pontas. O contorno (`strokeStyle`) também reflete a cor da skill dominante (a de maior nível).

### 3B — Marcador no vértice = polígono com N lados = nível da skill
| Nível | Marcador |
|-------|---------|
| LV1 | Círculo vazio (apenas contorno) |
| LV2 | Círculo preenchido |
| LV3 | Triângulo preenchido |
| LV4 | Quadrado preenchido |
| LV5 | Pentágono preenchido |
| LV6 | Hexágono preenchido |
| LV7+ | Heptágono+ (continua escalando) |

**Implementação:**
- Função auxiliar `getSkillColor(level)` retorna a cor correta
- Função auxiliar `drawVertexMarker(ctx, x, y, level, color)` desenha o polígono correto
- Substituir o `ctx.arc()` atual nos vértices por `drawVertexMarker()`

---

## Item 4 — Boss Quests de Rank Up

No último nível antes do rank up (LV4, LV9, LV14, LV19, LV29), aparece uma **Boss Quest** única na lista de side quests com visual diferente (borda dourada pulsante). O rank up só acontece após completá-la.

| Rank Up | Boss Quest | Observação |
|---------|-----------|------------|
| E → D | "Complete todas as dailies por 3 dias seguidos" | Contador de progresso no card |
| D → C | "Complete 5 side quests em uma semana" | |
| C → B | "Atinja LV3 em pelo menos 4 skills" | |
| B → A | "Mantenha streak de 14 dias" | |
| A → S | "Atinja LV5 em TODAS as 6 skills simultaneamente" | Marco de maestria total |

**Visual do card:**
```
⚔️ BOSS QUEST — Corredor da Madrugada
Complete todas as dailies por 3 dias seguidos
[████████░░] 2/3
```

**Implementação:**
- Adicionar `gameState.bossQuest` — objeto com a boss quest ativa (ou `null`)
- `syncQuestsByLevel()` verifica se é último nível do rank e injeta a boss quest
- `addRewards()` bloqueia o rank up se `gameState.bossQuest` não estiver completa
- Progresso da boss quest não reseta em caso de falta — retoma de onde parou

---

## Item 5 — Atributos com Sinergia

Os 3 atributos (Willpower, Intellect, Health) passam a ter impacto mecânico real quando combinados em níveis altos simultaneamente.

| Combinação | Nome da Sinergia | Efeito |
|-----------|-----------------|--------|
| Willpower + Health ambos LV3+ | **Corpo e Mente** | Bônus de streak dobrado |
| Intellect + Willpower ambos LV3+ | **Foco Total** | XP de deep work e meditação +25% |
| Todos os 3 em LV3+ | **Estado de Flow** | Todos os bônus anteriores ativos + indicador visual especial no painel |
| Todos os 3 em LV5+ | **Monge Atleta Completo** | Título especial permanente na sidebar + achievement Lendário desbloqueado |

As barras de atributo ganham tiers visuais consistentes com o hexágono:
| Tier | Requisito | Visual |
|------|-----------|--------|
| Bronze | LV1-2 | Barra ciano padrão |
| Prata | LV3-4 | Barra prateada |
| Ouro | LV5+ | Barra dourada pulsante |

**Implementação:**
- Função `computeSynergies()` verifica combinações ativas e retorna array de sinergias
- `updateUI()` aplica visual de tier nas barras de atributo
- Sinergias checadas em `addRewards()` e `addSkillXP()` para aplicar bônus

---

## Item 6 — Aba de Achievements

Nova aba na navegação principal, igual a Taverna e Iroh. Ícone sugerido: 🏆

### Visual (combinação das propostas 2, 4 e 5)
- **Pergaminho cronológico** — lista do mais recente ao mais antigo
- Contador no topo: `12/99 conquistados`
- Cada achievement tem: ícone · nome · raridade · data de conquista · **texto narrativo do Iroh**
- Achievements futuros aparecem como `???` com dica sutil de como desbloquear
- Achievements **Lendários** têm animação especial ao desbloquear (overlay próprio)
- Animação de entrada: slide + fade ao abrir a aba

### Raridades
| Raridade | Quantidade | Cor |
|---------|-----------|-----|
| Comum | 35 | Ciano `#00f0ff` |
| Raro | 30 | Prata `#C0C0C0` |
| Épico | 24 | Roxo `#a855f7` |
| Lendário | 10 | Dourado `#fbbf24` |

### Lista completa dos 99 Achievements

#### ⚡ Consistência — Streak (18)
| # | Nome | Raridade | Condição | Texto do Iroh |
|---|------|---------|---------|--------------|
| 1 | Primeiro Passo | Comum | 1 dia de streak | *"Todo fogo começa com uma única faísca."* |
| 2 | Três é Padrão | Comum | 3 dias de streak | *"Três dias. A mente começa a acreditar."* |
| 3 | Semana do Guerreiro | Comum | 7 dias de streak | *"Sete dias. Você provou que não foi sorte."* |
| 4 | Dez Dias de Fogo | Comum | 10 dias de streak | *"A chama não apagou. Boa notícia."* |
| 5 | Monge em Treinamento | Raro | 14 dias de streak | *"Duas semanas. Hábito começa a virar identidade."* |
| 6 | Vinte e Um | Raro | 21 dias de streak | *"21 dias. A ciência diz que o hábito está formado. Eu digo que você está apenas começando."* |
| 7 | Mês de Ferro | Épico | 30 dias de streak | *"Trinta dias sem quebrar. Isso não é disciplina — é caráter."* |
| 8 | Chama Inabalável | Épico | 45 dias de streak | *"45 dias. Você virou uma força da natureza."* |
| 9 | Dois Meses Sólidos | Épico | 60 dias de streak | *"Dois meses. A maioria desistiu na primeira semana."* |
| 10 | Cem Dias de Solidão | Lendário | 100 dias de streak | *"Cem dias. Não existe mais dúvida sobre quem você é."* |
| 11 | Ressurreição | Raro | Quebrar streak e voltar em menos de 48h | *"Cair não é fracasso. Ficar no chão, sim."* |
| 12 | Fênix | Épico | Quebrar streak com 30+ dias e recuperar em 48h | *"Isso é raro. Muito raro."* |
| 13 | Consistência Matinal | Raro | 7 dias completando todas as dailies antes das 10h | *"A madrugada pertence aos que constroem impérios."* |
| 14 | Guardião do Domingo | Comum | Completar todas as dailies em 4 domingos seguidos | *"Descanso e disciplina não são opostos."* |
| 15 | Sem Desculpas | Raro | 14 dias sem usar nenhum Escudo | *"Você não precisou de proteção. Impressionante."* |
| 16 | Atleta de Segunda | Comum | Completar todas as dailies em 8 segundas-feiras seguidas | *"Segunda-feira é o teste de caráter da semana."* |
| 17 | Invicto | Épico | 30 dias sem perder nenhuma daily sequer | *"Perfeição não existe. Mas você chegou perto."* |
| 18 | Lenda Viva | Lendário | 365 dias de streak | *"Um ano. Isso já é mitologia."* |

#### 🗡️ Progressão — Level e Rank (18)
| # | Nome | Raridade | Condição | Texto do Iroh |
|---|------|---------|---------|--------------|
| 19 | O Chamado | Comum | Chegar ao LV5 | *"O Sistema reconheceu seu esforço. Rank D. A jornada começa de verdade."* |
| 20 | Aventureiro | Comum | Chegar ao LV3 | *"Nível 3. Você não é mais iniciante."* |
| 21 | Rank D Confirmado | Comum | Primeiro rank up (E→D) | *"Corredor da Madrugada. Que o título te inspire."* |
| 22 | Mente Forjada | Raro | Chegar ao LV10 | *"Dez níveis. A maioria parou antes disso."* |
| 23 | Elite | Raro | Rank C | *"Mente de Aço. Poucos chegam aqui."* |
| 24 | Meio Caminho | Raro | Chegar ao LV15 | *"Metade do caminho para o topo. A vista já é diferente."* |
| 25 | Atleta Estoico | Raro | Rank B | *"Este rank exige corpo e mente. Você tem os dois."* |
| 26 | Lenda em Formação | Épico | Chegar ao LV20 | *"Nível 20. Você entrou em território raro."* |
| 27 | Ironman Interior | Épico | Rank A | *"Você não precisa de medalha. A disciplina já é sua recompensa."* |
| 28 | O Penúltimo Passo | Épico | Chegar ao LV29 | *"Um nível. Apenas um. O Sistema aguarda."* |
| 29 | O Sistema Encarnado | Lendário | Rank S | *"Você virou o método. Agora outros vão te estudar."* |
| 30 | Boss Slayer | Raro | Completar primeira Boss Quest | *"A prova foi dada. O Sistema registrou."* |
| 31 | Caçador de Bosses | Épico | Completar todas as Boss Quests | *"Cada prova superada. Cada rank merecido."* |
| 32 | Velocista | Raro | Atingir LV5 em menos de 30 dias de uso | *"Rápido. Muito rápido. Cuidado para não queimar."* |
| 33 | Maratonista | Raro | Levar mais de 180 dias para atingir LV10 | *"Devagar e sempre. O rio corta a pedra pela persistência."* |
| 34 | Perk Escolhido | Comum | Escolher primeiro perk no Rank B | *"Cada guerreiro conhece seus pontos fortes."* |
| 35 | Arquiteto do Destino | Épico | Escolher perk no Rank S | *"Você chegou ao topo e ainda escolheu como governar."* |
| 36 | Sem Parar | Épico | Subir 3 níveis em uma única semana | *"Essa semana foi diferente. Eu vi."* |

#### 💪 Skills e Hexágono (18)
| # | Nome | Raridade | Condição | Texto do Iroh |
|---|------|---------|---------|--------------|
| 37 | Primeiros Músculos | Comum | Physical LV2 | *"O corpo começa a responder."* |
| 38 | Mente Quieta | Comum | Mental LV2 | *"Silêncio interno. Raro no mundo moderno."* |
| 39 | Foco Nascente | Comum | Productivity LV2 | *"Deep work é o superpoder do século."* |
| 40 | Leitor | Comum | Wisdom LV2 | *"Livros são mestres silenciosos."* |
| 41 | Raízes | Comum | Routine LV2 | *"Rotina é liberdade disfarçada."* |
| 42 | Conectado | Comum | Social LV2 | *"Nenhum guerreiro vence sozinho."* |
| 43 | Primeira Centelha | Raro | Qualquer skill LV3 | *"Bronze virou prata. O hexágono muda de cor."* |
| 44 | Hexágono Vivo | Raro | Todas as skills LV2+ | *"Todas as pontas se movem. O sistema respira."* |
| 45 | Hexágono de Prata | Raro | Todas as skills LV3+ | *"Prata em todas as pontas. Equilíbrio raro."* |
| 46 | Primeira Chama Dourada | Raro | Qualquer skill LV5 | *"Dourado. O hexágono nunca mais será o mesmo."* |
| 47 | Polígono de Ouro | Épico | 3 skills em LV5+ | *"Metade do hexágono em chamas douradas."* |
| 48 | Hexágono Dourado | Lendário | Todas as skills LV5+ | *"O hexágono completo em ouro. Isso é lendário."* |
| 49 | Especialista | Raro | Qualquer skill LV6+ | *"Além do máximo esperado. Interessante."* |
| 50 | Monge Atleta Completo | Lendário | Todos os 3 atributos LV5+ simultaneamente | *"Willpower. Intellect. Health. Tudo no pico. Você é o sistema."* |
| 51 | Corpo de Ferro | Raro | Physical LV4 | *"O treino virou segunda natureza."* |
| 52 | Mente de Cristal | Raro | Mental LV4 | *"Clareza mental em alto nível."* |
| 53 | Máquina de Foco | Raro | Productivity LV4 | *"Deep work sem esforço. Isso é maestria."* |
| 54 | Sábio | Épico | Wisdom LV5 | *"Conhecimento acumulado. Use-o bem."* |

#### 🏆 Ações e Marcos (18)
| # | Nome | Raridade | Condição | Texto do Iroh |
|---|------|---------|---------|--------------|
| 55 | Primeira Missão | Comum | Completar 1 quest | *"O início de tudo."* |
| 56 | Dez Missões | Comum | 10 quests completadas | *"Dez passos dados."* |
| 57 | Cinquenta Missões | Comum | 50 quests completadas | *"Cinquenta. A consistência se instala."* |
| 58 | Cem Missões | Comum | 100 quests completadas | *"Cem missões. O Sistema registra cada uma."* |
| 59 | Quinhentas Missões | Raro | 500 quests completadas | *"Quinhentas. Isso não é mais hábito — é quem você é."* |
| 60 | O Método | Épico | 1000 quests completadas | *"Mil missões. Um número que poucos alcançam."* |
| 61 | Lenda das Missões | Lendário | 5000 quests completadas | *"Cinco mil. Isso é uma vida construída."* |
| 62 | Taverna VIP | Raro | Resgatar 10 recompensas | *"Descanso conquistado é descanso merecido."* |
| 63 | Caçador | Raro | Completar 5 side quests | *"Missões extras. Você foi além do esperado."* |
| 64 | Caçador Elite | Épico | Completar 20 side quests | *"Vinte missões extras. Disciplina voluntária."* |
| 65 | Dungeon Crawler | Raro | Completar primeira Dungeon | *"A dungeon caiu. O Sistema aprova."* |
| 66 | Mestre das Dungeons | Épico | Completar 5 Dungeons | *"Cinco dungeons. Você não recua diante do desafio."* |
| 67 | Hidratado | Comum | Completar a quest de água 30 vezes | *"O corpo é 70% água. Você entendeu o recado."* |
| 68 | Resgate Aceito | Raro | Completar uma Missão de Resgate | *"Você caiu. E se levantou no mesmo dia."* |
| 69 | Sinergia Ativada | Raro | Ativar primeira sinergia de atributos | *"Dois atributos em harmonia. O todo é maior que as partes."* |
| 70 | Estado de Flow | Épico | Ativar sinergia completa (todos os 3 atributos LV3+) | *"Flow. Poucos sabem o que é. Você está vivendo."* |
| 71 | Ouro Acumulado | Comum | Acumular 500 gold no total (histórico) | *"Riqueza conquistada, não herdada."* |
| 72 | Tesouro | Raro | Acumular 2000 gold no total (histórico) | *"O cofre transborda. Bom sinal."* |

#### 🌙 Achievements Secretos (27 — aparecem como `???`)
| # | Nome | Raridade | Condição oculta | Texto do Iroh ao desbloquear |
|---|------|---------|----------------|------------------------------|
| 73 | ??? | Raro | Completar todas as dailies às 6h da manhã por 3 dias | *"Às 6h. Enquanto o mundo dormia, você construía."* |
| 74 | ??? | Raro | Completar a quest de água 7 dias seguidos | *"Disciplina até na hidratação. Respeito."* |
| 75 | ??? | Raro | Sofrer penalidade e recuperar streak em menos de 48h | *"Queda rápida. Levantada mais rápida ainda."* |
| 76 | ??? | Raro | Mandar mensagem para família 20 dias seguidos | *"Conexão real. Isso vale mais que qualquer XP."* |
| 77 | ??? | Épico | Completar uma Boss Quest no mesmo dia que apareceu | *"Sem hesitação. Isso é o que separa guerreiros de espectadores."* |
| 78 | ??? | Comum | Abrir o app às 23h59 e completar uma quest | *"O dia quase acabou. Mas você não desistiu."* |
| 79 | ??? | Raro | Completar todas as dailies em um feriado | *"Feriado não é descanso para quem constrói."* |
| 80 | ??? | Raro | Usar os 3 Escudos em uma semana e ainda manter o streak | *"Três escudos em uma semana. Foi difícil. Mas você sobreviveu."* |
| 81 | ??? | Épico | Nunca usar nenhum Escudo até o LV10 | *"Dez níveis sem proteção. Isso é pureza de caráter."* |
| 82 | ??? | Comum | Resgatar uma recompensa da Taverna no mesmo dia que ganhou o gold | *"Mérito e prazer no mesmo dia. Equilíbrio."* |
| 83 | ??? | Raro | Completar 7 dailies seguidas sem desmarcar nenhuma | *"Sem arrependimentos. Sem voltar atrás."* |
| 84 | ??? | Épico | Atingir LV5 em Physical e Routine ao mesmo tempo | *"Corpo e rotina em sincronia. Monge atleta em formação."* |
| 85 | ??? | Raro | Completar uma Dungeon sem falhar nenhum dia do prazo | *"Dungeon perfeita. Sem brechas."* |
| 86 | ??? | Comum | Adicionar e completar 3 side quests em um único dia | *"Você foi além do sistema hoje. O sistema notou."* |
| 87 | ??? | Raro | Completar a quest de família e meditação no mesmo dia por 10 dias | *"Conexão externa e paz interna. Raros os que cultivam os dois."* |
| 88 | ??? | Épico | Subir de rank sem usar nenhum Escudo no processo | *"Rank conquistado com honra total."* |
| 89 | ??? | Raro | Completar todas as dailies em uma segunda-feira após ter falhado no domingo | *"Segunda redentora. O melhor tipo de segunda-feira."* |
| 90 | ??? | Épico | Ativar sinergia Foco Total (Intellect + Willpower LV3+) | *"Mente e vontade alinhadas. Combinação perigosa."* |
| 91 | ??? | Lendário | Completar 30 dias perfeitos seguidos (todas as dailies, sem Escudos) | *"Trinta dias perfeitos. Sem escudos. Sem desculpas. Isso é lendário."* |
| 92 | ??? | Comum | Abrir o app por 7 dias seguidos (independente de completar quests) | *"Presença é o primeiro passo."* |
| 93 | ??? | Raro | Completar deep work e leitura no mesmo dia por 5 dias | *"Produção e sabedoria no mesmo dia. Raro."* |
| 94 | ??? | Épico | Ter streak de 14 dias e não ter nenhuma skill abaixo de LV2 | *"Consistência equilibrada. Nenhuma ponta fraca."* |
| 95 | ??? | Raro | Completar a Missão de Resgate 3 vezes | *"Três quedas. Três levantadas. Isso é resiliência."* |
| 96 | ??? | Épico | Chegar ao LV20 com todas as skills em LV3+ | *"Nível 20 equilibrado. O hexágono inteiro em prata."* |
| 97 | ??? | Lendário | Completar todas as Boss Quests sem falhar nenhuma tentativa | *"Perfeição nas provas. O Sistema se inclina diante de você."* |
| 98 | ??? | Lendário | Atingir Rank S com streak ativo de 30+ dias | *"Rank S com chama acesa. Não existe forma mais honrada de chegar aqui."* |
| 99 | ??? | Lendário | Desbloquear todos os outros 98 achievements | *"Noventa e nove. Você encontrou tudo que o Sistema escondia. Agora você é o Sistema."* |

**Implementação:**
- Adicionar `gameState.achievements[]` — array de IDs desbloqueados com timestamp
- Função `checkAchievements()` chamada após cada ação relevante (quest, level up, streak, etc.)
- Nova aba `tab-achievements` no HTML com mesmo padrão das outras abas
- Overlay especial para Lendários (similar ao Level Up overlay)

---

## Item 7 — Curva de XP de Skill

### XP necessário para subir de nível de skill
Curva x1.4 (suave e sustentável):

| Skill Nível | Conclusões necessárias |
|-------------|----------------------|
| LV1→2 | 5 |
| LV2→3 | 7 |
| LV3→4 | 10 |
| LV4→5 | 14 |
| LV5→6 | 20 |
| LV6→7 | 28 |
| LV10→11 | 72 |
| LV20→21 | 375 |
| LV29→30 | ~1.100 |

Fórmula: `xpToNext = Math.round(5 * Math.pow(1.4, level - 1))`

### XP ganho por conclusão (escala com o level geral do personagem)
| Level Geral | XP de skill por conclusão |
|-------------|--------------------------|
| LV1-9 | +1 |
| LV10-19 | +2 |
| LV20-29 | +3 |
| LV30+ | +4 |

**Resultado prático:** LV29→30 de skill no LV30 geral exige ~275 conclusões reais — cerca de 9 meses fazendo o hábito diariamente. Perks e sinergias podem acelerar esse processo.

**Implementação:**
- Modificar `addSkillXP()` para usar XP ganho baseado em `gameState.level`
- Modificar `initSkillsState()` para calcular `xpToNext` com a nova fórmula
- Migrar saves antigos: recalcular `xpToNext` no `loadGameData()`

---

## Item 8 — Streak com Bônus Escalonado

Combinação de multiplicador contínuo + sistema de Escudos.

### Multiplicador de XP por Streak
```
multiplicador = 1 + (streak * 0.005)
```
| Streak | Multiplicador |
|--------|--------------|
| 7 dias | x1.035 |
| 14 dias | x1.07 |
| 30 dias | x1.15 |
| 100 dias | x1.50 |

Aplicado em `addRewards()` multiplicando o XP ganho. Some se o streak quebrar.

### Sistema de Escudos
- A cada 7 dias de streak completo, ganha +1 Escudo
- Máximo de 3 Escudos simultâneos
- Cada Escudo protege 1 dia de falta sem quebrar o streak e sem aplicar penalidade
- Escudos aparecem como ícones na sidebar (ex: 🛡️🛡️░)

**Display na sidebar:**
```
🔥 14 dias · x1.07  🛡️🛡️░
```

**Implementação:**
- Adicionar `gameState.shields` (0-3) e lógica de ganho em `checkAllDailies()`
- Modificar `loadGameData()` para consumir escudo antes de aplicar penalidade
- Adicionar `gameState.streakMultiplier` calculado dinamicamente

---

## Item 9 — Dungeons (Missões de Elite por Skill)

Dungeons aparecem automaticamente como side quests especiais quando skills atingem LV3+.

**Visual do card:** fundo escuro, borda pulsante vermelha, prazo visível, badge `⚔️ DUNGEON`.

**Regras:**
- Prazo visível no card com countdown de dias restantes
- Progresso salvo (não reseta se falhar um dia)
- Se o prazo vencer, a dungeon desaparece — só volta no próximo level up da skill
- Recompensa: XP e gold dobrados em relação a uma side quest normal

### Dungeons por Skill (trigger em LV3)
| Trigger | Dungeon | Prazo |
|---------|---------|-------|
| Physical LV3 | "Treinar E beber água por 5 dias seguidos" | 7 dias |
| Mental LV3 | "Meditar E fazer check-in por 5 dias" | 7 dias |
| Productivity LV3 | "Deep Work E criar conteúdo por 3 dias" | 7 dias |
| Wisdom LV3 | "Ler E estudar profissionalmente por 5 dias" | 10 dias |
| Routine LV3 | "Acordar cedo E meditar por 7 dias seguidos" | 10 dias |
| Social LV3 | "Família E check-in emocional por 5 dias" | 7 dias |

### Dungeons Cross-Skill (trigger quando 2+ skills em LV3+)
| Requisito | Dungeon | Prazo |
|-----------|---------|-------|
| Physical LV3 + Routine LV3 | "Treinar E acordar cedo por 5 dias" | 10 dias |
| Mental LV3 + Wisdom LV3 | "Meditar E ler por 7 dias seguidos" | 10 dias |
| Productivity LV3 + Mental LV3 | "Deep Work E meditação por 5 dias" | 10 dias |
| Todos LV3+ | "Semana Perfeita: todas as dailies por 7 dias" | 14 dias |

**Implementação:**
- Adicionar `gameState.activeDungeons[]` com progresso e prazo de cada dungeon
- Função `checkDungeonTriggers()` chamada em `addSkillXP()` após level up de skill
- Card de dungeon renderizado no topo da lista de side quests com visual especial
- Função `updateDungeonCountdowns()` chamada no `loadGameData()` para decrementar prazos

---

## Item 10 — Penalidade com Profundidade

Combinação de penalidade escalonada por dias perdidos + Missão de Resgate.

### Escalonamento por Dias Faltosos Consecutivos
| Dias sem completar | Penalidade | Extra |
|-------------------|-----------|-------|
| 1 dia | -5% XP | Missão de Resgate disponível por 4h |
| 2 dias seguidos | -15% XP + streak zerado | Sem resgate |
| 3 dias seguidos | -25% XP + streak zerado | Skill XP -1 nas skills das missões não feitas |
| 5+ dias seguidos | -40% XP + streak zerado | Debuff visual intenso por 48h + Iroh no modo severo |

**Observação:** O perk **Mente de Diamante** (Rank C) eleva o gatilho de 1 para 2 dias antes de aplicar qualquer penalidade.

### Missão de Resgate
Ao acordar depois de 1 dia faltoso, aparece notificação e card especial no topo das quests:

```
⚠️ MISSÃO DE RESGATE
O Sistema registrou sua falta ontem.
Complete até as [hora atual + 4h] para cancelar a penalidade.
[Versão mais difícil da quest que você falhou]
```

- Prazo: 4 horas a partir da abertura do app
- Se completar: penalidade cancelada, streak preservado
- Se não completar: -5% XP, streak zerado, sem segunda chance

### Mensagens do Iroh por Gravidade
| Gravidade | Mensagem do Iroh |
|-----------|-----------------|
| Resgate disponível | *"O Sistema viu sua falta. Mas toda queda tem uma chance de recuperação. Você tem 4 horas."* |
| 1 dia sem resgate | *"Penalidade registrada. Não é o fim — é um aviso."* |
| 2 dias seguidos | *"Dois dias. O Sistema perde a paciência."* |
| 3+ dias | *"Isso não é um acidente. Isso é uma escolha. O Sistema não perdoa escolhas."* |
| 5+ dias | *"☠️ PENALIDADE MÁXIMA APLICADA. Volte. Agora."* |

**Implementação:**
- Adicionar `gameState.consecutiveMisses` — contador de dias faltosos seguidos
- Modificar `loadGameData()` para calcular penalidade com base em `consecutiveMisses`
- Adicionar `gameState.rescueMissionActive` com timestamp de expiração
- Card de resgate renderizado no topo das dailies com countdown visual

---

## Ordem sugerida de implementação

1. **Item 7** — Curva de XP (base de tudo, afeta skills)
2. **Item 3** — Visuais do hexágono (impacto visual imediato, independente)
3. **Item 1** — Títulos de rank (simples, alto impacto visual)
4. **Item 8** — Streak com escudos e multiplicador
5. **Item 10** — Penalidade com profundidade
6. **Item 4** — Boss Quests
7. **Item 9** — Dungeons
8. **Item 5** — Sinergias de atributos
9. **Item 2** — Perks de rank
10. **Item 6** — Aba de Achievements (implementar por último — depende de tudo estar funcionando)

---

## Campos novos no gameState

```javascript
gameState = {
  // ... campos existentes ...

  // Item 2
  perks: [],                    // ex: ['foco_matinal', 'momentum']

  // Item 4
  bossQuest: null,              // { id, title, progress, target, expiresAt }

  // Item 6
  achievements: [],             // [{ id, unlockedAt }]

  // Item 8
  shields: 0,                   // 0-3
  consecutiveStreak7Days: 0,    // contador para ganho de escudos

  // Item 9
  activeDungeons: [],           // [{ id, progress, expiresAt, skills }]

  // Item 10
  consecutiveMisses: 0,
  rescueMission: null,          // { questId, expiresAt }
}
```
