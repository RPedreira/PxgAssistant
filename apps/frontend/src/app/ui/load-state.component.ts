import { Component, inject } from '@angular/core'
import { PokemonStore } from '../core/pokemon-store'

/** Mostra carregando/erro enquanto o store não está pronto; depois, o conteúdo. */
@Component({
    selector: 'app-load-state',
    template: `
        @switch (store.status()) { @case ('ready') {
        <ng-content />
        } @case ('error') {
        <div class="state">
            <p>Não foi possível conectar ao servidor.</p>
            <p class="muted">
                Verifique se o backend está rodando (<code>npm run dev</code>).
            </p>
            <button
                type="button"
                class="button button--primary"
                (click)="store.load(true)"
            >
                Tentar novamente
            </button>
        </div>
        } @default {
        <div class="state" aria-live="polite">
            <span class="spinner" aria-hidden="true"></span>
            Carregando pokémons…
        </div>
        } }
    `
})
export class LoadStateComponent {
    protected readonly store = inject(PokemonStore)

    constructor() {
        this.store.load()
    }
}
