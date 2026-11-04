import { Component, computed, inject, input, output } from '@angular/core'
import { PokemonDto } from '@internal/shared'
import {
    DIFFICULTY_LABELS,
    clanIcon,
    clanLabel,
    displayName,
    pokemonSprite,
    variantMark
} from '../core/labels'
import { PokemonStore } from '../core/pokemon-store'
import { TypeBadgeComponent } from './type-badge.component'

/**
 * Card compacto. Clique no card abre o detalhe; o botão de check marca/desmarca
 * a captura com um clique só.
 */
@Component({
    selector: 'app-pokemon-tile',
    imports: [TypeBadgeComponent],
    template: `
        @let p = pokemon();
        <article class="tile" [class.tile--caught]="p.caught">
            <button
                type="button"
                class="tile__body"
                (click)="openDetail.emit(p)"
            >
                <img
                    class="sprite tile__sprite"
                    [src]="sprite()"
                    alt=""
                    width="48"
                    height="48"
                    loading="lazy"
                />
                <span class="tile__number">{{ p.pokedexNumber }}</span>
                <span class="tile__name" [attr.title]="name()">{{
                    shortName()
                }}</span>
                <span class="tile__types">
                    @for (type of p.types; track type) {
                    <app-type-badge [type]="type" [iconOnly]="true" />
                    }
                </span>
                @if (p.joeyQuestClans.length && !showQuest()) {
                <img
                    class="sprite tile__clover"
                    src="sprites/misc/four-leaf-clover.gif"
                    alt="Joey Quest"
                    title="Faz parte da Joey Quest"
                    width="18"
                    height="18"
                />
                } @if (mark(); as m) {
                <span
                    class="tile__mark tile__mark--{{ p.variant }}"
                    [attr.title]="markTitle()"
                    [attr.aria-label]="markTitle()"
                    >{{ m }}</span
                >
                } @if (showQuest() && p.joeyQuestClans.length) {
                <span class="tile__quest">
                    @if (p.joeyQuestDifficulty; as d) {
                    <span
                        class="difficulty difficulty--{{ d.toLowerCase() }}"
                        >{{ difficulty() }}</span
                    >
                    } @for (clan of p.joeyQuestClans; track clan) {
                    <img
                        [src]="clanSrc(clan)"
                        [attr.title]="clanName(clan)"
                        [attr.alt]="clanName(clan)"
                        width="18"
                        height="18"
                    />
                    }
                </span>
                }
            </button>
            @if (p.catchable) {
            <button
                type="button"
                class="tile__check"
                [class.tile__check--pending]="pending()"
                [attr.aria-pressed]="p.caught"
                [attr.aria-label]="
                    (p.caught ? 'Desmarcar ' : 'Marcar como capturado: ') +
                    name()
                "
                [attr.title]="
                    p.caught
                        ? 'Capturado (clique para desmarcar)'
                        : 'Marcar como capturado'
                "
                (click)="store.toggleCaught(p)"
            >
                <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5 10.5l3.2 3.2L15 7" />
                </svg>
            </button>
            }
        </article>
    `
})
export class PokemonTileComponent {
    protected readonly store = inject(PokemonStore)

    readonly pokemon = input.required<PokemonDto>()
    /**
     * true: mostra clãs e dificuldade da Joey Quest (tela da quest).
     * false: só o trevo no canto, sem mudar o tamanho do card (Pokedex).
     */
    readonly showQuest = input(true)
    readonly openDetail = output<PokemonDto>()

    protected readonly name = computed(() => displayName(this.pokemon().name))
    /** No card o "(TM)"/"(TR)" já aparece no selo do canto. */
    protected readonly shortName = computed(() =>
        this.name().replace(/\s*\((TM|TR)\)$/, '')
    )
    protected readonly sprite = computed(() =>
        pokemonSprite(this.pokemon().name)
    )
    protected readonly mark = computed(() =>
        variantMark(this.pokemon().name, this.pokemon().variant)
    )
    protected readonly markTitle = computed(() => {
        const { variant } = this.pokemon()
        if (variant === 'shiny') return 'Versão shiny'
        if (variant === 'mega') return 'Mega: forjada, não entra como captura'
        if (variant === 'tier')
            return 'Versão TM/TR: forjada, não entra como captura'
        return null
    })
    protected readonly pending = computed(() =>
        this.store.pending().has(this.pokemon().name)
    )
    protected readonly difficulty = computed(() => {
        const d = this.pokemon().joeyQuestDifficulty
        return d ? DIFFICULTY_LABELS[d] : ''
    })
    protected readonly clanSrc = clanIcon
    protected readonly clanName = clanLabel
}
