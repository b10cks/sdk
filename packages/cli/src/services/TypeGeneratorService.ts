import * as fs from 'node:fs'
import * as path from 'path'

import type { Block } from '@b10cks/mgmt-client'
import chalk from 'chalk'

import BaseService from './BaseService.js'

type BlockList = Record<string, { name: string; tags: string[] }>

export class TypesGeneratorService extends BaseService {
  private readonly outputDir: string
  private readonly generatedFilePath: string
  private readonly indexFilePath: string
  private allBlocks: BlockList = {}
  private generatedTypes: string[] = []
  private additionalTypeDeclarations: string[] = []
  private declaredAdditionalTypes = new Set<string>()

  constructor(outputDir: string = './b10cks/types') {
    super()
    if (!path.isAbsolute(outputDir)) {
      const appDir = path.join(process.cwd(), 'app')
      if (fs.existsSync(appDir)) {
        outputDir = path.join(appDir, outputDir)
      } else {
        outputDir = path.join(process.cwd(), outputDir)
      }
    }

    this.outputDir = outputDir
    this.generatedFilePath = path.join(this.outputDir, 'generated.d.ts')
    this.indexFilePath = path.join(this.outputDir, 'index.d.ts')
  }

  public async generate(spaceId: string) {
    const { data } = await this.client.blocks.list(spaceId, { per_page: 9999 })
    this.allBlocks = data.reduce<BlockList>((acc, block) => {
      const tags: string[] = (block as any).tags ?? []
      acc[block.slug] = { name: this.getInterfaceName(block.slug), tags }
      return acc
    }, {})

    this.generateTypes(data)
    this.displayGeneratedTypes()
  }

  private displayGeneratedTypes(): void {
    if (this.generatedTypes.length === 0) return

    console.log(`\n${chalk.green('✓')} TypeScript types generated successfully!`)
    console.log(`\n${chalk.bold('Generated Types:')}`)
    this.generatedTypes.forEach((type) => console.log(`${chalk.cyan(type)}`))
    console.log(`\n${chalk.bold('Location:')} ${this.outputDir}`)
    console.log(`${chalk.bold('Files:')} generated.d.ts, index.d.ts\n`)
  }

