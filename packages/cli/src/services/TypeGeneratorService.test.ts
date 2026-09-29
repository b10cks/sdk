import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import type { Block } from '@b10cks/mgmt-client'
import { afterEach, expect, it, vi } from 'vitest'

import { TypesGeneratorService } from './TypeGeneratorService'

const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

it('maps every block slug to its generated type', () => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  const dir = mkdtempSync(join(tmpdir(), 'b10cks-types-'))
  dirs.push(dir)
  const blocks = [
    { slug: 'hero_section', schema: { title: { type: 'text' } } },
    { slug: 'card', schema: {} },
  ] as unknown as Block[]

  new TypesGeneratorService(dir).generateTypes(blocks)

  const generated = readFileSync(join(dir, 'generated.d.ts'), 'utf8')
  expect(generated).toContain(`export interface B10cksBlockMap {
\t"hero_section": B10cksHeroSection
\t"card": B10cksCard
}`)
  expect(generated).toContain('export type B10cksBlock = B10cksBlockMap[keyof B10cksBlockMap]')
})
