import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing'
import { JoeyQuestSummaryDto } from '@internal/shared'
import { makePokemon } from '@internal/shared/testing'
import { PokemonStore } from './pokemon-store'
import { ToastService } from './toast.service'

describe('PokemonStore', () => {
    let store: PokemonStore
    let http: HttpTestingController
    let toast: ToastService

    const dwebble = makePokemon({
        name: 'dwebble',
        joeyQuestClans: ['NATURIA', 'OREBOUND']
    })
    const shroomish = makePokemon({
        name: 'shroomish',
        joeyQuestClans: ['NATURIA']
    })
    const quest: JoeyQuestSummaryDto = {
        clans: [
            {
                name: 'NATURIA',
                order: 0,
                egg: 'Sprout Egg',
                essence: 'Naturia Essence',
                total: 2,
                caught: 0,
                completed: false,
                pokemons: []
            },
            {
                name: 'OREBOUND',
                order: 1,
                egg: 'Sand Egg',
                essence: 'Orebound Essence',
                total: 1,
                caught: 0,
                completed: false,
                pokemons: []
            }
        ],
        totalPokemons: 2,
        caughtPokemons: 0,
        completedClans: 0,
        completed: false
    }

    beforeEach(() => {
        jest.useFakeTimers()
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        })
        store = TestBed.inject(PokemonStore)
        http = TestBed.inject(HttpTestingController)
        toast = TestBed.inject(ToastService)

        store.load()
        http.expectOne('/api/pokemons').flush([dwebble, shroomish])
        http.expectOne('/api/joey-quest').flush(quest)
    })

    afterEach(() => {
        http.verify()
        jest.useRealTimers()
    })

    it('carrega pokémons e calcula o progresso da quest localmente', () => {
        expect(store.status()).toBe('ready')
        expect(
            store.quest().clans.map(c => `${c.name} ${c.caught}/${c.total}`)
        ).toEqual(['NATURIA 0/2', 'OREBOUND 0/1'])
    })

    it('marca capturado na hora (otimista) e confirma com o servidor', () => {
        store.setCaught('dwebble', true)

        // Já refletido antes da resposta, nos dois clãs.
        expect(store.quest().clans.map(c => c.caught)).toEqual([1, 1])
        expect(store.quest().clans[1].completed).toBe(true)
        expect(store.pending().has('dwebble')).toBe(true)

        const req = http.expectOne('/api/pokemons/dwebble')
        expect(req.request.method).toBe('PATCH')
        expect(req.request.body).toEqual({ caught: true })
        req.flush({ ...dwebble, caught: true })

        expect(store.pending().has('dwebble')).toBe(false)
        expect(store.baseProgress().caught).toBe(1)
        expect(toast.toasts()[0].action?.label).toBe('Desfazer')
    })

    it('desfaz a marcação se o servidor falhar', () => {
        store.setCaught('dwebble', true)
        http.expectOne('/api/pokemons/dwebble').flush(
            {},
            { status: 500, statusText: 'erro' }
        )

        expect(store.baseProgress().caught).toBe(0)
        expect(toast.toasts()[0].kind).toBe('error')
    })

    it('ignora cliques repetidos enquanto salva', () => {
        store.setCaught('dwebble', true)
        store.toggleCaught(store.pokemons()[0])
        http.expectOne('/api/pokemons/dwebble').flush({
            ...dwebble,
            caught: true
        })
        expect(store.baseProgress().caught).toBe(1)
    })

    it('o botão Desfazer reverte a captura', () => {
        store.setCaught('dwebble', true)
        http.expectOne('/api/pokemons/dwebble').flush({
            ...dwebble,
            caught: true
        })

        toast.toasts()[0].action?.run()
        http.expectOne('/api/pokemons/dwebble').flush({
            ...dwebble,
            caught: false
        })
        expect(store.baseProgress().caught).toBe(0)
    })
})