  public generateTypes(blocks: Block[]): void {
    this.ensureDirectoryExists(this.outputDir)
    this.generatedTypes = []
    this.additionalTypeDeclarations = []
    this.declaredAdditionalTypes = new Set()

    const typesContent = this.generateTypesContent(blocks)
    fs.writeFileSync(this.generatedFilePath, typesContent)
    this.createIndexFileIfNotExists()
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  private createIndexFileIfNotExists(): void {
    if (!fs.existsSync(this.indexFilePath)) {
      fs.writeFileSync(this.indexFilePath, `export * from './generated';\n`)
    }
  }

  private generateTypesContent(blocks: Block[]): string {
    let content = `export interface B10cksItem {
  id: string
  block: string
}

export type B10cksAsset = {
    url: string
    data: Record<string, never>
    metadata: {
      width: number
      height: number
    },
    id: string
    size: number
    type: "asset"
    filename: string
    extension: string
    full_path: string
    mime_type: string
}

export type B10cksLink = {
  url: string;
  type: 'url'
  target?: '_self' | '_blank' | '_parent' | '_top'
  rel?: string
} | {
  email: string
  type: 'email'
} | {
  type: 'internal'
  url: string
  title: string
  content: string
  target?: '_self' | '_blank' | '_parent' | '_top'
}

export interface B10cksRichTextMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface B10cksRichTextNode {
  type: string
  attrs?: Record<string, unknown>
  content?: B10cksRichTextNode[]
  marks?: B10cksRichTextMark[]
  text?: string
}

export interface B10cksRichText {
  type: 'doc'
  content?: B10cksRichTextNode[]
}

export type B10cksMeta = {
  title?: string
  description?: string
  canonical?: B10cksLink
  robots?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: B10cksAsset | null
}

export type B10cksTableCell = string | number | boolean | null

export interface B10cksTableRow {
  id: string
  cells: Record<string, B10cksTableCell>
}

export interface B10cksTable {
  header: Record<string, string>
  rows: B10cksTableRow[]
}

`
    const blockInterfaces: string[] = []

    blocks.forEach((block) => {
      const typeName = this.getInterfaceName(block.slug)
      const interfaceContent = this.generateInterfaceContent(block, typeName)
      blockInterfaces.push(interfaceContent)
      this.generatedTypes.push(typeName)
    })

    if (this.additionalTypeDeclarations.length > 0) {
      content += `${this.additionalTypeDeclarations.join('\n')}\n`
    }

    content += blockInterfaces.join('')
    return content
  }

  private getInterfaceName(slug: string): string {
    return `B10cks${slug.charAt(0).toUpperCase()}${slug.slice(1)}`
  }

  private generateInterfaceContent(block: Block, typeName: string): string {
    let content = `export interface ${typeName} extends B10cksItem {\n`

    if (block.schema) {
      const properties = Object.entries(block.schema).map(([key, schema]: [string, any]) => {
        const type = this.mapSchemaTypeToTsType(schema.type, key, block.slug, schema)
        const optional = !schema.required ? '?' : ''
        return `\t${key}${optional}: ${type}`
      })

      content += `${properties.join('\n')}\n`
    }

    content += '}\n\n'
    return content
  }

  private mapSchemaTypeToTsType(
    schemaType: string,
    _key: string,
    _blockSlug: string,
    schema: any
  ): string {
    switch (this.normalizeSchemaType(schemaType)) {
      case 'date':
      case 'text':
      case 'textarea':
      case 'markdown':
        return 'string'
      case 'richtext':
        return 'B10cksRichText'
      case 'boolean':
        return 'boolean'
      case 'number':
        return 'number'
      case 'link':
        return 'B10cksLink'
      case 'asset':
        return 'B10cksAsset'
      case 'multi_assets':
        return 'Array<B10cksAsset>'
      case 'references':
        return 'string[]'
      case 'blocks': {
        const whitelistTypes: string[] = []
        if (
          schema.restrict_blocks &&
          (schema.block_whitelist?.length > 0 || schema.tag_whitelist?.length > 0)
        ) {
          schema.block_whitelist?.forEach((blockSlug: string) => {
            if (this.allBlocks[blockSlug]) {
              whitelistTypes.push(this.allBlocks[blockSlug].name)
            }
          })

          schema.tag_whitelist?.forEach((tag: string) => {
            const matchingBlocks = Object.entries(this.allBlocks)
              .filter(([_, block]) => block.tags?.includes(tag))
              .map(([_, block]) => block.name)
            whitelistTypes.push(...matchingBlocks)
          })

          if (whitelistTypes.length === 1) return `${whitelistTypes[0]}[]`
          if (whitelistTypes.length > 1) return `Array<${whitelistTypes.join(' | ')}>`
        }

        return 'Array<B10cksItem>'
      }
      case 'option':
        if (schema.options && Array.isArray(schema.options)) {
          const optionValues = schema.options
            .filter((option: any) => option.value !== undefined)
            .map((option: any) => `'${option.value}'`)
          if (optionValues.length > 0) return optionValues.join(' | ')
        }
        return 'string'
      case 'options': {
        const optionType = this.mapSchemaTypeToTsType('option', _key, _blockSlug, schema)
        return optionType === 'string' ? 'string[]' : `Array<${optionType}>`
      }
      case 'meta':
        return 'B10cksMeta'
      case 'table':
        return this.registerTableType(_blockSlug, _key, schema)
      default:
        return 'any'
    }
  }

  private registerTableType(blockSlug: string, key: string, schema: any): string {
    const columns = Array.isArray(schema?.columns) ? schema.columns : []
    if (columns.length === 0) return 'B10cksTable'

    const baseTypeName = `B10cks${this.toPascalCase(blockSlug)}${this.toPascalCase(key)}`
    const tableTypeName = `${baseTypeName}Table`
    const rowTypeName = `${baseTypeName}TableRow`

    if (this.declaredAdditionalTypes.has(tableTypeName)) return tableTypeName

    const columnKeys = columns
      .map((column: any) => column?.key)
      .filter((columnKey: unknown): columnKey is string => typeof columnKey === 'string' && columnKey !== '')

    if (columnKeys.length === 0) return 'B10cksTable'

    const headerKeyType = columnKeys.map((columnKey: string) => JSON.stringify(columnKey)).join(' | ')
    const cellProperties = columns
      .filter((column: any): column is { key: string; type?: string; options?: Array<{ value?: string }> } =>
        typeof column?.key === 'string' && column.key !== '')
      .map((column: any) => `    ${JSON.stringify(column.key)}?: ${this.mapTableColumnTypeToTsType(column)}`)

    this.additionalTypeDeclarations.push(`export interface ${rowTypeName} {
  id: string
  cells: {
${cellProperties.join('\n')}
  }
}

export interface ${tableTypeName} {
  header: Partial<Record<${headerKeyType}, string>>
  rows: ${rowTypeName}[]
}
`)
    this.declaredAdditionalTypes.add(tableTypeName)
    return tableTypeName
  }

  private mapTableColumnTypeToTsType(column: {
    type?: string
    options?: Array<{ value?: string }>
  }): string {
    switch (column.type) {
      case 'text':
        return 'string'
      case 'number':
        return 'number | null'
      case 'boolean':
        return 'boolean'
      case 'option': {
        if (Array.isArray(column.options) && column.options.length > 0) {
          const optionValues = column.options
            .filter((option): option is { value: string } => typeof option?.value === 'string')
            .map((option) => `'${option.value}'`)
          if (optionValues.length > 0) return `${optionValues.join(' | ')} | null`
        }
        return 'string | null'
      }
      default:
        return 'B10cksTableCell'
    }
  }

  private normalizeSchemaType(schemaType: string): string {
    switch (schemaType) {
      case 'block':
        return 'blocks'
      case 'multiAsset':
        return 'multi_assets'
      case 'reference':
        return 'references'
      default:
        return schemaType
    }
  }

  private toPascalCase(value: string): string {
    const parts = value.split(/[^a-zA-Z0-9]+/).filter(Boolean)
    if (parts.length === 0) return 'Value'
    return parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('')
  }
}
