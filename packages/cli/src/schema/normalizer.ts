/**
 * TypeScript port of the CMS block-schema normalization pipeline.
 *
 * The CMS normalizes a block's schema three times before it is served back:
 *   1. request:  SchemaField::normalizeAttributes per field (FormRequest)
 *   2. store:    SchemaNormalizer::normalizeField per field (SchemaCast::set)
 *   3. serve:    SchemaField::normalizeAttributes again (SchemaCast::get)
 *
 * normalizeBlockSchema() composes the same three passes so a locally authored
 * schema can be compared against an API response without false diffs. Kept in
 * lock-step with the PHP implementation via the shared fixtures in
 * __fixtures__/schema-normalization-pipeline.json (also asserted in the CMS
 * repo — regenerate and copy both when the CMS pipeline changes).
 */

export type SchemaFieldAttributes = Record<string, unknown>
export type BlockSchemaMap = Record<string, SchemaFieldAttributes>
/** Unvalidated schema input — non-object fields are dropped, like in the CMS. */
export type BlockSchemaInput = Record<string, unknown>

const FIELD_TYPE_ALIASES: Record<string, string> = {
  block: 'blocks',
  multiAsset: 'multi_assets',
  reference: 'references',
}

const FIELD_TRANSLATABLE_TYPES = new Set([
  'text',
  'textarea',
  'markdown',
  'richtext',
  'number',
  'link',
  'meta',
  'date',
  'table',
])

const FIELD_INDEXABLE_DEFAULTS: Record<string, boolean> = {
  text: true,
  textarea: true,
  markdown: true,
  richtext: true,
  meta: false,
  link: false,
  number: false,
  boolean: false,
  date: false,
  asset: false,
  multi_assets: false,
  references: false,
  blocks: false,
  option: false,
  options: false,
  table: false,
}

const STORE_TRANSLATABLE_TYPES = new Set([
  'text',
  'textarea',
  'markdown',
  'richtext',
  'number',
  'option',
  'link',
  'date',
  'meta',
  'table',
])

const STORE_INDEXABLE_TYPES = new Set(['text', 'textarea', 'markdown', 'richtext', 'meta'])

// ─── PHP semantics helpers ───────────────────────────────────────────────────

type Dict = Record<string, unknown>

const isDict = (value: unknown): value is Dict =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/** PHP \is_array() is true for both JSON objects and JSON lists. */
const isPhpArray = (value: unknown): value is Dict | unknown[] =>
  value !== null && typeof value === 'object'

/** PHP (bool) cast. */
const phpBool = (value: unknown): boolean => {
  if (Array.isArray(value)) return value.length > 0
  if (isDict(value)) return Object.keys(value).length > 0
  return !(value === false || value === 0 || value === '' || value === '0' || value == null)
}

/** PHP (string) cast. */
const phpStr = (value: unknown): string => {
  if (value == null) return ''
  if (value === true) return '1'
  if (value === false) return ''
  return String(value)
}

/** PHP empty(). */
const phpEmpty = (value: unknown): boolean => !phpBool(value)

/** PHP `?? null`: undefined becomes null, everything else passes through. */
const orNull = (value: unknown): unknown => (value === undefined ? null : value)

/** PHP json_encode() turns empty assoc arrays into []. */
const emptyToList = (value: Dict): Dict | [] => (Object.keys(value).length === 0 ? [] : value)

const asEntries = (value: Dict | unknown[]): unknown[] =>
  Array.isArray(value) ? value : Object.values(value)

// ─── Shared condition helpers ────────────────────────────────────────────────

const LEGACY_OPERATORS: Record<string, string> = {
  '=': 'equals',
  '==': 'equals',
  '!=': 'not_equals',
  '>': 'gt',
  '>=': 'gte',
  '<': 'lt',
  '<=': 'lte',
  in: 'in',
  not_in: 'not_in',
  empty: 'is_empty',
  not_empty: 'is_not_empty',
}

const normalizeOperator = (operator: string): string => LEGACY_OPERATORS[operator] ?? operator

