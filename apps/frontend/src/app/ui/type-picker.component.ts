import { Component, input, output } from '@angular/core'
import { PokemonType } from '@internal/shared'
import { TYPE_COLORS, TYPE_LABELS, typeIcon } from '../core/labels'

/** Chips de tipo com seleção múltipla. */
@Component({
    selector: 'app-type-picker',
    template: `
        <div class="type-picker" role="group" [attr.aria-label]="label()">
            @for (type of types(); track type) {
            <button
                type="button"
                class="type-chip"
                [style.--type-color]="colors[type]"
                [attr.aria-pressed]="selected().includes(type)"
                (click)="typeToggle.emit(type)"
            >
                <img [src]="icon(type)" alt="" width="16" height="16" />
                {{ labels[type] }}
            </button>
            }
        </div>
    `
})
export class TypePickerComponent {
    readonly types = input.required<readonly PokemonType[]>()
    readonly selected = input.required<PokemonType[]>()
    readonly label = input('Tipos')
    readonly typeToggle = output<PokemonType>()

    protected readonly labels = TYPE_LABELS
    protected readonly colors = TYPE_COLORS
    protected readonly icon = typeIcon
}
