import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import {
    JoeyQuestSummaryDto,
    PokemonDto,
    UpdatePokemonDto
} from '@internal/shared'

@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly http = inject(HttpClient)
    private readonly base = '/api'

    pokemons() {
        return this.http.get<PokemonDto[]>(`${this.base}/pokemons`)
    }

    joeyQuest() {
        return this.http.get<JoeyQuestSummaryDto>(`${this.base}/joey-quest`)
    }

    updatePokemon(name: string, body: UpdatePokemonDto) {
        return this.http.patch<PokemonDto>(
            `${this.base}/pokemons/${encodeURIComponent(name)}`,
            body
        )
    }
}
