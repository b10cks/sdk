import type { Space, Team } from '@b10cks/mgmt-client'
import { ManagementApiError, ManagementClient } from '@b10cks/mgmt-client'

async function advancedExample() {
  const client = new ManagementClient({
    baseUrl: process.env.B10CKS_API_URL || 'https://api.b10cks.com',
    token: process.env.B10CKS_TOKEN || '',
    timeout: 60000,
  })

  try {
    console.log('🚀 Advanced b10cks Management Client Usage\n')

    const organizationTeam = await createOrganizationStructure(client)
    const space = await setupProductionSpace(client, organizationTeam.id)
    await setupBlocksAndContent(client, space.id)
    await configureAssets(client, space.id)
    await setupRedirects(client, space.id)
    await configureTokens(client, space.id)
    await demonstratePagination(client, space.id)
    await demonstrateVersionControl(client, space.id)

    console.log('\n✅ Advanced operations completed successfully!')
  } catch (error) {
    handleError(error)
  }
}

async function createOrganizationStructure(client: ManagementClient): Promise<Team> {
  console.log('📊 Creating organization structure...')

  const rootTeam = await client.teams.create({
    name: 'Acme Corporation',
    icon: '🏢',
    color: '#2C3E50',
    description: 'Main organization',
  })
  console.log(`✓ Created root team: ${rootTeam.name}`)

  const engineeringTeam = await client.teams.create({
    name: 'Engineering',
    icon: '⚙️',
    color: '#3498DB',
    description: 'Engineering department',
    parent_id: rootTeam.id,
  })
  console.log(`✓ Created engineering team: ${engineeringTeam.name}`)

  const marketingTeam = await client.teams.create({
    name: 'Marketing',
    icon: '📢',
    color: '#E74C3C',
    description: 'Marketing department',
    parent_id: rootTeam.id,
  })
  console.log(`✓ Created marketing team: ${marketingTeam.name}`)

  const hierarchy = await client.teams.getHierarchy()
  console.log('✓ Team hierarchy created:', JSON.stringify(hierarchy, null, 2))

  return rootTeam
}

async function setupProductionSpace(client: ManagementClient, teamId: string): Promise<Space> {
  console.log('\n🌐 Setting up production space...')

  const space = await client.spaces.create({
    name: 'Production Website',
    slug: 'production-website',
    icon: '🌍',
    color: '#27AE60',
    description: 'Production website content',
    team_id: teamId,
    settings: {
      timezone: 'UTC',
      locale: 'en-US',
      features: {
        versioning: true,
        ai_assistance: true,
        collaborative_editing: true,
      },
    },
  })
  console.log(`✓ Created space: ${space.name}`)

  const stats = await client.spaces.getStats(space.id)
  console.log('✓ Space statistics:', stats)

  return space
}

async function setupBlocksAndContent(client: ManagementClient, spaceId: string): Promise<void> {
  console.log('\n📦 Setting up blocks and content...')

  await client.blockFolders.create(spaceId)
  console.log('✓ Created blog folder')

  await client.blockTags.create(spaceId)
  console.log('✓ Created blog tag')

  await client.blockTags.create(spaceId)
  console.log('✓ Created SEO tag')

  const allTags = await client.blockTags.list(spaceId)
  console.log(`✓ Total tags created: ${allTags.meta.total}`)

  await client.blocks.create(spaceId)
  console.log('✓ Created article block')

  const blocks = await client.blocks.list(spaceId, {
    per_page: 10,
    sort: '-created_at',
    include_archived: false,
  })
  console.log(`✓ Listed ${blocks.data.length} blocks`)

  const content = await client.contents.create(spaceId)
  console.log('✓ Created content entry')

  await client.contents.update(spaceId, content.id)
  console.log('✓ Updated content entry')

  await client.contents.publish(spaceId, content.id)
  console.log('✓ Published content')

  const publishedContents = await client.contents.list(spaceId, {
    published: true,
    per_page: 50,
  })
  console.log(`✓ Found ${publishedContents.meta.total} published contents`)
}

