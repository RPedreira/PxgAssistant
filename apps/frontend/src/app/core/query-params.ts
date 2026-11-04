import { inject } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { ActivatedRoute, Params, Router } from '@angular/router'

/**
 * Filtros guardados na URL (?type=FIRE&status=missing): sobrevivem ao F5 e
 * podem ser salvos como favorito.
 */
export function injectQueryParams() {
    const router = inject(Router)
    const route = inject(ActivatedRoute)
    const params = toSignal(route.queryParamMap, { requireSync: true })

    return {
        get: (key: string) => params().get(key),
        getList: (key: string) =>
            params().get(key)?.split(',').filter(Boolean) ?? [],
        set(changes: Params) {
            const queryParams: Params = {}
            for (const [key, value] of Object.entries(changes)) {
                const empty =
                    value === '' ||
                    value === undefined ||
                    value === null ||
                    (Array.isArray(value) && value.length === 0)
                queryParams[key] = empty
                    ? null
                    : Array.isArray(value)
                    ? value.join(',')
                    : value
            }
            router.navigate([], {
                relativeTo: route,
                queryParams,
                queryParamsHandling: 'merge',
                replaceUrl: true
            })
        },
        clear() {
            router.navigate([], {
                relativeTo: route,
                queryParams: {},
                replaceUrl: true
            })
        }
    }
}

export function toggleInList<T>(list: T[], value: T): T[] {
    return list.includes(value)
        ? list.filter(v => v !== value)
        : [...list, value]
}
