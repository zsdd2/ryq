# Stickban

Um quadro Kanban persistente que fica visivel na sua area de trabalho.

For the English version, see [`README.md`](./README.md).

## Visao Geral

Stickban e um aplicativo desktop de Kanban focado em velocidade, baixo atrito e visibilidade constante. A direcao do produto e offline-first, com persistencia local como fonte primaria de dados e sincronizacao opcional em nuvem entre dispositivos.

## Estado Atual

Este repositorio esta em fase de bootstrap. A especificacao do produto existe em [`SPEC.md`](./SPEC.md), e o primeiro scaffold executavel da aplicacao agora ja existe.

A documentacao deste repositorio serve para estabelecer direcao enquanto a implementacao ainda amadurece.
O milestone executavel atual continua local-first, mas agora tambem inclui sync em nuvem via pasta sincronizada escolhida pelo usuario. O app atual cobre multiplos quadros locais, colunas especificas por quadro, reordenacao e movimento de colunas entre quadros, persistencia em SQLite, drag and drop, always-on-top, uma opcao de iniciar com o login do Windows que permanece desativada por padrao, um fluxo de startup que prioriza mostrar a janela local antes de concluir trabalho de background de sync e update, protecao de instancia unica para evitar janelas duplicadas durante startup ou reabertura, limpeza de entradas duplicadas de inicializacao no Windows, arquivos imutaveis de operacoes de sync, checkpoints periodicos, protecoes no bootstrap inicial do sync, validacao estrutural de checkpoints, reprocessamento de operacoes remotas fora de ordem com dependencias ausentes, backups locais de recovery antes de adocoes remotas destrutivas e rejeicao de operacoes remotas orfas que corromperiam o workspace.

## Direcao do Produto

- Fluxo de Kanban orientado a desktop
- Comportamento de widget fixo, com modo always-on-top opcional
- Experiencia leve e rapida
- Arquitetura offline-first
- Persistencia local em SQLite
- Sincronizacao opcional em nuvem via pasta sincronizada gerenciada pelo usuario

## Stack Planejada

- Electron
- React + TypeScript
- SQLite via `better-sqlite3`
- Zustand para gerenciamento de estado
- Tailwind CSS
- Interacoes de drag and drop gerenciadas no renderer

## Recorte Inicial de Implementacao

- Manter o stack desktop local: Electron, React + TypeScript, `better-sqlite3`, Zustand, Tailwind CSS e interacoes de drag and drop gerenciadas no renderer
- Manter o SQLite como fonte operacional de verdade enquanto o sync propaga arquivos imutaveis de operacoes e checkpoints periodicos por uma pasta sincronizada
- Evitar APIs de provedores, OAuth e infraestrutura cloud gerenciada
- Focar o milestone atual em um workspace local-first com multiplos quadros, colunas especificas por quadro, rename inline de colunas, drag and drop de colunas, persistencia em SQLite, always-on-top, inicio opcional com o login do Windows, startup priorizando a visibilidade da janela local antes do trabalho de background, e sync em pasta sincronizada

## Desenvolvimento Local

Pre-requisitos:

- Node.js 18+ recomendado
- npm

Comandos:

```bash
npm install
npm test
npm run dev
npm run site:build
```

Se voce estiver rodando como `root` em WSL/Linux, use:

```bash
npm run dev:root
```

Build de producao:

```bash
npm run build
npm run dist
```

Para abrir o app buildado como `root`:

```bash
npm run start:root
```

Script de conveniencia para atualizar o repositorio local:

```bash
./update-local-main.sh
```

Argumentos opcionais:

```bash
./update-local-main.sh origin main
```

O script faz fetch do remoto e atualiza com fast-forward only, mas se recusa a rodar quando o working tree esta sujo.

## Localizacao dos Dados Locais

A build desktop atual do Renyiqian persiste seu banco SQLite local em:

```text
<userData>/data/renyiqian.db
```

Locais tipicos:

- App empacotado no Windows: `%APPDATA%/renyiqian/data/renyiqian.db`
- Builds antigas no Windows podem ter usado `%APPDATA%/任意签/data/renyiqian.db` ou `%APPDATA%/Stickban/data/stickban.db`; a migracao de startup copia esses bancos para o diretorio canonico `renyiqian` quando o novo diretorio ainda nao tem notas do usuario.
- App empacotado no Linux: `~/.config/renyiqian/data/renyiqian.db`
- Execucoes de desenvolvimento no Linux ainda podem usar um diretorio de user-data do Electron.

O caminho empacotado no Windows e mantido estavel entre reinstalacoes e atualizacoes para evitar perda aparente de notas quando o nome visivel do produto muda.

## Principios Centrais

- Dados locais sao a fonte de verdade
- Interacoes da interface devem permanecer responsivas
- A sincronizacao nao deve bloquear a interface
- Dados locais nao podem ser perdidos por falhas de sincronizacao
- Desenvolvimento assistido por IA e o fluxo padrao, com edicoes manuais permitidas quando fizer sentido
- Mudancas arquiteturais devem permanecer alinhadas com [`SPEC.md`](./SPEC.md) e [`DECISIONS.md`](./DECISIONS.md)

## Estrutura Planejada do Projeto

