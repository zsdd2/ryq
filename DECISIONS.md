# DECISIONS

**EN:** Lightweight architecture decision log for Renyiqian, including inherited Stickban decisions.
**PT-BR:** Registro leve de decisoes arquiteturais do Renyiqian, incluindo decisoes herdadas do Stickban.

## How to Read / Como Ler

**EN:** Each entry records context, the current decision, and the expected consequences. Status values are intentionally simple: `accepted` or `planned`.  
**PT-BR:** Cada entrada registra contexto, a decisao atual e as consequencias esperadas. Os status sao intencionalmente simples: `accepted` ou `planned`.

## D-001: Desktop Application Base

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The product is intended to stay visible on the desktop with optional always-on-top behavior.
  O produto foi concebido para permanecer visivel no desktop com comportamento always-on-top opcional.
- Decision / Decisao:
  Build Stickban as a desktop application using Electron.
  Construir o Stickban como uma aplicacao desktop usando Electron.
- Consequences / Consequencias:
  The project will need a main-process/renderer-process split and desktop packaging strategy.
  O projeto vai exigir separacao entre main process e renderer process, alem de estrategia de empacotamento desktop.

## D-002: Renderer Technology

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The UI needs fast iteration, rich interaction, and a maintainable typed frontend stack.
  A interface precisa de iteracao rapida, interacao rica e uma stack tipada de frontend que seja sustentavel.
- Decision / Decisao:
  Use React + TypeScript for the renderer layer.
  Usar React + TypeScript na camada de renderer.
- Consequences / Consequencias:
  Component structure, state typing, and renderer tooling should align with a React/TypeScript workflow.
  Estrutura de componentes, tipagem de estado e tooling do renderer devem seguir um fluxo React/TypeScript.

## D-003: Local Persistence Model

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The application is offline-first and must retain local state reliably.
  A aplicacao e offline-first e precisa reter o estado local com confiabilidade.
- Decision / Decisao:
  Use SQLite as the local persistence layer and treat it as the source of truth.
  Usar SQLite como camada de persistencia local e trata-lo como fonte de verdade.
- Consequences / Consequencias:
  Data writes should land locally first, and sync should propagate from local state rather than replace it.
  Gravacoes de dados devem ocorrer primeiro localmente, e a sincronizacao deve propagar o estado local em vez de substitui-lo.

## D-004: State Management and UI Utilities

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The product direction already defines the intended frontend stack for state, styling, and drag-and-drop interactions.
  A direcao do produto ja define a stack pretendida para estado, estilo e interacoes de drag and drop.
- Decision / Decisao:
  Use Zustand for state management, Tailwind CSS for styling, and renderer-managed drag and drop interactions.
  Usar Zustand para gerenciamento de estado, Tailwind CSS para estilos e interacoes de drag and drop gerenciadas no renderer.
- Consequences / Consequencias:
  Initial scaffold and component architecture should align with this local renderer-centric interaction model unless superseded by a newer recorded decision.
  O scaffold inicial e a arquitetura de componentes devem se alinhar a esse modelo de interacao centrado no renderer, salvo decisao posterior registrada.

## D-005: Sync Provider

- Date / Data: 2026-03-22
- Status: superseded
- Context / Contexto:
  The product specification calls for optional sync across devices without making cloud storage the primary system of record.
  A especificacao do produto pede sincronizacao opcional entre dispositivos sem transformar a nuvem no sistema primario de registro.
- Decision / Decisao:
  Use Google Drive AppDataFolder as the planned sync provider for a later phase, not for the initial local-first scaffold.
  Usar Google Drive AppDataFolder como provedor planejado de sincronizacao para uma fase posterior, nao para o scaffold inicial local-first.
- Consequences / Consequencias:
  Auth, background sync, and remote file lifecycle can be deferred until after the first local milestone is stable.
  Autenticacao, sincronizacao em background e ciclo de vida de arquivos remotos podem ser adiados ate que o primeiro milestone local esteja estavel.
  Superseded by D-013.
  Substituida por D-013.

## D-006: Sync Strategy

- Date / Data: 2026-03-22
- Status: superseded
- Context / Contexto:
  The project needs a simple first implementation path for synchronization.
  O projeto precisa de um primeiro caminho simples para implementacao da sincronizacao.
- Decision / Decisao:
  Adopt snapshot-based synchronization when remote sync is introduced, not in the initial scaffold.
  Adotar sincronizacao baseada em snapshot quando o sync remoto for introduzido, nao no scaffold inicial.
