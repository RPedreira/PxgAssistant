import { Component, inject } from '@angular/core'
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { ToastService } from './core/toast.service'

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterLink, RouterLinkActive],
    template: `
        <header class="topbar">
            <a class="brand" routerLink="/">
                <img
                    src="sprites/misc/four-leaf-clover.gif"
                    alt=""
                    width="24"
                    height="24"
                    class="sprite"
                />
                <span class="brand__text">PXG Assistant</span>
            </a>
            <nav class="nav">
                <a
                    routerLink="/"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: true }"
                    >Início</a
                >
                <a routerLink="/joey-quest" routerLinkActive="active"
                    >Joey Quest</a
                >
                <a routerLink="/pokedex" routerLinkActive="active">Pokedex</a>
            </nav>
        </header>

        <main class="page">
            <router-outlet />
        </main>

        <div class="toasts" aria-live="polite">
            @for (t of toast.toasts(); track t.id) {
            <div class="toast" [class.toast--error]="t.kind === 'error'">
                <span>{{ t.message }}</span>
                @if (t.action; as action) {
                <button
                    type="button"
                    class="link-button"
                    (click)="action.run(); toast.dismiss(t.id)"
                >
                    {{ action.label }}
                </button>
                }
                <button
                    type="button"
                    class="icon-button"
                    aria-label="Fechar aviso"
                    (click)="toast.dismiss(t.id)"
                >
                    ✕
                </button>
            </div>
            }
        </div>
    `
})
export class AppComponent {
    protected readonly toast = inject(ToastService)
}