A estrutura abaixo esta planejada, mas ainda nao foi implementada.

```text
/app
  /main
  /renderer
  /db
  /services
    /sync
    /syncFolder
  /models
  /store
  /components
  /hooks
  /utils
```

## Resumo do Roadmap

Para o roadmap detalhado, veja [`ROADMAP.md`](./ROADMAP.md).

- Atual: workspace local, multiplos quadros, colunas customizaveis, drag and drop de colunas, persistencia em SQLite, always-on-top, inicio opcional com o login do Windows e sync em pasta sincronizada
- Proxima fase: interface multi idiomas, system tray, temas e hardening do sync
- Futuro: campos customizados, notificacoes, inspecao mais rica de conflitos e recuperacao, app mobile complementar

## Documentos do Repositorio

- [`README.md`](./README.md): versao em ingles deste README
- [`SPEC.md`](./SPEC.md): especificacao do produto
- [`ROADMAP.md`](./ROADMAP.md): marcos planejados e prioridades futuras
- [`IMPLEMENTATION.md`](./IMPLEMENTATION.md): estado atual do repositorio e marcos entregues
- [`AGENTS.md`](./AGENTS.md): guia operacional para agentes de programacao
- [`DECISIONS.md`](./DECISIONS.md): registro de decisoes arquiteturais

## Landing Page

- O projeto inclui uma landing page publica buildada a partir de [`site/`](./site)
- A landing page foi pensada para publicacao no GitHub Pages
- O dominio publico canonico e `stickban.com`
- Forks podem buildar o site, mas a publicacao automatica no Pages fica restrita ao repositorio oficial

## Releases

- Cada push para `main` deve gerar uma GitHub Release automatica
- A versao da release e calculada a partir das commit conventions desde a ultima tag SemVer
- `feat` sobe minor, `fix` e tipos operacionais sobem patch, e `BREAKING CHANGE` ou `type!` sobem major
- Artefatos publicos de release sao gerados atualmente apenas para Windows
- As releases de Windows sao distribuidas como instalador NSIS
- Builds empacotadas de Windows expoem uma configuracao opt-in para iniciar com o login do usuario, e ela permanece desativada por padrao
- Builds empacotadas de Windows agora verificam atualizacoes em GitHub Releases dentro do app e podem reiniciar para instalar um update baixado
- O instalador e o updater in-app mantem desativada por padrao a reabertura automatica do app depois da instalacao/update
- O empacotamento para Linux continua disponivel localmente, mas artefatos Linux nao sao publicados nas GitHub Releases neste momento
- A landing page publica e publicada separadamente do pipeline de release do app desktop

## Desenvolvimento Assistido por IA

O Stickban foi concebido desde o inicio como um projeto desenvolvido com ferramentas assistidas por IA, incluindo ferramentas como Codex, Claude, Antigravity e sistemas equivalentes. O modelo preferencial de manutencao deste repositorio e continuar usando ferramentas de desenvolvimento com IA como fluxo principal, sem impedir edicoes manuais diretas quando elas forem a melhor opcao para uma tarefa.

## Nota de Transparencia

Este repositorio pode conter codigo, documentacao e estrutura de projeto criados ou refinados com assistencia de IA e revisao humana. O uso de IA nao elimina a necessidade de validacao tecnica. O projeto nao oferece qualquer garantia adicional alem dos termos ja definidos em [`LICENSE`](./LICENSE), e a revisao independente continua recomendavel para usos comerciais, regulados ou de maior risco.

## Como Comecar Hoje

O repositorio agora contem um scaffold executavel local-first em Electron/React/TypeScript para o primeiro milestone.
O estado atual do repositorio esta documentado em [`IMPLEMENTATION.md`](./IMPLEMENTATION.md).
O modelo atual de sync funciona sem servicos pagos, APIs de provedores, OAuth ou infraestrutura cloud gerenciada. Ele depende de uma pasta ja sincronizada pelo cliente de nuvem instalado pelo usuario.
O repositorio agora tambem inclui uma suite automatizada de regressao focada em bootstrap do sync, operacoes remotas adiadas, backups de recovery, flush no encerramento e refresh imediato do workspace apos a escolha da pasta sincronizada.
O rodape do app exibe a versao de runtime exposta pelo Electron, pensada para coincidir com a versao injetada nas releases empacotadas pelo workflow de GitHub Actions.
Builds empacotadas de Windows agora tambem verificam atualizacoes em GitHub Releases no startup e periodicamente durante a sessao, e o renderer deixa essas checagens mais visiveis com texto no rodape e banners de update.
O painel de sync/status agora tambem expoe um toggle opt-in para iniciar com o login do Windows, persistido localmente, desativado por padrao, e que passa a diferenciar quando a entrada foi registrada pelo app, mas ficou desabilitada nas configuracoes de inicializacao do proprio Windows. O startup desktop agora prioriza colocar a janela local na tela antes de continuar servicos de sync e update em background, o Stickban passa a manter apenas uma instancia ativa ao focar a janela existente quando uma segunda abertura e tentada, e as builds empacotadas de Windows limpam entradas duplicadas antigas de inicializacao antes de reaplicar a preferencia atual.

## Licenca

Este repositorio inclui a licenca MIT em [`LICENSE`](./LICENSE).
