import { Component, input, output } from '@angular/core'

export interface SegmentOption<T> {
    value: T
    label: string
    count?: number
}

@Component({
    selector: 'app-segmented',
    template: `
        <div class="segmented" role="radiogroup" [attr.aria-label]="label()">
            @for (option of options(); track option.value) {
            <button
                type="button"
                role="radio"
                class="segmented__option"
                [attr.aria-checked]="option.value === value()"
                (click)="valueChange.emit(option.value)"
            >
                {{ option.label }}
                @if (option.count !== undefined) {
                <span class="segmented__count">{{ option.count }}</span>
                }
            </button>
            }
        </div>
    `
})
export class SegmentedComponent<T> {
    readonly options = input.required<SegmentOption<T>[]>()
    readonly value = input.required<T>()
    readonly label = input('')
    readonly valueChange = output<T>()
}
