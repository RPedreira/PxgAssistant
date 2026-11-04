import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { AppComponent } from './app.component'

describe('AppComponent', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppComponent],
            providers: [provideRouter([])]
        }).compileComponents()
    })

    it('renderiza a navegação principal', () => {
        const fixture = TestBed.createComponent(AppComponent)
        fixture.detectChanges()
        const links = Array.from(
            (fixture.nativeElement as HTMLElement).querySelectorAll('.nav a')
        )
        expect(links.map(a => a.textContent?.trim())).toEqual([
            'Início',
            'Joey Quest',
            'Pokedex'
        ])
    })
})
