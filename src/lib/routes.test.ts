import { describe, expect, it } from 'vitest'
import { EXERCISE_MODES } from '../core/exercise'
import { ABOUT_PATH, DEFAULT_ROUTE, ROUTE_PATH, isAboutPath, isExerciseMode, pathForRoute, routeFromPath, type Route } from './routes'

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

  it('o dicionário é destino, mas não é exercício', () => {
    expect(isExerciseMode('dictionary')).toBe(false)
    for (const m of EXERCISE_MODES) expect(isExerciseMode(m)).toBe(true)
  })

  it('a página Sobre não é destino de estudo', () => {
    expect(isAboutPath(ABOUT_PATH)).toBe(true)
    expect(isAboutPath(`${ABOUT_PATH}/`)).toBe(true)
    for (const r of ROUTES) expect(pathForRoute(r)).not.toBe(ABOUT_PATH)
    expect(isAboutPath(pathForRoute('dictionary'))).toBe(false)
  })
})
