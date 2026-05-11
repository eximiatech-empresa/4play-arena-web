import { describe, it, expect } from 'vitest'
import { calculateUsedPlays, calculateProgressPct } from '@/core/math/wallet-math'

describe('calculateUsedPlays', () => {
  it('deve retornar a diferença entre totalPlays e balance quando balance < totalPlays', () => {
    // Arrange & Act
    const resultado = calculateUsedPlays(24, 10)

    // Assert
    expect(resultado).toBe(14)
  })

  it('deve retornar 0 quando balance supera totalPlays (proteção com Math.max)', () => {
    // Arrange & Act
    const resultado = calculateUsedPlays(10, 15)

    // Assert
    expect(resultado).toBe(0)
  })

  it('deve retornar 0 quando totalPlays e balance são iguais', () => {
    // Arrange & Act
    const resultado = calculateUsedPlays(8, 8)

    // Assert
    expect(resultado).toBe(0)
  })
})

describe('calculateProgressPct', () => {
  it('deve retornar 50 quando o balance é exatamente metade do totalPlays', () => {
    // Arrange & Act
    const resultado = calculateProgressPct(24, 12)

    // Assert
    expect(resultado).toBe(50)
  })

  it('deve retornar 100 quando o balance é igual ao totalPlays', () => {
    // Arrange & Act
    const resultado = calculateProgressPct(24, 24)

    // Assert
    expect(resultado).toBe(100)
  })

  it('deve retornar 0 quando totalPlays é zero (proteção contra divisão por zero)', () => {
    // Arrange & Act
    const resultado = calculateProgressPct(0, 0)

    // Assert
    expect(resultado).toBe(0)
  })

  it('deve arredondar o resultado para o inteiro mais próximo', () => {
    // Arrange
    // balance=7, total=24 → 7/24 * 100 = 29.16... → round → 29
    const resultado = calculateProgressPct(24, 7)

    // Assert
    expect(resultado).toBe(29)
  })
})
