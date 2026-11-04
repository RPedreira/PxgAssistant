import {
    Component,
    ElementRef,
    computed,
    effect,
    inject,
    input,
    output,
    viewChild
} from '@angular/core'
import {
    CAPTURE_REWARDS,
    PokemonDto,
    PokemonType,
    variantRank
} from '@internal/shared'
import { PokemonStore } from '../core/pokemon-store'
import {
    DIFFICULTY_LABELS,
    VARIANT_LABELS,
    clanIcon,
    clanLabel,
    displayName,
    pokemonSprite
} from '../core/labels'
import { TypeBadgeComponent } from './type-badge.component'

interface EffectRow {
    label: string
    multiplier: string
    tone: 'bad' | 'warn' | 'neutral' | 'good' | 'great'
    types: PokemonType[]
}

/** Detalhe de um pokémon em um <dialog> nativo (Esc e clique fora fecham). */
@Component({
    selector: 'app-pokemon-detail',
    imports: [TypeBadgeComponent],
    template: `
        <dialog
            #dialog
            class="dialog"
            tabindex="-1"
            (close)="closed.emit()"
            (click)="onBackdrop($event)"
            (keydown.escape)="close()"
        >
            @if (pokemon(); as p) {
            <div class="dialog__content">
                <header class="detail__header">
                    <img
                        class="sprite detail__sprite"
                        [src]="sprite()"
                        alt=""
                        width="96"
                        height="96"
                    />
                    <div>
                        <p class="detail__number">{{ p.pokedexNumber }}</p>
                        <h2 class="detail__name">{{ name() }}</h2>
                        <div class="detail__types">
                            @for (type of p.types; track type) {
                            <app-type-badge [type]="type" />
                            }
                        </div>
                    </div>
                    <button
                        type="button"
                        class="icon-button detail__close"
                        aria-label="Fechar"
                        (click)="close()"
                    >
                        ✕
                    </button>
                </header>

                @if (p.catchable) {
                <button
                    type="button"
                    class="button detail__toggle"
                    [class.button--primary]="!p.caught"
                    [disabled]="pending()"
                    (click)="store.toggleCaught(p)"
                >
                    {{
                        p.caught
                            ? '✓ Capturado. Clique para desmarcar'
                            : 'Marcar como capturado'
                    }}
                </button>
                } @else {
                <p class="detail__forged">
                    {{ p.variant === 'mega' ? 'Megas' : 'Versões TM/TR' }} são
                    forjadas, não capturadas: não entram no progresso da
                    Pokedex.
                </p>
                } @if (family().length > 1) {
                <section>
                    <h3 class="detail__section-title">Outras versões</h3>
                    <ul class="versions">
                        @for (v of family(); track v.name) {
                        <li>
                            <button
                                type="button"
                                class="versions__item"
                                [attr.aria-current]="
                                    v.name === p.name ? 'true' : null
                                "
                                (click)="navigate.emit(v.name)"
                            >
                                <img
                                    class="sprite"
                                    [src]="spriteOf(v.name)"
                                    alt=""
                                    width="32"
                                    height="32"
                                    loading="lazy"
                                />
                                <span class="versions__name">{{
                                    nameOf(v.name)
                                }}</span>
                                <span class="versions__types">
                                    @for (type of v.types; track type) {
                                    <app-type-badge
                                        [type]="type"
                                        [iconOnly]="true"
                                    />
                                    }
                                </span>
                                @if (v.variant) {
                                <span class="versions__kind">{{
                                    variantLabels[v.variant]
                                }}</span>
                                }
                            </button>
                        </li>
                        }
                    </ul>
                </section>
                }

                <section>
                    <h3 class="detail__section-title">
                        Efetividade dos ataques recebidos
                    </h3>
                    <dl class="effects">
                        @for (row of effects(); track row.label) { @if
                        (row.types.length) {
                        <div class="effects__row effects__row--{{ row.tone }}">
                            <dt>
                                {{ row.label }}
                                <span class="effects__mult">{{
                                    row.multiplier
                                }}</span>
                            </dt>
                            <dd>
                                @for (type of row.types; track type) {
                                <app-type-badge [type]="type" />
                                }
                            </dd>
                        </div>
                        } }
                    </dl>
                </section>

                @if (p.joeyQuestClans.length) {
                <section class="detail__quest">
                    <h3 class="detail__section-title">Joey Quest</h3>
                    <p class="detail__clans">
                        @for (clan of p.joeyQuestClans; track clan) {
                        <span class="chip chip--static">
                            <img
                                [src]="clanSrc(clan)"
                                alt=""
                                width="18"
                                height="18"
                            />
                            {{ clanName(clan) }}
                        </span>
                        }
                    </p>
                    @if (p.joeyQuestDifficulty; as d) {
                    <p>
                        Dificuldade:
                        <span
                            class="difficulty difficulty--{{ d.toLowerCase() }}"
                            >{{ difficultyLabels[d] }}</span
                        >
                    </p>
                    <p class="muted">
                        Recompensa por captura:
                        {{ captureRewards[d].join(' · ') }}
                    </p>
                    }
                </section>
                }
            </div>
            }
        </dialog>
    `
})
export class PokemonDetailComponent {
    protected readonly store = inject(PokemonStore)

