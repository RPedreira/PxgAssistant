import { Component, computed, input } from '@angular/core'
import { PokemonType } from '@internal/shared'
import { TYPE_COLORS, TYPE_LABELS, typeIcon } from '../core/labels'

@Component({
    selector: 'app-type-badge',
    template: `
        <span
            class="type-badge"
            [class.type-badge--icon]="iconOnly()"
            [style.--type-color]="color()"
            [attr.title]="label()"
        >
            <img [src]="icon()" alt="" width="16" height="16" />
            @if (!iconOnly()) {
            <span>{{ label() }}</span>
            } @else {
            <span class="visually-hidden">{{ label() }}</span>
            }
        </span>
    `
})
export class TypeBadgeComponent {
    readonly type = input.required<PokemonType>()
    readonly iconOnly = input(false)

    protected readonly label = computed(() => TYPE_LABELS[this.type()])
    protected readonly color = computed(() => TYPE_COLORS[this.type()])
    protected readonly icon = computed(() => typeIcon(this.type()))
}