async function configureAssets(client: ManagementClient, spaceId: string): Promise<void> {
  console.log('\n🖼️  Configuring asset management...')

  await client.assetFolders.create(spaceId)
  console.log('✓ Created images folder')

  await client.assetFolders.create(spaceId)
  console.log('✓ Created videos folder')

  await client.assetTags.create(spaceId)
  console.log('✓ Created brand asset tag')

  await client.assetTags.create(spaceId)
  console.log('✓ Created product asset tag')

  const assets = await client.assets.list(spaceId)
  console.log(`✓ Listed ${assets.data.length} assets`)

  const allFolders = await client.assetFolders.list(spaceId)
  console.log(`✓ Total asset folders: ${allFolders.meta.total}`)
}

async function setupRedirects(client: ManagementClient, spaceId: string): Promise<void> {
  console.log('\n🔀 Setting up redirects...')

  await client.redirects.create(spaceId)
  console.log('✓ Created permanent redirect')

  await client.redirects.create(spaceId)
  console.log('✓ Created temporary redirect')

  const redirects = await client.redirects.list(spaceId, {
    type: 'permanent',
    sort: '-hits',
    per_page: 20,
  })
  console.log(`✓ Listed ${redirects.data.length} permanent redirects`)

  if (redirects.data.length > 0 && redirects.data[0]) {
    await client.redirects.reset(spaceId, redirects.data[0].id)
    console.log('✓ Reset redirect hit counter')
  }
}

async function configureTokens(client: ManagementClient, spaceId: string): Promise<void> {
  console.log('\n🔑 Configuring access tokens...')

  const productionToken = await client.tokens.create(spaceId, {
    name: 'Production API Key',
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    execution_limit: 1000000,
  })
  console.log(`✓ Created production token: ${productionToken.name}`)

  const stagingToken = await client.tokens.create(spaceId, {
    name: 'Staging API Key',
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    execution_limit: 100000,
  })
  console.log(`✓ Created staging token: ${stagingToken.name}`)

  const tempToken = await client.tokens.create(spaceId, {
    name: 'Temporary Testing Token',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    execution_limit: 1000,
  })
  console.log(`✓ Created temporary token: ${tempToken.name}`)

  await client.tokens.delete(spaceId, tempToken.id)
  console.log('✓ Deleted temporary token')
}

async function demonstratePagination(client: ManagementClient, spaceId: string): Promise<void> {
  console.log('\n📄 Demonstrating pagination...')

  let currentPage = 1
  let totalProcessed = 0
  const perPage = 10

  while (true) {
    const result = await client.contents.list(spaceId, {
      page: currentPage,
      per_page: perPage,
    })

    totalProcessed += result.data.length
    console.log(`✓ Page ${currentPage}: ${result.data.length} items (Total: ${result.meta.total})`)

    if (!result.links.next || result.data.length === 0) {
      break
    }

    currentPage++
  }

  console.log(`✓ Processed ${totalProcessed} total items across ${currentPage} pages`)
}

async function demonstrateVersionControl(client: ManagementClient, spaceId: string): Promise<void> {
  console.log('\n📝 Demonstrating version control...')

  const content = await client.contents.create(spaceId)
  console.log(`✓ Created content: ${content.id}`)

  await client.contents.update(spaceId, content.id)
  console.log('✓ Updated content (version 2)')

  await client.contents.update(spaceId, content.id)
  console.log('✓ Updated content (version 3)')

  const version2 = await client.contents.getVersion(spaceId, content.id, 2)
  console.log(`✓ Retrieved version 2: ${version2.version}`)

  await client.contents.setVersionAsCurrent(spaceId, content.id, 2)
  console.log('✓ Reverted to version 2')

  await client.contents.publishVersion(spaceId, content.id, 2)
  console.log('✓ Published version 2')
}

function handleError(error: unknown): void {
  console.error('\n❌ Error occurred:')

  if (error instanceof ManagementApiError) {
    console.error(`API Error: ${error.message}`)
    console.error(`Status Code: ${error.statusCode}`)
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response, null, 2))
    }
  } else if (error instanceof Error) {
    console.error(`Error: ${error.message}`)
    console.error(error.stack)
  } else {
    console.error('Unknown error:', error)
  }

  process.exit(1)
}

if (require.main === module) {
  advancedExample().catch(handleError)
}

export { advancedExample }
