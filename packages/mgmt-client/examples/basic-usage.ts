import { ManagementApiError, ManagementClient } from '@b10cks/mgmt-client'

async function main() {
  const client = new ManagementClient({
    baseUrl: process.env.B10CKS_API_URL || 'https://api.b10cks.com',
    token: process.env.B10CKS_TOKEN || 'your-bearer-token',
    timeout: 30000,
  })

  try {
    console.log('=== User Management ===')
    const user = await client.users.getMe()
    console.log('Current user:', user)

    console.log('\n=== Team Management ===')
    const teams = await client.teams.list()
    console.log('Teams:', teams.data)

    const newTeam = await client.teams.create({
      name: 'Example Team',
      icon: '🚀',
      color: '#FF5733',
      description: 'An example team',
    })
    console.log('Created team:', newTeam)

    console.log('\n=== Space Management ===')
    const space = await client.spaces.create({
      name: 'Example Space',
      slug: 'example-space',
      icon: '📦',
      color: '#4A90E2',
      team_id: newTeam.id,
    })
    console.log('Created space:', space)

    console.log('\n=== Block Management ===')
    const blocks = await client.blocks.list(space.id, {
      page: 1,
      per_page: 10,
      sort: '-created_at',
    })
    console.log('Blocks:', blocks.data)
    console.log('Total blocks:', blocks.meta.total)

    console.log('\n=== Content Management ===')
    const contents = await client.contents.list(space.id, {
      published: true,
      page: 1,
      per_page: 5,
    })
    console.log('Published contents:', contents.data)

    console.log('\n=== Asset Management ===')
    const assets = await client.assets.list(space.id)
    console.log('Assets:', assets.data)

    console.log('\n=== AI Features ===')
    const models = await client.ai.getAvailableModels({
      model_type: 'text',
    })
    console.log('Available AI models:', models)

    console.log('\n=== System Health ===')
    const health = await client.system.health()
    console.log('System health:', health)

    console.log('\n=== Cleanup ===')
    await client.spaces.delete(space.id)
    console.log('Deleted space')

    await client.teams.delete(newTeam.id)
    console.log('Deleted team')

    console.log('\n✅ All operations completed successfully!')
  } catch (error) {
    if (error instanceof ManagementApiError) {
      console.error('API Error:', error.message)
      console.error('Status Code:', error.statusCode)
      console.error('Response:', error.response)
    } else {
      console.error('Unexpected error:', error)
    }
    process.exit(1)
  }
}

main()