- Consequences / Consequencias:
  Sync logic can start simpler, but future evolution may require more advanced merge behavior.
  A logica de sync pode comecar mais simples, mas evolucoes futuras podem exigir merge mais avancado.
  Superseded by D-013.
  Substituida por D-013.

## D-007: Conflict Resolution

- Date / Data: 2026-03-22
- Status: superseded
- Context / Contexto:
  The MVP needs a deterministic conflict policy that is cheap to implement.
  O MVP precisa de uma politica deterministica de conflitos que seja barata de implementar.
- Decision / Decisao:
  Use last-write-wins as the initial remote conflict resolution strategy when sync is added later.
  Usar last-write-wins como estrategia inicial de resolucao de conflitos remotos quando o sync for adicionado depois.
- Consequences / Consequencias:
  Conflict handling stays simple in early versions, but edge cases may later justify a stronger model.
  O tratamento de conflitos permanece simples nas versoes iniciais, mas casos limite podem justificar um modelo mais robusto no futuro.
  Superseded by D-013.
  Substituida por D-013.

## D-008: AI-Assisted Development Default

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The repository was conceived from the start to be developed with AI-assisted tools, and the maintainer prefers to preserve that workflow as the default operating model.
  O repositorio foi concebido desde o inicio para ser desenvolvido com ferramentas assistidas por IA, e o mantenedor prefere preservar esse fluxo como modelo operacional padrao.
- Decision / Decisao:
  Adopt AI-assisted development by default, using tools such as Codex, Claude, Antigravity, and equivalent systems as the preferred implementation path, while allowing manual code changes when they are the better fit for a task.
  Adotar desenvolvimento assistido por IA como padrao, usando ferramentas como Codex, Claude, Antigravity e sistemas equivalentes como caminho preferencial de implementacao, permitindo alteracoes manuais no codigo quando elas forem a melhor opcao para uma tarefa.
- Consequences / Consequencias:
  Repository documentation and workflow guidance should remain agent-friendly, and changes to process, governance, or collaboration expectations should keep this AI-first model explicit.
  A documentacao do repositorio e as orientacoes de workflow devem continuar amigaveis para agentes, e mudancas de processo, governanca ou expectativas de colaboracao devem manter esse modelo AI-first explicito.

## D-009: Initial Scaffold Scope

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The project should be implementable locally without paid services, subscriptions, cloud infrastructure, or unnecessary early complexity.
  O projeto deve ser implementavel localmente sem servicos pagos, assinaturas, infraestrutura cloud ou complexidade prematura desnecessaria.
- Decision / Decisao:
  Keep the initial scaffold focused on Electron, React + TypeScript, local SQLite via `better-sqlite3`, Zustand, Tailwind CSS, and renderer-managed drag interactions, with a fully local workspace, persisted boards, board-specific columns, drag and drop, SQLite persistence, and always-on-top behavior. Exclude provider APIs, OAuth, and managed remote infrastructure from the first milestone.
  Manter o scaffold inicial focado em Electron, React + TypeScript, SQLite local via `better-sqlite3`, Zustand, Tailwind CSS e interacoes de drag gerenciadas no renderer, com um workspace totalmente local, quadros persistidos, colunas especificas por quadro, drag and drop, persistencia em SQLite e comportamento always-on-top. Deixar APIs de provedores, OAuth e infraestrutura remota gerenciada fora do primeiro milestone.
- Consequences / Consequencias:
  The first implementation milestone remains local-only and cost-free to develop and run, while remote synchronization stays as a later phase capability.
  O primeiro milestone de implementacao permanece apenas local e sem custo para desenvolver e executar, enquanto a sincronizacao remota permanece como capability de fase posterior.

## D-010: Automatic Release and Versioning Strategy

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  Pushes to `main` should produce consistent releases and version numbers without manual release bookkeeping or extra version bump commits.
  Pushes para `main` devem produzir releases e numeros de versao consistentes sem controle manual de release ou commits extras apenas para bump de versao.
- Decision / Decisao:
  Use automatic GitHub Releases on every push to `main`, calculating the next SemVer version from commit conventions since the latest tag. Treat `feat` as minor, operational and fix-style commits as patch, and `BREAKING CHANGE` or `type!` as major. Publish only a Windows NSIS installer in the public release workflow for now, while keeping Linux packaging available for local builds.
  Usar GitHub Releases automaticas a cada push para `main`, calculando a proxima versao SemVer a partir das commit conventions desde a ultima tag. Tratar `feat` como minor, commits operacionais e corretivos como patch, e `BREAKING CHANGE` ou `type!` como major. Publicar por enquanto apenas instalador NSIS de Windows no workflow publico de release, mantendo o empacotamento Linux disponivel para builds locais.