// ─── Pass 1 & 3: SchemaField::normalizeAttributes ────────────────────────────

const fieldCanonicalizeType = (type: unknown): string => {
  const str = phpStr(type)
  return FIELD_TYPE_ALIASES[str] ?? str
}

const fieldNormalizeConditions = (attributes: Dict): Dict | null => {
  let raw = attributes.conditions ?? null

  if (!isPhpArray(raw) && isPhpArray(attributes.dependencies)) {
    raw = { mode: 'all', rules: attributes.dependencies }
  }

  if (!isPhpArray(raw)) return null

  const rawDict = raw as Dict
  const source = rawDict.rules ?? raw
  const rules = asEntries(isPhpArray(source) ? source : [])
    .filter((rule): rule is Dict => isDict(rule) && rule.field != null)
    .map((rule) => ({
      field: phpStr(rule.field),
      operator: normalizeOperator(phpStr(rule.operator ?? 'equals')),
      value: orNull(rule.value),
    }))

  if (rules.length === 0) return null

  return {
    mode: (rawDict.mode ?? 'all') === 'any' ? 'any' : 'all',
    rules,
  }
}

const FIELD_VALIDATION_SOURCES: Record<string, string[]> = {
  min: ['min', 'minimum'],
  max: ['max', 'maximum'],
  min_length: ['min_length', 'minimum_length'],
  max_length: ['max_length', 'maximum_length', 'maximum'],
  pattern: ['pattern'],
  allowed_values: ['allowed_values'],
  min_items: ['min_items', 'min'],
  max_items: ['max_items', 'max'],
}

const fieldNormalizeValidation = (attributes: Dict): Dict | [] => {
  const validation: Dict = isDict(attributes.validation) ? { ...attributes.validation } : {}

  for (const [target, sources] of Object.entries(FIELD_VALIDATION_SOURCES)) {
    if (target in validation) continue

    for (const source of sources) {
      if (source in attributes) {
        validation[target] = attributes[source]
        break
      }
    }
  }

  for (const [key, value] of Object.entries(validation)) {
    if (value === null || value === '') delete validation[key]
  }

  return emptyToList(validation)
}

const normalizeTableColumns = (columns: unknown): Dict[] => {
  if (!isPhpArray(columns)) return []

  return asEntries(columns)
    .filter(isDict)
    .map((column) => {
      const type = phpStr(column.type ?? '')
      const normalized: Dict = {
        key: phpStr(column.key ?? ''),
        label: phpStr(column.label ?? ''),
        type,
      }

      if (type === 'option') {
        normalized.source = (column.source ?? 'self') === 'datasource' ? 'datasource' : 'self'
        normalized.options = isPhpArray(column.options)
          ? asEntries(column.options)
              .filter(isDict)
              .map((option) => ({
                name: phpStr(option.name ?? ''),
                value: phpStr(option.value ?? ''),
              }))
          : []
        normalized.data_source_id = orNull(column.data_source_id)
      }

      return normalized
    })
}

const normalizeTableDefault = (value: unknown): Dict => {
  if (!isPhpArray(value)) {
    return { header: [], rows: [] }
  }

  const dict = value as Dict

  const header: Dict = {}
  if (isDict(dict.header)) {
    for (const [key, entry] of Object.entries(dict.header)) {
      if (typeof entry === 'string') header[key] = entry
    }
  }

  const rows = isPhpArray(dict.rows)
    ? asEntries(dict.rows)
        .filter(isDict)
        .map((row) => ({
          id: phpStr(row.id ?? ''),
          cells: isPhpArray(row.cells)
            ? isDict(row.cells)
              ? emptyToList(row.cells)
              : row.cells
            : [],
        }))
    : []

  return { header: emptyToList(header), rows }
}

