import { Component, computed, inject, signal } from '@angular/core'
import {
    MatchupFilter,
    MatchupMode,
    MatchupRelation,
    POKEMON_TYPES,
    POKEMON_VARIANTS,
    PokemonQuery,
    PokemonType,
    VersionFilter,
    filterPokemons
} from '@internal/shared'
import { PokemonStore } from '../core/pokemon-store'
import { TYPE_LABELS, VERSION_LABELS } from '../core/labels'
import { injectQueryParams, toggleInList } from '../core/query-params'
import { ProgressBarComponent } from '../ui/progress-bar.component'
import { SegmentOption, SegmentedComponent } from '../ui/segmented.component'
import { TypePickerComponent } from '../ui/type-picker.component'
import { PokemonTileComponent } from '../ui/pokemon-tile.component'
import { PokemonDetailComponent } from '../ui/pokemon-detail.component'
import { LoadStateComponent } from '../ui/load-state.component'

type Status = 'all' | 'missing' | 'caught'

const isType = (value: string | null): value is PokemonType =>
    POKEMON_TYPES.includes(value as PokemonType)

@Component({
    selector: 'app-pokedex-page',
    imports: [
        ProgressBarComponent,
        SegmentedComponent,
        TypePickerComponent,
        PokemonTileComponent,
        PokemonDetailComponent,
        LoadStateComponent
    ],
    template: `
        <app-load-state>
            <section class="hero">
                <div class="hero__text">
                    <h1>Pokedex</h1>
                    @let base = store.baseProgress(); @let alt =
                    store.altProgress();
                    <div class="hero__stats">
                        <span
                            ><strong>{{ base.caught }}</strong
                            >/{{ base.total }} normais</span
                        >
                        <span
                            ><strong>{{ alt.caught }}</strong
                            >/{{ alt.total }} versões alternativas</span
                        >
                    </div>
                    <app-progress-bar
                        [value]="base.caught"
                        [max]="base.total"
                        label="Progresso da Pokedex"
                    />
                    <p class="hero__note muted">
                        Megas e TM/TR aparecem na lista, mas não contam: são
                        forjados.
                    </p>
                </div>
            </section>

            <section class="filters" aria-label="Filtros">
                <input
                    class="search"
                    type="search"
                    placeholder="Buscar nome ou número"
                    aria-label="Buscar pokémon"
                    [value]="search()"
                    (input)="params.set({ q: $any($event.target).value })"
                />
                <app-segmented
                    label="Situação"
                    [options]="statusOptions"
                    [value]="status()"
                    (valueChange)="
                        params.set({ status: $event === 'all' ? null : $event })
                    "
                />
                <label class="select">
                    <span>Versão</span>
                    <select
                        [value]="version() ?? ''"
                        (change)="params.set({ v: $any($event.target).value })"
                    >
                        <option value="">Todas</option>
                        @for (option of versionOptions; track option) {
                        <option [value]="option">
                            {{ versionLabels[option] }}
                        </option>
                        }
                    </select>
                </label>
                <label class="select">
                    <span>Ordenar</span>
                    <select
                        [value]="sort()"
                        (change)="
                            params.set({
                                sort:
                                    $any($event.target).value === 'name'
                                        ? 'name'
                                        : null
                            })
                        "
                    >
                        <option value="number">Número</option>
                        <option value="name">Nome</option>
                    </select>
                </label>
                <div class="filter-group">
                    <span class="filter-group__label">Tipo do pokémon</span>
                    <app-type-picker
                        label="Tipo do pokémon"
                        [types]="allTypes"
                        [selected]="types()"
                        (typeToggle)="
                            params.set({ types: toggle(types(), $event) })
                        "
                    />
                </div>
            </section>

            <section class="matchup" aria-labelledby="matchup-title">
                <div class="matchup__head">
                    <h2 id="matchup-title" class="matchup__title">
                        Filtro de combate
                    </h2>
                    <app-segmented
                        label="Relação"
                        [options]="relationOptions"
                        [value]="matchup().relation"
                        (valueChange)="
                            params.set({
                                rel: $event === 'weak' ? null : $event
                            })
                        "
                    />
                    <app-segmented
                        label="Combinar tipos com"
                        [options]="modeOptions"
                        [value]="matchup().mode"
                        (valueChange)="
                            params.set({
                                match: $event === 'and' ? null : $event
                            })
                        "
                    />
                </div>
                <app-type-picker
                    label="Tipos do filtro de combate"
                    [types]="allTypes"
                    [selected]="matchup().types"
                    (typeToggle)="
                        params.set({ vs: toggle(matchup().types, $event) })
                    "
                />
                <p class="matchup__summary" aria-live="polite">
                    @let m = matchup(); @if (m.types.length) {
                    {{
                        m.relation === 'weak'
                            ? 'Fracos contra'
                            : 'Resistentes a'
                    }}
                    @for (type of m.types; track type; let last = $last) {
                    <strong>{{ labels[type] }}</strong
                    >{{ last ? '' : m.mode === 'and' ? ' e ' : ' ou ' }}
                    } @if (m.types.length > 1) {
                    <span class="muted"
                        >({{
                            m.mode === 'and'
                                ? 'todos ao mesmo tempo'
                                : 'pelo menos um'
                        }})</span
                    >
                    } ·
                    <button
                        type="button"
                        class="link-button"
                        (click)="params.set({ vs: null })"
                    >
                        Limpar
                    </button>
                    } @else {
                    <span class="muted">
                        Escolha um ou mais tipos. Use <strong>OU</strong> para
                        ver tudo que seus tipos caçam e <strong>E</strong> para
                        hunts em dupla.
                    </span>
                    }
                </p>
            </section>

            <p class="results">
                {{ visible().length }}
                {{ visible().length === 1 ? 'pokémon' : 'pokémons' }} @if
                (hasFilters()) { ·
                <button
                    type="button"
                    class="link-button"
                    (click)="params.clear()"
                >
                    Limpar filtros
                </button>
                }
            </p>

            @if (visible().length) {
            <div class="grid">
                @for (p of visible(); track p.id) {
                <app-pokemon-tile
                    [pokemon]="p"
                    [showQuest]="false"
                    (openDetail)="selected.set($event.name)"
                />
                }
            </div>
            } @else {
            <p class="empty">Nenhum pokémon encontrado com esses filtros.</p>
            }

            <app-pokemon-detail
                [pokemonName]="selected()"
                (closed)="selected.set(null)"
                (navigate)="selected.set($event)"
            />
        </app-load-state>
    `
})
export class PokedexPage {
    protected readonly store = inject(PokemonStore)
    protected readonly params = injectQueryParams()
    protected readonly selected = signal<string | null>(null)

