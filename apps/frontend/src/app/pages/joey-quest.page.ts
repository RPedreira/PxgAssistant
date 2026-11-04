import { Component, computed, inject, signal } from '@angular/core'
import {
    CLAN_NAMES,
    CLAN_REWARD_BASE,
    CLAN_REWARD_ESSENCE_AMOUNT,
    ClanName,
    DIFFICULTIES,
    Difficulty,
    FINAL_REWARDS,
    POKEMON_TYPES,
    PokemonType,
    filterPokemons
} from '@internal/shared'
import { PokemonStore } from '../core/pokemon-store'
import { DIFFICULTY_LABELS, clanIcon, clanLabel } from '../core/labels'
import { injectQueryParams, toggleInList } from '../core/query-params'
import { ProgressBarComponent } from '../ui/progress-bar.component'
import { SegmentOption, SegmentedComponent } from '../ui/segmented.component'
import { TypePickerComponent } from '../ui/type-picker.component'
import { PokemonTileComponent } from '../ui/pokemon-tile.component'
import { PokemonDetailComponent } from '../ui/pokemon-detail.component'
import { LoadStateComponent } from '../ui/load-state.component'

type Status = 'all' | 'missing' | 'caught'

@Component({
    selector: 'app-joey-quest-page',
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
            @let q = quest();
            <section class="hero" [class.hero--done]="q.completed">
                <div class="hero__text">
                    <h1>Joey Quest</h1>
                    <p class="muted">
                        Capture todos os pokémons da lista do Joey (Dimensional
                        Zones) para ganhar a recompensa final.
                    </p>
                    <div class="hero__stats">
                        <span
                            ><strong>{{ q.caughtPokemons }}</strong
                            >/{{ q.totalPokemons }} pokémons</span
                        >
                        <span
                            ><strong>{{ q.completedClans }}</strong
                            >/{{ q.clans.length }} clãs completos</span
                        >
                        @if (!q.completed) {
                        <span
                            >Faltam
                            <strong>{{
                                q.totalPokemons - q.caughtPokemons
                            }}</strong></span
                        >
                        }
                    </div>
                    <app-progress-bar
                        [value]="q.caughtPokemons"
                        [max]="q.totalPokemons"
                        label="Progresso da Joey Quest"
                    />
                </div>
                <aside
                    class="reward reward--final"
                    [class.reward--unlocked]="q.completed"
                >
                    <img
                        src="sprites/misc/four-leaf-clover.gif"
                        alt=""
                        width="32"
                        height="32"
                        class="sprite"
                    />
                    <div>
                        <p class="reward__title">
                            {{
                                q.completed
                                    ? 'Quest completa!'
                                    : 'Recompensa final'
                            }}
                        </p>
                        <p class="reward__items">
                            {{ finalRewards.join(' · ') }}
                        </p>
                    </div>
                </aside>
            </section>

            <nav class="clans" aria-label="Clãs">
                <button
                    type="button"
                    class="clan"
                    [attr.aria-pressed]="!clan()"
                    (click)="setClan(null)"
                >
                    <span class="clan__name">Todos</span>
                    <span class="clan__count"
                        >{{ q.caughtPokemons }}/{{ q.totalPokemons }}</span
                    >
                    <app-progress-bar
                        [value]="q.caughtPokemons"
                        [max]="q.totalPokemons"
                        [thin]="true"
                    />
                </button>
                @for (c of q.clans; track c.name) {
                <button
                    type="button"
                    class="clan"
                    [class.clan--done]="c.completed"
                    [attr.aria-pressed]="clan() === c.name"
                    (click)="setClan(c.name)"
                >
                    <span class="clan__name">
                        <img
                            [src]="clanSrc(c.name)"
                            alt=""
                            width="20"
                            height="20"
                        />
                        {{ clanName(c.name) }}
                        @if (c.completed) {
                        <span class="clan__done" aria-label="completo">✓</span>
                        }
                    </span>
                    <span class="clan__count"
                        >{{ c.caught }}/{{ c.total }}</span
                    >
                    <app-progress-bar
                        [value]="c.caught"
                        [max]="c.total"
                        [thin]="true"
                        [label]="clanName(c.name)"
                    />
                </button>
                }
            </nav>

            @if (selectedClan(); as c) {
            <p
                class="reward reward--clan"
                [class.reward--unlocked]="c.completed"
            >
                <img [src]="clanSrc(c.name)" alt="" width="24" height="24" />
                <span>
                    <strong>Recompensa {{ clanName(c.name) }}:</strong>
                    {{ c.egg }} · {{ essenceAmount }} {{ c.essence }} ·
                    {{ clanRewardBase.join(' · ') }}
                </span>
            </p>
            }

            <section class="filters" aria-label="Filtros">
                <app-segmented
                    label="Situação"
                    [options]="statusOptions()"
                    [value]="status()"
                    (valueChange)="
                        params.set({ status: $event === 'all' ? null : $event })
                    "
                />
                <app-segmented
                    label="Dificuldade"
                    [options]="difficultyOptions"
                    [value]="difficulty()"
                    (valueChange)="params.set({ difficulty: $event })"
                />
                <input
                    class="search"
                    type="search"
                    placeholder="Buscar nome ou número"
                    aria-label="Buscar pokémon"
                    [value]="search()"
                    (input)="params.set({ q: $any($event.target).value })"
                />
                <app-type-picker
                    [types]="availableTypes()"
                    [selected]="types()"
                    (typeToggle)="
                        params.set({ types: toggle(types(), $event) })
                    "
                />
                @if (hasFilters()) {
                <button
                    type="button"
                    class="link-button"
                    (click)="clearFilters()"
                >
                    Limpar filtros
                </button>
                }
            </section>

            @if (visible().length) {
            <div class="grid">
                @for (p of visible(); track p.id) {
                <app-pokemon-tile
                    [pokemon]="p"
                    (openDetail)="selected.set($event.name)"
                />
                }
            </div>
            } @else {
            <p class="empty">
                @if (status() === 'missing' && !hasFilters()) { 🎉 Nada faltando
                {{ clan() ? 'neste clã' : 'na Joey Quest' }}! } @else { Nenhum
                pokémon encontrado com esses filtros. }
            </p>
            }

            <app-pokemon-detail
                [pokemonName]="selected()"
                (closed)="selected.set(null)"
                (navigate)="selected.set($event)"
            />
        </app-load-state>
    `
})
export class JoeyQuestPage {
    private readonly store = inject(PokemonStore)
    protected readonly params = injectQueryParams()
    protected readonly selected = signal<string | null>(null)

    protected readonly finalRewards = FINAL_REWARDS
    protected readonly clanRewardBase = CLAN_REWARD_BASE
    protected readonly essenceAmount = CLAN_REWARD_ESSENCE_AMOUNT
    protected readonly clanSrc = clanIcon
    protected readonly clanName = clanLabel
    protected readonly toggle = toggleInList<PokemonType>

    protected readonly difficultyOptions: SegmentOption<Difficulty | ''>[] = [
        { value: '', label: 'Todas' },
        ...DIFFICULTIES.map(d => ({ value: d, label: DIFFICULTY_LABELS[d] }))
    ]

    // Estado vindo da URL
    protected readonly clan = computed(() => {
        const value = this.params.get('clan') as ClanName | null
        return value && CLAN_NAMES.includes(value) ? value : null
    })
    protected readonly status = computed<Status>(() => {
        const value = this.params.get('status')
        return value === 'missing' || value === 'caught' ? value : 'all'
    })
    protected readonly difficulty = computed<Difficulty | ''>(() => {
        const value = this.params.get('difficulty') as Difficulty
        return DIFFICULTIES.includes(value) ? value : ''
    })
    protected readonly search = computed(() => this.params.get('q') ?? '')
    protected readonly types = computed(() =>
        this.params
            .getList('types')
            .filter((t): t is PokemonType =>
                POKEMON_TYPES.includes(t as PokemonType)
            )
    )

    protected readonly quest = this.store.quest
    protected readonly selectedClan = computed(() =>
        this.quest().clans.find(c => c.name === this.clan())
    )

    /** Pokémons do clã escolhido, ou todos os da quest (sem repetição). */
    private readonly pool = computed(() => {
        const clan = this.selectedClan()
        return clan
            ? clan.pokemons
            : this.store.pokemons().filter(p => p.joeyQuestClans.length)
    })

    protected readonly availableTypes = computed(() => {
        const present = new Set(this.pool().flatMap(p => p.types))
        return POKEMON_TYPES.filter(
            t => present.has(t) || this.types().includes(t)
        )
    })

    /** Tudo filtrado, menos a situação (para mostrar as contagens). */
    private readonly filtered = computed(() => {
        const difficulty = this.difficulty()
        return filterPokemons(this.pool(), {
            search: this.search(),
            types: this.types()
        }).filter(p => !difficulty || p.joeyQuestDifficulty === difficulty)
    })

    protected readonly statusOptions = computed<SegmentOption<Status>[]>(() => {
        const list = this.filtered()
        const caught = list.filter(p => p.caught).length
        return [
            { value: 'all', label: 'Todos', count: list.length },
            { value: 'missing', label: 'Faltam', count: list.length - caught },
            { value: 'caught', label: 'Capturados', count: caught }
        ]
    })

    protected readonly visible = computed(() => {
        const status = this.status()
        if (status === 'all') return this.filtered()
        return this.filtered().filter(p => p.caught === (status === 'caught'))
    })

    protected readonly hasFilters = computed(
        () => !!this.search() || !!this.difficulty() || this.types().length > 0
    )

    protected setClan(clan: ClanName | null) {
        this.params.set({ clan })
    }

    protected clearFilters() {
        this.params.set({ q: null, difficulty: null, types: null })
    }
}