- Consequences / Consequencias:
  Commit conventions become part of release semantics, and every change merged into `main` influences automated versioning and public Windows distribution artifacts. If Linux artifacts should return to GitHub Releases later, that workflow choice should be revisited explicitly.
  As commit conventions passam a fazer parte da semantica de release, e toda mudanca incorporada em `main` influencia o versionamento automatico e os artefatos publicos de distribuicao para Windows. Se artefatos Linux voltarem para as GitHub Releases depois, essa escolha de workflow deve ser revisitada explicitamente.

## D-011: Public Landing Page Deployment

- Date / Data: 2026-03-22
- Status: accepted
- Context / Contexto:
  The project needs a public-facing landing page that can be published automatically without coupling the site build to the desktop application release pipeline.
  O projeto precisa de uma landing page publica que possa ser publicada automaticamente sem acoplar o build do site ao pipeline de release da aplicacao desktop.
- Decision / Decisao:
  Maintain the landing page inside the same repository under `site/`, publish it through a dedicated GitHub Pages workflow, and keep the public site deployment independent from the desktop release pipeline. The current Renyiqian repository is `zsdd2/ryq`.
  Manter a landing page no mesmo repositorio em `site/`, publica-la por um workflow dedicado de GitHub Pages e manter o deploy do site publico independente do pipeline de release desktop. O repositorio atual do Renyiqian e `zsdd2/ryq`.
- Consequences / Consequencias:
  The desktop app and public site can evolve independently, and forks can still build the landing locally.
  O app desktop e o site publico podem evoluir de forma independente, e forks continuam podendo buildar a landing localmente.

## D-012: Local Workspace Model

- Date / Data: 2026-03-23
- Status: superseded
- Context / Contexto:
  The updated interaction model now includes multiple boards, and the application needs to persist board navigation and board-specific structure without introducing sync or cloud dependencies.
  O modelo de interacao atualizado agora inclui multiplos quadros, e a aplicacao precisa persistir a navegacao entre quadros e a estrutura especifica de cada quadro sem introduzir sync ou dependencias cloud.
- Decision / Decisao:
  Treat Stickban as a local workspace made of multiple persisted boards. Persist the active board selection in local app state, and make columns board-specific and customizable from this milestone onward.
  Tratar o Stickban como um workspace local composto por multiplos quadros persistidos. Persistir a selecao do quadro ativo em estado local da aplicacao e tornar as colunas especificas por quadro e customizaveis a partir deste milestone.
- Consequences / Consequencias:
  The SQLite layer, IPC, preload API, renderer store, and header navigation all become workspace-aware. Multiple boards are no longer a later roadmap item, while remote sync still remains a separate future capability.
  A camada SQLite, o IPC, a API do preload, o store do renderer e a navegacao do cabecalho passam a conhecer o workspace. Multiplos quadros deixam de ser item de roadmap posterior, enquanto o sync remoto continua sendo uma capability futura separada.

## D-013: Synced Folder Cloud Sync

- Date / Data: 2026-03-25
- Status: superseded
- Context / Contexto:
  The repository now ships a real cloud sync implementation, and the earlier Google Drive AppDataFolder plan no longer matches the delivered architecture.
  O repositorio agora entrega uma implementacao real de sync em nuvem, e o plano anterior de Google Drive AppDataFolder nao corresponde mais a arquitetura entregue.
- Decision / Decisao:
  Use a user-selected synced folder as the cloud propagation layer. Keep SQLite as the local operational source of truth, replicate immutable operation files between devices, and use periodic checkpoints only for recovery and faster bootstrap.
  Usar uma pasta sincronizada escolhida pelo usuario como camada de propagacao em nuvem. Manter o SQLite como fonte operacional local de verdade, replicar arquivos imutaveis de operacoes entre dispositivos e usar checkpoints periodicos apenas para recuperacao e bootstrap mais rapido.
