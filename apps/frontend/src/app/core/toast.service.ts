import { Injectable, signal } from '@angular/core'

export interface Toast {
    id: number
    message: string
    kind: 'info' | 'error'
    action?: { label: string; run: () => void }
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private nextId = 1
    readonly toasts = signal<Toast[]>([])

    show(
        message: string,
        options: Partial<Omit<Toast, 'id' | 'message'>> = {}
    ) {
        const toast: Toast = {
            id: this.nextId++,
            message,
            kind: 'info',
            ...options
        }
        // Mantém no máximo 3 na tela.
        this.toasts.update(list => [...list.slice(-2), toast])
        setTimeout(
            () => this.dismiss(toast.id),
            toast.kind === 'error' ? 6000 : 4000
        )
    }

    dismiss(id: number) {
        this.toasts.update(list => list.filter(t => t.id !== id))
    }
}