const fieldNormalizeAttributes = (
  key: string,
  input: SchemaFieldAttributes
): SchemaFieldAttributes => {
  const attributes: Dict = { ...input }

  attributes.key = key
  attributes.type = fieldCanonicalizeType(attributes.type ?? '')
  attributes.name = attributes.name ?? attributes.label ?? key
  attributes.description = orNull(attributes.description)
  attributes.required = phpBool(attributes.required ?? false)
  attributes.translatable = FIELD_TRANSLATABLE_TYPES.has(attributes.type as string)
    ? phpBool(attributes.translatable ?? false)
    : false
  attributes.indexable = phpBool(
    attributes.indexable ?? FIELD_INDEXABLE_DEFAULTS[attributes.type as string] ?? false
  )
  attributes.conditions = fieldNormalizeConditions(attributes)
  attributes.validation = fieldNormalizeValidation(attributes)

  if (attributes.type === 'option' || attributes.type === 'options') {
    attributes.source = (attributes.source ?? 'self') === 'datasource' ? 'datasource' : 'self'
    attributes.data_source_id = orNull(attributes.data_source_id)
  }

  if (attributes.type === 'table') {
    const validation = attributes.validation as Dict
    attributes.has_thead = phpBool(attributes.has_thead ?? false)
    attributes.min = 'min' in input ? orNull(input.min) : orNull(validation.min)
    attributes.max = 'max' in input ? orNull(input.max) : orNull(validation.max)
    attributes.columns = normalizeTableColumns(attributes.columns ?? [])
    attributes.default = normalizeTableDefault(attributes.default ?? null)
  }

  delete attributes.dependencies

  return attributes
}

// ─── Pass 2: SchemaNormalizer::normalizeField ────────────────────────────────

const storeNormalizeConditions = (attributes: Dict): Dict | null => {
  let conditions = attributes.conditions ?? null

  if (conditions === null && isPhpArray(attributes.dependencies)) {
    conditions = {
      mode: 'all',
      rules: asEntries(attributes.dependencies).map((dependency) => {
        const dict = isDict(dependency) ? dependency : {}
        return {
          field: phpStr(dict.field ?? ''),
          operator: normalizeOperator(phpStr(dict.operator ?? '=')),
          value: orNull(dict.value),
        }
      }),
    }
  }

  if (!isPhpArray(conditions)) return null

  const dict = conditions as Dict
  const mode = phpStr(dict.mode ?? 'all').toLowerCase()
  const rules: Dict[] = []

  for (const rule of asEntries(isPhpArray(dict.rules) ? (dict.rules as Dict | unknown[]) : [])) {
    if (!isDict(rule) || phpEmpty(rule.field)) continue

    const entry: Dict = {
      field: phpStr(rule.field),
      operator: normalizeOperator(phpStr(rule.operator ?? 'equals')),
      value: orNull(rule.value),
    }
    if (entry.value === null) delete entry.value

    rules.push(entry)
  }

  if (rules.length === 0) return null

  return {
    mode: mode === 'all' || mode === 'any' ? mode : 'all',
    rules,
  }
}

const allowedValuesFromOptions = (attributes: Dict): unknown => {
  if ((attributes.source ?? 'self') === 'datasource') return null

  if (attributes.allowed_values !== undefined && attributes.allowed_values !== null) {
    return attributes.allowed_values
  }

  const options = isPhpArray(attributes.options) ? asEntries(attributes.options) : []
  return options
    .map((option) => (isDict(option) ? (option.value ?? null) : null))
    .filter((value) => phpBool(value))
}