- Consequences / Consequencias:
  At the time of this decision, the product no longer depended on Google Drive APIs or OAuth. Sync correctness depended on operation-log replay, tombstones, and checkpoint recovery instead of a single shared snapshot file.
  Na epoca desta decisao, o produto deixou de depender de APIs do Google Drive ou OAuth. A corretude do sync dependia de replay do log de operacoes, tombstones e recuperacao por checkpoints, em vez de um unico arquivo de snapshot compartilhado.
  Remote bootstrap into an already populated synced folder must import and validate remote state before any local export or checkpoint write is allowed, and invalid checkpoints or orphan remote operations must be rejected instead of becoming the new canonical state.
  O bootstrap remoto em uma pasta sincronizada ja populada deve importar e validar o estado remoto antes de permitir qualquer export local ou escrita de checkpoint, e checkpoints invalidos ou operacoes remotas orfas devem ser rejeitados em vez de virarem o novo estado canonico.
  Deferred remote operations caused by missing local dependencies must remain retryable instead of being recorded as consumed, and destructive remote-adoption flows must create a local recovery backup before replacing the active workspace.
  Operacoes remotas adiadas por dependencias locais ausentes devem continuar reprocessaveis em vez de serem registradas como consumidas, e fluxos destrutivos de adocao do remoto devem criar um backup local de recovery antes de substituir o workspace ativo.
  Superseded for the active Renyiqian runtime by D-015.
  Substituida para o runtime ativo do Renyiqian pela D-015.

## D-014: Windows Auto-update via GitHub Releases

- Date / Data: 2026-03-25
- Status: accepted
- Context / Contexto:
  The repository already builds Windows NSIS installers and publishes them through GitHub Releases, but packaged users still need a manual path to discover and install newer versions.
  O repositorio ja gera instaladores NSIS para Windows e os publica via GitHub Releases, mas usuarios empacotados ainda precisam de um caminho manual para descobrir e instalar versoes novas.
- Decision / Decisao:
  Use `electron-updater` with the GitHub provider for packaged Windows builds only. The app should check for updates on startup and periodically during the session, download updates in the background, and offer restart-to-install once the package is ready, without relaunching automatically after install.
  Usar `electron-updater` com provider GitHub apenas para builds empacotadas de Windows. O app deve verificar atualizacoes no startup e periodicamente durante a sessao, baixar updates em background e oferecer reinicio para instalar quando o pacote estiver pronto, sem reabrir automaticamente depois da instalacao.
- Consequences / Consequencias:
  The release workflow must publish updater metadata alongside the Windows installer, the main process needs a dedicated update service and IPC surface, and the renderer must expose update status without mixing it with sync semantics. Development builds and non-Windows packages stay outside the automatic update flow.
  O workflow de release passa a publicar metadata do updater junto com o instalador de Windows, o main process precisa de um servico dedicado de update e superficie IPC, e o renderer deve expor o estado de update sem misturar isso com a semantica de sync. Builds de desenvolvimento e pacotes fora de Windows ficam fora do fluxo automatico de update.

## D-015: Renyiqian Local Floating Notes Runtime

- Date / Data: 2026-06-16
- Status: accepted
- Context / Contexto:
  The repository has evolved from the original Stickban Kanban product into the Renyiqian floating-note fork. The active main process no longer constructs the synced-folder `SyncManager`; sync IPC is currently served by local-only compatibility handlers.
  O repositorio evoluiu do produto Kanban Stickban original para o fork Renyiqian de notas flutuantes. O main process ativo nao instancia mais o `SyncManager` de pasta sincronizada; o IPC de sync atualmente responde por handlers locais de compatibilidade.
- Decision / Decisao:
  Treat the current Renyiqian runtime as a local-only single-machine floating note app. The synced-folder sync implementation and sync-risk tests have been removed; only local-only sync compatibility IPC remains. Restoring sync requires a new product decision and implementation plan.
  Tratar o runtime atual do Renyiqian como um app local-only de notas flutuantes para uma unica maquina. A implementacao de sync por pasta sincronizada e os testes sync-risk foram removidos; resta apenas IPC de compatibilidade local-only. Restaurar sync exige uma nova decisao de produto e plano de implementacao.
- Consequences / Consequencias:
  Public documentation, the landing page, roadmap, and agent guidance must not describe synced-folder cloud sync as an active capability. New work should prioritize local note correctness, reminder reliability, safe rich HTML rendering, local data durability, and packaged Windows update behavior.
  A documentacao publica, a landing page, o roadmap e as orientacoes para agentes nao devem descrever sync em nuvem por pasta sincronizada como capability ativa. Novo trabalho deve priorizar corretude das notas locais, confiabilidade dos lembretes, renderizacao segura de HTML rico, durabilidade dos dados locais e comportamento de atualizacao no Windows empacotado.

## Notes / Notas

**EN:** Entries marked as `planned` reflect current intended direction from the specification and should be validated during implementation.  
**PT-BR:** Entradas marcadas como `planned` refletem a direcao pretendida atual da especificacao e devem ser validadas durante a implementacao.
