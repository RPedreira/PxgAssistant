# PXG Assistant

Pokedex e acompanhamento da **Joey Quest** do PokeXGames.

-   **Joey Quest**: uma tela só com os 10 clãs, o progresso de cada um e o filtro _Todos / Faltam / Capturados_. Também filtra por dificuldade, tipo e nome. Pokémons que aparecem em mais de um clã (ex.: Dwebble em Naturia e Orebound) aparecem uma única vez e contam para todos os clãs dele.
-   **Pokedex**: todos os pokémons, com filtros por tipo e capturados, mais o **filtro de combate**: "fraco contra" ou "resiste a" vários tipos, combinados com **E** (todos ao mesmo tempo, para hunts em dupla, ex.: fraco contra Planta E Fantasma) ou **OU** (pelo menos um, ex.: fraco contra Planta OU Inseto). Os pokémons da Joey Quest têm um trevo no canto do card (clã e dificuldade ficam só na tela da quest). Clicar num pokémon abre a tabela completa de efetividade.
-   **Versões alternativas**: 413 versões vindas da wiki do PXG, cada uma com tipos, fraquezas e miniatura próprias: 227 shiny, 25 regionais (Alolan Marowak), 38 especiais (Big Onix, Crystal Onix, Rotom Fire…), 61 megas e 62 TM/TR. Elas aparecem logo depois da forma base, com um selo no card (✦ shiny, M mega, TM/TR). O detalhe tem a faixa "Outras versões" para alternar entre elas, e o filtro **Versão** separa normais, alternativas ou um tipo de versão. Megas e TM/TR são forjados: aparecem na Pokedex, mas não podem ser marcados como capturados. Shinies e outras versões não contam para a Joey Quest.
-   Marcar uma captura (o círculo no canto do card) vale para as duas telas. O progresso atualiza na hora e dá para desfazer pelo aviso.
-   Os filtros ficam na URL, então dá para salvar um favorito como `/joey-quest?clan=NATURIA`.

## Estrutura

| Pasta           | O que é                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------- |
| `apps/backend`  | API Fastify (porta 8200), rotas em `/api`                                                |
| `apps/frontend` | Angular 19 (porta 4200), com proxy de `/api` para o backend                              |
| `libs/shared`   | Tipos (contrato front/back), lista oficial da Joey Quest, filtros e cálculo de progresso |
| `libs/database` | Conexão, schemas e models do Mongoose                                                    |
| `apps/desktop`  | App desktop (Electron) que empacota backend + frontend num .exe                          |
| `tools/scripts` | Seed do banco e importação de sprites                                                    |

## Como rodar

Pré-requisitos: Node 18+ e MongoDB local. Crie um arquivo `.env` na raiz:

```
MONGODB_URI=mongodb://localhost:27017/PokeXGames
```

```sh
npm install
npm run db:seed   # aplica a Joey Quest, os dados da wiki e os índices (idempotente, não mexe nas capturas)
npm run dev       # backend + frontend -> http://localhost:4200
```

Outros comandos:

```sh
npm test                                   # testes de shared, backend e frontend
npm run build                              # build de produção
npm run sprites:import -- "C:/pasta/Icons" # (re)importa sprites para apps/frontend/public/sprites
npm run wiki:import                        # relê a wiki do PXG (tools/data/pxg-wiki.json + relatório); depois rode db:seed
```

## App desktop (.exe)

```sh
npm run desktop:dist   # gera dist/desktop/PXG Assistant Setup 1.0.0.exe
npm run desktop        # abre o app desktop sem gerar o instalador
```

O instalador cria atalhos na Área de Trabalho e no Menu Iniciar. O app sobe a API e as telas dentro do próprio Electron, numa porta local livre. Não é preciso ter o Node instalado nem rodar `npm run dev`.

-   **MongoDB**: precisa estar rodando. O endereço padrão é `mongodb://127.0.0.1:27017/PokeXGames`. Para mudar, edite `%APPDATA%\PXG Assistant\config.json`, que é criado na primeira execução. Se não conseguir conectar, o app mostra um aviso com o caminho desse arquivo.
-   **Ícone**: `apps/desktop/assets/icon.ico`, gerado do sprite do trevo com `npm run desktop:icon` (precisa de Python com Pillow).
-   **Estrutura**: `apps/desktop/src/main.ts` é o processo do Electron. O servidor vem de `apps/backend/src/server.ts`. `tools/desktop/build.mjs` junta tudo em `dist/apps/desktop`.

## API

| Método | Rota                    | Descrição                                                                                                                                                                                        |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET    | `/api/pokemons`         | Lista. Filtros opcionais: `search`, `types=FIRE,FLYING`, `weakTo=GRASS,GHOST` ou `resists=...` (um dos dois), `match=and\|or` (padrão `and`), `caught`, `joeyQuest`, `clan`, `sort=number\|name` |
| GET    | `/api/pokemons/:name`   | Detalhe                                                                                                                                                                                          |
| PATCH  | `/api/pokemons/:name`   | `{ "caught": true }` marca ou desmarca a captura                                                                                                                                                 |
| GET    | `/api/joey-quest`       | Clãs com progresso, recompensas e pokémons                                                                                                                                                       |
| GET    | `/api/joey-quest/:clan` | Um clã                                                                                                                                                                                           |

## Dados

-   `pokemons`: o campo `caught` é a **única** fonte da verdade do progresso. "Clã completo" é sempre calculado a partir dele.
-   `joeyquests`: um documento por clã (ovo, essência, ordem).
-   **Wiki do PXG** (`npm run wiki:import`): o importador lê `wiki.pokexgames.com` pela API, só leitura e com pausas entre as requisições. Ele grava `tools/data/pxg-wiki.json`, as miniaturas e o relatório `tools/data/pxg-wiki-report.md`, mas não mexe no banco: é o `db:seed` que aplica. A wiki é a fonte dos tipos e das efetividades, com uma exceção: páginas que contradizem muito a tabela de tipos oficial (erros de copiar e colar da wiki, como Spinarak com a efetividade do Bulbasaur) mantêm o valor do banco, e isso fica registrado no relatório.
-   Para alterar a lista da quest, edite `libs/shared/src/lib/joey-quest-data.ts` e rode `npm run db:seed`. A lista atual foi conferida com o NPC Joey dentro do jogo.
