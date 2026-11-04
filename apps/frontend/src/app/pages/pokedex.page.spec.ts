import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import {
    HttpTestingController,
    provideHttpClientTesting
} from '@angular/common/http/testing'
import { Router, provideRouter } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { makePokemon } from '@internal/shared/testing'
import { PokedexPage } from './pokedex.page'

describe('PokedexPage', () => {
    let harness: RouterTestingHarness

    const root = () => harness.routeNativeElement as HTMLElement
    const tile = (name: string) =>
        Array.from(root().querySelectorAll('.tile')).find(
            t => t.querySelector('.tile__name')?.textContent?.trim() === name
        ) as HTMLElement

    beforeAll(() => {
        // jsdom não implementa <dialog>.showModal/close
        HTMLDialogElement.prototype.showModal ??= function (
            this: HTMLDialogElement
        ) {
            this.setAttribute('open', '')
        }
        HTMLDialogElement.prototype.close ??= function (
            this: HTMLDialogElement
        ) {
            this.removeAttribute('open')
        }
    })

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([{ path: 'pokedex', component: PokedexPage }])
            ]
        })
        const http = TestBed.inject(HttpTestingController)
        harness = await RouterTestingHarness.create()
        await harness.navigateByUrl('/pokedex')
        http.expectOne('/api/pokemons').flush([
            makePokemon({
                name: 'dwebble',
                number: 557,
                joeyQuestClans: ['NATURIA'],
                joeyQuestDifficulty: 'EASY',
                weakness: ['WATER', 'STEEL'],
                resistance: ['NORMAL'],
                superResistance: []
            }),
            makePokemon({
                name: 'pikachu',
                number: 25,
                weakness: ['GROUND'],
                resistance: ['FLYING', 'STEEL'],
                superResistance: []
            }),
            makePokemon({
                name: 'gengar',
                number: 94,
                weakness: ['GROUND', 'GHOST', 'PSYCHIC'],
                resistance: ['GRASS'],
                superResistance: []
            }),
            makePokemon({
                name: 'shiny gengar',
                number: 94,
                baseName: 'gengar',
                variant: 'shiny',
                weakness: ['GROUND', 'GHOST', 'PSYCHIC'],
                resistance: ['GRASS'],
                superResistance: []
            }),
            makePokemon({
                name: 'mega gengar (tm)',
                number: 94,
                baseName: 'gengar',
                variant: 'tier',
                catchable: false,
                weakness: ['GROUND', 'GHOST', 'PSYCHIC'],
                resistance: ['GRASS'],
                superResistance: []
            })
        ])
        http.expectOne('/api/joey-quest').flush({ clans: [] })
        harness.detectChanges()
    })

    it('marca pokémons da Joey Quest só com o trevo, sem dificuldade nem clã', () => {
        const dwebble = tile('Dwebble')
        expect(dwebble.querySelector('.tile__clover')).not.toBeNull()
        expect(dwebble.querySelector('.tile__quest')).toBeNull()
        expect(tile('Pikachu').querySelector('.tile__clover')).toBeNull()
    })

    const names = () =>
        Array.from(root().querySelectorAll('.tile__name')).map(e =>
            e.textContent?.trim()
        )
    const go = async (url: string) => {
        await TestBed.inject(Router).navigateByUrl(url)
        harness.detectChanges()
    }
    const summary = () =>
        root()
            .querySelector('.matchup__summary')
            ?.textContent?.replace(/\s+/g, ' ')
            .trim()

    it('fraco contra X OU Y mostra quem é fraco a pelo menos um dos tipos', async () => {
        await go('/pokedex?v=base&vs=STEEL,GROUND&match=or')
        expect(names()).toEqual(['Pikachu', 'Gengar', 'Dwebble'])
        expect(summary()).toContain(
            'Fracos contra Metálico ou Terra (pelo menos um)'
        )
    })

    it('fraco contra X E Y mostra só quem é fraco aos dois (hunt em dupla)', async () => {
        await go('/pokedex?v=base&vs=GROUND,GHOST')
        expect(names()).toEqual(['Gengar'])
        expect(summary()).toContain(
            'Fracos contra Terra e Fantasma (todos ao mesmo tempo)'
        )
    })

    it('resiste a X E/OU Y', async () => {
        await go('/pokedex?rel=resists&vs=STEEL,NORMAL&match=or')
        expect(names()).toEqual(['Pikachu', 'Dwebble'])
        await go('/pokedex?rel=resists&vs=STEEL,NORMAL')
        expect(names()).toEqual([])
    })

    it('clicar nos tipos do filtro de combate atualiza a lista', () => {
        const chip = (label: string) =>
            Array.from(
                root().querySelectorAll<HTMLButtonElement>(
                    '.matchup .type-chip'
                )
            ).find(b => b.textContent?.trim() === label) as HTMLButtonElement
        chip('Fantasma').click()
        harness.detectChanges()
        return harness.fixture.whenStable().then(() => {
            harness.detectChanges()
            expect(names()).toEqual(['Gengar', 'Shiny Gengar', 'Mega Gengar'])
        })
    })

    it('mostra as versões alternativas logo depois da forma base, com selo', () => {
        expect(names()).toEqual([
            'Pikachu',
            'Gengar',
            'Shiny Gengar',
            'Mega Gengar',
            'Dwebble'
        ])
        expect(
            tile('Shiny Gengar')
                .querySelector('.tile__mark')
                ?.textContent?.trim()
        ).toBe('✦')
        expect(
            tile('Mega Gengar')
                .querySelector('.tile__mark')
                ?.textContent?.trim()
        ).toBe('TM')
        expect(tile('Gengar').querySelector('.tile__mark')).toBeNull()
    })

    it('megas e TM/TR não têm o botão de capturado', () => {
        expect(
            tile('Shiny Gengar').querySelector('.tile__check')
        ).not.toBeNull()
        expect(tile('Mega Gengar').querySelector('.tile__check')).toBeNull()
    })

    it('filtra por versão e conta só normais e alternativas capturáveis', async () => {
        await go('/pokedex?v=shiny')
        expect(names()).toEqual(['Shiny Gengar'])
        await go('/pokedex?v=base')
        expect(names()).toEqual(['Pikachu', 'Gengar', 'Dwebble'])
        const stats = root()
            .querySelector('.hero__stats')
            ?.textContent?.replace(/\s+/g, ' ')
        expect(stats).toContain('0/3 normais')
        expect(stats).toContain('0/1 versões alternativas')
    })

    it('o detalhe lista as outras versões e troca entre elas', async () => {
        ;(
            tile('Gengar').querySelector('.tile__body') as HTMLButtonElement
        ).click()
        harness.detectChanges()
        const versions = () =>
            Array.from(root().querySelectorAll('.versions__name')).map(e =>
                e.textContent?.trim()
            )
        expect(versions()).toEqual([
            'Gengar',
            'Shiny Gengar',
            'Mega Gengar (TM)'
        ])

        const items =
            root().querySelectorAll<HTMLButtonElement>('.versions__item')
        items[2].click()
        harness.detectChanges()
        expect(root().querySelector('.detail__name')?.textContent?.trim()).toBe(
            'Mega Gengar (TM)'
        )
        expect(root().querySelector('.detail__toggle')).toBeNull()
        expect(root().querySelector('.detail__forged')?.textContent).toContain(
            'forjadas'
        )
    })

    it('não tem filtro de Joey Quest', () => {
        const labels = Array.from(root().querySelectorAll('[aria-label]')).map(
            e => e.getAttribute('aria-label')
        )
        expect(labels).not.toContain('Joey Quest')
    })
})
