import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PokemonStore } from '../core/pokemon-store'
import { ProgressBarComponent } from '../ui/progress-bar.component'
import { LoadStateComponent } from '../ui/load-state.component'

@Component({
    selector: 'app-home-page',
    imports: [RouterLink, ProgressBarComponent, LoadStateComponent],
    template: `
        <header class="home-logo">
            <img
                class="sprite"
                src="sprites/misc/four-leaf-clover.gif"
                alt=""
                width="96"
                height="96"
            />
            <h1>PXG Assistant</h1>
        </header>

        <app-load-state>
            @let q = store.quest();
            <section class="home">
                <a class="card" routerLink="/joey-quest">
                    <h2>Joey Quest</h2>
                    <p class="muted">
                        Veja só o que falta, por clã, tipo ou dificuldade, e
                        marque cada captura.
                    </p>
                    <p class="card__stat">
                        <strong>{{ q.caughtPokemons }}</strong
                        >/{{ q.totalPokemons }} pokémons ·
                        <strong>{{ q.completedClans }}</strong
                        >/{{ q.clans.length }} clãs
                    </p>
                    <app-progress-bar
                        [value]="q.caughtPokemons"
                        [max]="q.totalPokemons"
                    />
                </a>

                <a class="card" routerLink="/pokedex">
                    <h2>Pokedex</h2>
                    <p class="muted">
                        Todos os pokémons, shinies e outras versões, com filtros
                        por tipo, fraquezas e resistências.
                    </p>
                    @let base = store.baseProgress(); @let alt =
                    store.altProgress();
                    <p class="card__stat">
                        <strong>{{ base.caught }}</strong
                        >/{{ base.total }} normais ·
                        <strong>{{ alt.caught }}</strong
                        >/{{ alt.total }} versões alternativas
                    </p>
                    <app-progress-bar
                        [value]="base.caught"
                        [max]="base.total"
                    />
                </a>
            </section>
        </app-load-state>
    `
})
export class HomePage {
    protected readonly store = inject(PokemonStore)
}
