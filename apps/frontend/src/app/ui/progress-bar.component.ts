import { Component, computed, input } from '@angular/core'

@Component({
    selector: 'app-progress-bar',
    template: `
        <div
            class="progress"
            [class.progress--done]="done()"
            [class.progress--thin]="thin()"
            role="progressbar"
            [attr.aria-valuenow]="value()"
            [attr.aria-valuemax]="max()"
            aria-valuemin="0"
            [attr.aria-label]="label()"
        >
            <div class="progress__fill" [style.width.%]="percent()"></div>
        </div>
    `
})
export class ProgressBarComponent {
    readonly value = input.required<number>()
    readonly max = input.required<number>()
    readonly thin = input(false)
    readonly label = input('Progresso')

    protected readonly percent = computed(() =>
        this.max() ? Math.round((this.value() / this.max()) * 100) : 0
    )
    protected readonly done = computed(
        () => this.max() > 0 && this.value() >= this.max()
    )
}
