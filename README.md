# SouFIT Finanças

Projeto completo com React + Vite + TypeScript, UI Material UI, Dexie (IndexedDB), react-hook-form + zod, gráficos com Chart.js e navegação responsiva (drawer lateral + bottom nav). Controle total de receitas, despesas, poupança e relatórios com persistência totalmente local.

## Começar

```bash
npm install
npm run dev    # roda em http://localhost:5173
npm run build  # verifica o bundle otimizado
```

## O que está pronto

- Autenticação local com hashing via `bcryptjs`, sessão no localStorage + IndexedDB (users, settings).
- Layout com `AppShell`: drawer permanente (desktop), drawer temporário + bottom nav (mobile), topbar com seletor de tema/cor e botão "Adicionar" para lançar transações rápidas.
- Dashboard com cards de receitas/despesas/saldo/poupança, filtros de mês/ano, gráficos de linha, rosca e barras usando Chart.js (react-chartjs-2).
- CRUD de transações com filtros (data, categoria, tipo, busca), export/import CSV, confirmação de exclusão e dialog de adição rápida.
- Módulo de poupança com criação de objetivos, plano mensal automático, registro de depósitos e gráfico comparando planejado vs realizado.
- Relatórios anuais com seleção de ano/mês, top 10 despesas, taxa de poupança, análise essencial vs supérfluo, maior categoria de gasto e mês mais caro.
- Perfil com edição de nome/tema/moeda/cor principal, marcação de categorias essenciais, geração de dados demo e botão "Resetar dados locais".
- Infraestrutura: Dexie schema para todos os modelos (`User`, `Transaction`, `Category`, `SavingGoal`, `SavingEntry`, `Setting`), serviços reutilizáveis e hooks (`useAuth`, `ThemeProvider`), error boundary, loading fallback, snackbar feedback.

## Dados e persistência

- Todos os dados ficam no IndexedDB via Dexie. As tabelas principais estão em `src/db/index.ts`.
- `settings` guarda modo de tema, cor primária, moeda padrão e categorias essenciais por usuário.
- Sessão é mantida no `localStorage` (current user + token) para manter a navegação protegida.
- As transações e objetivos podem ser resetados diretamente pelo botão `Resetar dados` na página de perfil, que limpa todas as tabelas do usuário e refaz as categorias padrão.
- Também existe o botão `Gerar dados demo` no perfil para popular a base com transações básicas + objetivo de poupança.

## Estrutura e scripts

- `src/pages`: telas de login/register e todas as rotas protegidas (`dashboard`, `transactions`, `savings`, `reports`, `profile`).
- `src/components`: AppShell, drawer, bottom nav, dialog de transação, cards, error boundary, loaders.
- `src/services`: Dexie helpers, auth, transactions, categories, savings, relatórios, seed/reset utilities.
- `src/hooks`: `useAuth` (contexto + atualizações de perfil/settings).
- `src/theme`: ThemeProvider com paleta personalizável e modo claro/escuro.
- `src/utils`: helpers de formatação e registro de Chart.js.

## Próximos passos sugeridos

1. Orçamento por categoria com avisos visuais se o limite mensal for excedido.
2. Metas de gasto por projeto/categoria com progressos e lembretes.
3. Notificações locais para lembrar de lançar gastos ou depósitos (usar serviço de alertas do browser).
4. Recorrências reais—lançar despesas fixas automaticamente todo início de mês.
5. Modo casal/família com múltiplos perfis por usuário ou grupos locais.
6. Anexar comprovantes (base64 ou File System Access) às transações.
7. Tela de insights com padrões automáticos (ex.: alimentação subiu X% vs mês passado).
8. Backup/restore completo via exportação/importação de JSON.

## Observações

- A estilização é mobile-first e responsiva; as páginas evitam “tela branca” graças aos componentes de carregamento e messages.
- As rotas `/app/*` são protegidas e redirecionam para `/login` quando não há sessão.
- Para explorar o banco e limpeza manual, use os helpers em `src/services/seedService.ts` e `dexie` devtools no navegador.