    protected readonly allTypes = POKEMON_TYPES
    protected readonly labels = TYPE_LABELS
    protected readonly toggle = toggleInList<PokemonType>

    protected readonly statusOptions: SegmentOption<Status>[] = [
        { value: 'all', label: 'Todos' },
        { value: 'missing', label: 'Faltam' },
        { value: 'caught', label: 'Capturados' }
    ]

    protected readonly versionOptions: VersionFilter[] = [
        'base',
        'alt',
        ...POKEMON_VARIANTS
    ]
    protected readonly versionLabels = VERSION_LABELS
    protected readonly version = computed(() => {
        const v = this.params.get('v') as VersionFilter | null
        return v && this.versionOptions.includes(v) ? v : undefined
    })

    protected readonly relationOptions: SegmentOption<MatchupRelation>[] = [
        { value: 'weak', label: 'Fraco contra' },
        { value: 'resists', label: 'Resiste a' }
    ]
    protected readonly modeOptions: SegmentOption<MatchupMode>[] = [
        { value: 'and', label: 'E' },
        { value: 'or', label: 'OU' }
    ]

    protected readonly search = computed(() => this.params.get('q') ?? '')
    protected readonly status = computed<Status>(() => {
        const v = this.params.get('status')
        return v === 'missing' || v === 'caught' ? v : 'all'
    })
    /** Filtro de combate: ?rel=resists&match=or&vs=GRASS,BUG (padrão: fraco contra, E). */
    protected readonly matchup = computed<MatchupFilter>(() => ({
        relation: this.params.get('rel') === 'resists' ? 'resists' : 'weak',
        mode: this.params.get('match') === 'or' ? 'or' : 'and',
        types: this.params.getList('vs').filter(isType)
    }))
    protected readonly sort = computed(() =>
        this.params.get('sort') === 'name' ? 'name' : 'number'
    )
    protected readonly types = computed(() =>
        this.params.getList('types').filter(isType)
    )

    private readonly query = computed<PokemonQuery>(() => ({
        search: this.search(),
        types: this.types(),
        matchup: this.matchup().types.length ? this.matchup() : undefined,
        version: this.version(),
        caught:
            this.status() === 'all' ? undefined : this.status() === 'caught',
        sort: this.sort()
    }))

    protected readonly visible = computed(() =>
        filterPokemons(this.store.pokemons(), this.query())
    )

    protected readonly hasFilters = computed(() => {
        const q = this.query()
        return !!(
            q.search ||
            q.types?.length ||
            q.matchup ||
            q.version ||
            q.caught !== undefined
        )
    })
}