const storeNormalizeValidation = (type: string, attributes: Dict): Dict | null => {
  const validation: Dict =
    isPhpArray(attributes.validation) && isDict(attributes.validation)
      ? { ...attributes.validation }
      : {}

  if ('min_items' in validation && !('min' in validation)) validation.min = validation.min_items
  if ('max_items' in validation && !('max' in validation)) validation.max = validation.max_items
  delete validation.min_items
  delete validation.max_items

  let fallbacks: Dict = {}
  switch (type) {
    case 'text':
    case 'textarea':
    case 'markdown':
    case 'richtext':
      fallbacks = {
        min_length: orNull(attributes.min_length),
        max_length: orNull(attributes.max_length ?? attributes.maximum),
        pattern: orNull(attributes.pattern),
      }
      break
    case 'number':
    case 'date':
      fallbacks = {
        min: orNull(attributes.min ?? attributes.minimum),
        max: orNull(attributes.max ?? attributes.maximum),
      }
      break
    case 'multi_assets':
    case 'references':
    case 'blocks':
    case 'options':
    case 'table':
      fallbacks = {
        min: orNull(attributes.min),
        max: orNull(attributes.max),
      }
      break
    case 'option':
      fallbacks = { allowed_values: allowedValuesFromOptions(attributes) }
      break
  }

  for (const [key, value] of Object.entries(fallbacks)) {
    if (value !== null && !(key in validation)) validation[key] = value
  }

  return Object.keys(validation).length === 0 ? null : validation
}

const storeNormalizeField = (
  key: string,
  attributes: SchemaFieldAttributes
): SchemaFieldAttributes => {
  const type = fieldCanonicalizeType(attributes.type ?? '')

  const normalized: Dict = {
    key,
    type,
    name: attributes.name ?? attributes.label ?? key,
    description: orNull(attributes.description),
    required: phpBool(attributes.required ?? false),
    translatable: STORE_TRANSLATABLE_TYPES.has(type)
      ? phpBool(attributes.translatable ?? false)
      : false,
    indexable:
      'indexable' in attributes ? phpBool(attributes.indexable) : STORE_INDEXABLE_TYPES.has(type),
    default: orNull(attributes.default),
    conditions: storeNormalizeConditions(attributes),
    validation: storeNormalizeValidation(type, attributes),
  }

  if (type === 'option' || type === 'options') {
    normalized.source = (attributes.source ?? 'self') === 'datasource' ? 'datasource' : 'self'
    normalized.data_source_id = orNull(attributes.data_source_id)
  }

  if (type === 'table') {
    normalized.has_thead = phpBool(attributes.has_thead ?? false)
    normalized.columns = normalizeTableColumns(attributes.columns ?? [])
    normalized.default = normalizeTableDefault(attributes.default ?? null)
  }

  for (const [attribute, value] of Object.entries(attributes)) {
    if (attribute in normalized || attribute === 'dependencies' || attribute === 'label') continue
    normalized[attribute] = value
  }

  return normalized
}

// ─── Composition ─────────────────────────────────────────────────────────────

const sortFields = (schema: BlockSchemaMap): BlockSchemaMap => {
  const entries = Object.entries(schema)
  // Stable sort, matching Laravel's Collection::sortBy with a 999 default.
  entries.sort((a, b) => {
    const orderA = Number(a[1].order ?? 999)
    const orderB = Number(b[1].order ?? 999)
    return orderA - orderB
  })

  return Object.fromEntries(entries)
}

const mapFields = (
  schema: BlockSchemaInput,
  normalize: (key: string, field: SchemaFieldAttributes) => SchemaFieldAttributes
): BlockSchemaMap => {
  const result: BlockSchemaMap = {}

  for (const [key, field] of Object.entries(schema)) {
    if (!isDict(field)) continue
    result[key] = normalize(key, field)
  }

  return result
}

/** Pass 1/3 of the CMS pipeline: per-field normalization + order sorting. */
export const requestNormalizeSchema = (schema: BlockSchemaInput): BlockSchemaMap =>
  sortFields(mapFields(schema, fieldNormalizeAttributes))

/** Pass 2 of the CMS pipeline (SchemaCast::set). */
export const storeNormalizeSchema = (schema: BlockSchemaInput): BlockSchemaMap =>
  mapFields(schema, storeNormalizeField)

/**
 * Full request → store → serve pipeline. The result is exactly what the
 * management API serves back after the given schema is pushed, making local
 * and remote schemas directly comparable.
 */
export const normalizeBlockSchema = (schema: BlockSchemaInput): BlockSchemaMap =>
  requestNormalizeSchema(storeNormalizeSchema(requestNormalizeSchema(schema)))
