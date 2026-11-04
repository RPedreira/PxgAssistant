import { Injectable, computed, inject, signal } from '@angular/core'
import { forkJoin } from 'rxjs'
import { ClanDto, PokemonDto, buildJoeyQuestSummary } from '@internal/shared'
import { ApiService } from './api.service'
import { ToastService } from './toast.service'
import { displayName } from './labels'

type Status = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Estado único do app. Todos os pokémons ficam em memória (são ~600), então
 * filtros e progresso da Joey Quest são recalculados instantaneamente.
 * O `caught` do banco é a única fonte da verdade.
 */
@Injectable({ providedIn: 'root' })
export class PokemonStore {
    private readonly api = inject(ApiService)
    private readonly toast = inject(ToastService)

    readonly pokemons = signal<PokemonDto[]>([])
    readonly clans = signal<ClanDto[]>([])
    readonly status = signal<Status>('idle')
    /** Nomes com atualização em andamento no servidor. */
    readonly pending = signal<ReadonlySet<string>>(new Set())

    /** Progresso das formas base (o que a Pokedex do jogo conta). */
    readonly baseProgress = computed(() => {
        const base = this.pokemons().filter(p => p.variant === null)
        return { caught: base.filter(p => p.caught).length, total: base.length }
    })
    /** Versões alternativas capturáveis (sem megas e TM/TR, que são forjados). */
    readonly altProgress = computed(() => {
        const alt = this.pokemons().filter(
            p => p.variant !== null && p.catchable
        )
        return { caught: alt.filter(p => p.caught).length, total: alt.length }
    })
    readonly quest = computed(() =>
        buildJoeyQuestSummary(this.clans(), this.pokemons())
    )

    load(force = false) {
        if (
            !force &&
            (this.status() === 'loading' || this.status() === 'ready')
        )
            return
        this.status.set('loading')
        forkJoin({
            pokemons: this.api.pokemons(),
            quest: this.api.joeyQuest()
        }).subscribe({
            next: ({ pokemons, quest }) => {
                this.pokemons.set(pokemons)
                this.clans.set(
                    quest.clans.map(({ name, order, egg, essence }) => ({
                        name,
                        order,
                        egg,
                        essence
                    }))
                )
                this.status.set('ready')
            },
            error: () => this.status.set('error')
        })
    }

    toggleCaught(pokemon: PokemonDto) {
        this.setCaught(pokemon.name, !pokemon.caught)
    }

    /** Atualização otimista: aplica na tela e desfaz se o servidor recusar. */
    setCaught(name: string, caught: boolean, notify = true) {
        if (this.pending().has(name)) return
        const previous = this.pokemons().find(p => p.name === name)
        if (!previous || previous.caught === caught || !previous.catchable)
            return

        this.patchLocal(name, caught)
        this.setPending(name, true)

        this.api.updatePokemon(name, { caught }).subscribe({
            next: updated => {
                this.setPending(name, false)
                this.patchLocal(name, updated.caught)
                if (notify) {
                    this.toast.show(
                        `${displayName(name)} ${
                            caught ? 'marcado como capturado' : 'desmarcado'
                        }`,
                        {
                            action: {
                                label: 'Desfazer',
                                run: () => this.setCaught(name, !caught, false)
                            }
                        }
                    )
                }
            },
            error: () => {
                this.setPending(name, false)
                this.patchLocal(name, previous.caught)
                this.toast.show(
                    `Não foi possível salvar ${displayName(
                        name
                    )}. Tente novamente.`,
                    {
                        kind: 'error'
                    }
                )
            }
        })
    }

    private patchLocal(name: string, caught: boolean) {
        this.pokemons.update(list =>
            list.map(p => (p.name === name ? { ...p, caught } : p))
        )
    }

    private setPending(name: string, on: boolean) {
        this.pending.update(set => {
            const next = new Set(set)
            if (on) next.add(name)
            else next.delete(name)
            return next
        })
    }
}
