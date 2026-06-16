# 任意签 / Renyiqian

Um app desktop compacto de notas flutuantes, local-first, para notas pessoais sempre visiveis.

Versao em ingles: [`README.md`](./README.md).

## Visao geral

Renyiqian e um app desktop Electron local-first. Ele abre como um pequeno launcher flutuante e expande para um painel compacto de notas com captura rapida, grupos, texto rico, modelos, busca, temporizadores, lembretes e verificacao de atualizacoes no Windows.

Este fork comecou a partir da base Stickban, mas o runtime ativo nao e mais um produto Kanban nem um produto de sync em nuvem. Nomes internos como boards/cards ainda existem como camada de compatibilidade enquanto o app se comporta como notas locais agrupadas.

## Estado atual

O app executavel atual inclui:

- Launcher flutuante apenas com logo e painel compacto always-on-top
- Notas locais agrupadas com SQLite
- Edicao rica de notas e preview em cards
- Modelos de tabela e modelos de gerenciamento de contas/assinaturas
- Busca global em todos os grupos locais
- Temporizadores por nota, atalhos de contagem regressiva, confirmacao de lembrete e edicao de cota
- Ordenacao por arraste dentro de secoes fixadas e nao fixadas
- Preferencia opcional de iniciar com o Windows, desativada por padrao
- Caminho estavel de dados no Windows empacotado: `%APPDATA%/renyiqian/data/renyiqian.db`
- Verificacao de atualizacoes no Windows via GitHub Releases e `electron-updater`

O main process ativo expoe chamadas IPC de sync apenas como respostas locais de compatibilidade. A implementacao antiga de sync por pasta sincronizada e os testes sync-risk foram removidos; restaurar sync exige uma nova decisao de produto e um plano de implementacao novo.

## Direcao do produto

- Fluxo local-only em uma unica maquina por padrao
- Acesso rapido como acessorio flutuante de desktop
- SQLite como fonte local de verdade
- Sem contas, APIs de provedores, OAuth, servicos pagos ou infraestrutura cloud gerenciada na linha atual do produto
- Sync opcional ou suporte multi-dispositivo somente depois de uma decisao explicita de escopo

## Stack tecnico

- Electron
- React + TypeScript
- SQLite via `better-sqlite3`
- Tailwind CSS
- dnd-kit para interacoes de arraste no renderer
- electron-builder e electron-updater para empacotamento/atualizacao no Windows

## Desenvolvimento local

Pre-requisitos:

- Node.js 20 e recomendado neste checkout porque a toolchain local ja foi validada com `better-sqlite3`
- npm

Setup recomendado no Windows:

```powershell
$root = (Resolve-Path .).Path
$env:PATH = (Join-Path $root '.tools\node-v20.20.2-win-x64') + ';' + $env:PATH
$env:LOCALAPPDATA = (Join-Path $root '.localappdata')
```

Comandos:

```bash
npm install
npm test
npm run dev
npm run build
npm run dist:win
npm run site:build
```

## Caminho dos dados locais

O build desktop atual do Renyiqian persiste seu SQLite local em:

```text
<userData>/data/renyiqian.db
```

Locais comuns:

- App empacotado no Windows: `%APPDATA%/renyiqian/data/renyiqian.db`
- Builds antigas no Windows podem ter usado `%APPDATA%/任意签/data/renyiqian.db` ou `%APPDATA%/Stickban/data/stickban.db`; a migracao de startup copia esses bancos para o diretorio canonico `renyiqian` quando o novo diretorio ainda nao tem notas do usuario.
- App empacotado no Linux: `~/.config/renyiqian/data/renyiqian.db`

## Estrutura do repositorio

A implementacao atual vive principalmente em:

- `src/main/`: main process Electron, SQLite, janelas, atualizacao e codigo legado de sync
- `src/preload/`: ponte IPC segura para o renderer
- `src/renderer/`: UI React das notas flutuantes
- `src/shared/`: tipos compartilhados de IPC/dados
- `site/`: landing page publica

## Roadmap resumido

Veja [`ROADMAP.md`](./ROADMAP.md) para o plano detalhado.

- Atual: notas flutuantes locais, persistencia SQLite agrupada, edicao rica, modelos, busca, temporizadores, lembretes, preferencia de startup no Windows e atualizacoes empacotadas no Windows
- Proximo: reparos guiados por auditoria, incluindo lembretes fora do grupo ativo, sanitizacao de HTML rico, consistencia de docs/runtime, limpeza de codigo legado, investigacao do warning de shutdown dos testes e smoke test real da UI
- Futuro: tray, temas, export/import, recuperacao local de backup e somente escopos de sync/app companheiro explicitamente aprovados

## Releases

- Pushes em `main` devem gerar GitHub Releases automaticas
- O versionamento segue convencoes de commit desde a ultima tag SemVer
- Artefatos publicos sao produzidos atualmente apenas para Windows
- Releases de Windows usam instalador NSIS
- Builds empacotadas de Windows verificam GitHub Releases dentro do app e podem reiniciar para instalar uma atualizacao baixada

## Desenvolvimento assistido por IA

Este repositorio e mantido com ferramentas assistidas por IA, incluindo Codex, Claude, Antigravity e sistemas similares. A preferencia de manutencao e usar ferramentas capazes de IA como fluxo principal, sem impedir edicoes manuais diretas quando forem a melhor opcao.

## Licenca

Este repositorio inclui uma licenca MIT em [`LICENSE`](./LICENSE).
