import { describe, expect, it } from 'vitest'
import { EXERCISE_MODES } from '../core/exercise'
import { ABOUT_PATH, DEFAULT_ROUTE, ROUTE_PATH, isAboutPath, isExerciseMode, parseRoute, pathForRoute, routeFromPath, type Route } from './routes'

const ROUTES = Object.keys(ROUTE_PATH) as Route[]

describe('rotas', () => {
  it('ida e volta: todo destino tem um caminho único que resolve para ele', () => {
    const paths = ROUTES.map(pathForRoute)
    expect(new Set(paths).size).toBe(ROUTES.length)
    for (const r of ROUTES) expect(routeFromPath(pathForRoute(r))).toBe(r)
  })

  it('os caminhos são kebab-case em inglês', () => {
    for (const path of [...ROUTES.map(pathForRoute), ABOUT_PATH]) {
      expect(path).toMatch(/^\/[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('ignora a barra final e cai no padrão em caminho desconhecido', () => {
    expect(routeFromPath('/dictionary/')).toBe('dictionary')
    expect(routeFromPath('/')).toBe(DEFAULT_ROUTE)
    expect(routeFromPath('/nao-existe')).toBe(DEFAULT_ROUTE)
  })

  it('sem destino na URL, volta ao último aberto', () => {
    expect(routeFromPath('/', 'dictionary')).toBe('dictionary')
    expect(routeFromPath('/link-velho', 'symbolToKeys')).toBe('symbolToKeys')
    expect(routeFromPath('/keys-to-chord', 'dictionary')).toBe('keysToSymbol')
  })

  it('só aceita como último destino um id que ainda existe', () => {
    for (const r of ROUTES) expect(parseRoute(r)).toBe(r)
    expect(parseRoute('scales')).toBeNull()
    expect(parseRoute('toString')).toBeNull()
    expect(parseRoute(null)).toBeNull()
  })

  it('o dicionário é destino, mas não é exercício', () => {
    expect(isExerciseMode('dictionary')).toBe(false)
    for (const m of EXERCISE_MODES) expect(isExerciseMode(m)).toBe(true)
  })

  it('a página Sobre não é destino de estudo', () => {
    expect(isAboutPath(ABOUT_PATH)).toBe(true)
    expect(isAboutPath(`${ABOUT_PATH}/`)).toBe(true)
    for (const r of ROUTES) expect(pathForRoute(r)).not.toBe(ABOUT_PATH)
    expect(isAboutPath(pathForRoute('dictionary'))).toBe(false)
    expect(routeFromPath(ABOUT_PATH, 'dictionary')).toBe('dictionary')
  })
})
