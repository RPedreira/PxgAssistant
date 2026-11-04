import { Route } from '@angular/router'

export const appRoutes: Route[] = [
    {
        path: '',
        title: 'PXG Assistant',
        loadComponent: () => import('./pages/home.page').then(m => m.HomePage)
    },
    {
        path: 'joey-quest',
        title: 'Joey Quest · PXG Assistant',
        loadComponent: () =>
            import('./pages/joey-quest.page').then(m => m.JoeyQuestPage)
    },
    {
        path: 'pokedex',
        title: 'Pokedex · PXG Assistant',
        loadComponent: () =>
            import('./pages/pokedex.page').then(m => m.PokedexPage)
    },
    { path: '**', redirectTo: '' }
]