    /** Nome do pokémon a exibir; null fecha o diálogo. */
    readonly pokemonName = input<string | null>(null)
    readonly closed = output<void>()
    /** Clique em outra versão na faixa "Outras versões". */
    readonly navigate = output<string>()

    private readonly dialog =
        viewChild.required<ElementRef<HTMLDialogElement>>('dialog')

    protected readonly pokemon = computed<PokemonDto | undefined>(() => {
        const name = this.pokemonName()
        return name
            ? this.store.pokemons().find(p => p.name === name)
            : undefined
    })
    protected readonly name = computed(() =>
        displayName(this.pokemon()?.name ?? '')
    )
    protected readonly sprite = computed(() =>
        pokemonSprite(this.pokemon()?.name ?? '')
    )
    protected readonly pending = computed(() =>
        this.store.pending().has(this.pokemon()?.name ?? '')
    )
    /** Forma base + todas as versões alternativas, na ordem da Pokedex. */
    protected readonly family = computed(() => {
        const p = this.pokemon()
        if (!p) return []
        const root = p.baseName ?? p.name
        return this.store
            .pokemons()
            .filter(o => o.name === root || o.baseName === root)
            .sort(
                (a, b) =>
                    variantRank(a) - variantRank(b) ||
                    a.name.localeCompare(b.name)
            )
    })
    protected readonly spriteOf = pokemonSprite
    protected readonly nameOf = displayName
    protected readonly variantLabels = VARIANT_LABELS
    protected readonly captureRewards = CAPTURE_REWARDS
    protected readonly difficultyLabels = DIFFICULTY_LABELS
    protected readonly clanSrc = clanIcon
    protected readonly clanName = clanLabel

    protected readonly effects = computed<EffectRow[]>(() => {
        const p = this.pokemon()
        if (!p) return []
        return [
            {
                label: 'Super fraqueza',
                multiplier: '×4',
                tone: 'bad',
                types: p.superWeakness
            },
            {
                label: 'Fraqueza',
                multiplier: '×2',
                tone: 'warn',
                types: p.weakness
            },
            {
                label: 'Resistência',
                multiplier: '×½',
                tone: 'good',
                types: p.resistance
            },
            {
                label: 'Super resistência',
                multiplier: '×¼',
                tone: 'great',
                types: p.superResistance
            },
            {
                label: 'Imunidade',
                multiplier: '×0',
                tone: 'great',
                types: p.immunity
            },
            {
                label: 'Neutro',
                multiplier: '×1',
                tone: 'neutral',
                types: p.neutral
            }
        ]
    })

    constructor() {
        effect(() => {
            const el = this.dialog().nativeElement
            if (this.pokemon() && !el.open) el.showModal()
            else if (!this.pokemon() && el.open) el.close()
        })
    }

    close() {
        this.dialog().nativeElement.close()
    }

    protected onBackdrop(event: MouseEvent) {
        if (event.target === this.dialog().nativeElement) this.close()
    }
}
