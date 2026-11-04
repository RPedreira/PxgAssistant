import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing'
import { Router, provideRouter } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { makePokemon } from '@internal/shared/testing'
import { JoeyQuestPage } from './joey-quest.page'

describe('JoeyQuestPage', () => {
    let harness: RouterTestingHarness
    let http: HttpTestingController

    const pokemons = [
        makePokemon({
            name: 'dwebble',
            number: 557,
            types: ['BUG', 'ROCK'],
            joeyQuestClans: ['NATURIA', 'OREBOUND'],
            joeyQuestDifficulty: 'EASY'
        }),
        makePokemon({
            name: 'shroomish',
            number: 285,
            types: ['GRASS'],
            joeyQuestClans: ['NATURIA'],
            joeyQuestDifficulty: 'EASY'
        }),
        makePokemon({
            name: 'excadrill',
            number: 530,
            types: ['GROUND', 'STEEL'],
            joeyQuestClans: ['OREBOUND'],
            joeyQuestDifficulty: 'HARD',
            caught: true
        }),
        makePokemon({ name: 'pikachu', number: 25, types: ['ELECTRIC'] })
    ]
    const clan = (name: 'NATURIA' | 'OREBOUND', order: number) => ({
        name,
        order,
        egg: 'Egg',
        essence: 'Essence',
        total: 0,
        caught: 0,
        completed: false,
        pokemons: []
    })

    const root = () => harness.routeNativeElement as HTMLElement
    const names = () =>
        Array.from(root().querySelectorAll('.tile__name')).map(e =>
            e.textContent?.trim()
        )
    const text = (selector: string) =>
        Array.from(root().querySelectorAll(selector)).map(e =>
            e.textContent?.replace(/\s+/g, ' ').trim()
        )

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([
                    { path: 'joey-quest', component: JoeyQuestPage }
                ])
            ]
        })
        http = TestBed.inject(HttpTestingController)
        harness = await RouterTestingHarness.create()
        await harness.navigateByUrl('/joey-quest')
        http.expectOne('/api/pokemons').flush(pokemons)
        http.expectOne('/api/joey-quest').flush({
            clans: [clan('NATURIA', 0), clan('OREBOUND', 1)]
        })
        harness.detectChanges()
    })

    it('mostra por padrão todos os pokémons da quest, sem repetir os de vários clãs', () => {
        expect(names()).toEqual(['Shroomish', 'Excadrill', 'Dwebble'])
        expect(text('.segmented__option').slice(0, 3)).toEqual([
            'Todos 3',
            'Faltam 2',
            'Capturados 1'
        ])
        expect(text('.clan__count')).toEqual(['1/3', '0/2', '1/2'])
    })

    it('marcar como capturado tira o pokémon de "Faltam" e atualiza os clãs na hora', async () => {
        await TestBed.inject(Router).navigateByUrl('/joey-quest?status=missing')
        harness.detectChanges()
        const check =
            root().querySelectorAll<HTMLButtonElement>('.tile__check')[1]
        check.click()
        harness.detectChanges()

        expect(names()).toEqual(['Shroomish'])
        expect(text('.clan__count')).toEqual(['2/3', '1/2', '2/2'])

        http.expectOne('/api/pokemons/dwebble').flush({
            ...pokemons[0],
            caught: true
        })
    })

    it('filtra por clã e situação pela URL', async () => {
        await TestBed.inject(Router).navigateByUrl(
            '/joey-quest?clan=OREBOUND&status=caught'
        )
        harness.detectChanges()
        expect(names()).toEqual(['Excadrill'])
        expect(text('.reward--clan')[0]).toContain('Recompensa Orebound')
    })

    it('filtra por dificuldade', async () => {
        await TestBed.inject(Router).navigateByUrl(
            '/joey-quest?difficulty=HARD'
        )
        harness.detectChanges()
        expect(names()).toEqual(['Excadrill'])
    })
})
