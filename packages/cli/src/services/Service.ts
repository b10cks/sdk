import type {
  Block,
  Content,
  CreateSpaceParams,
  CreateTeamParams,
  DataEntry,
  PaginatedResponse,
  Release,
  Space,
  Team,
  TeamHierarchy,
} from '@b10cks/mgmt-client'

import credentials from '../utils/credentials.js'
import BaseService from './BaseService.js'

export interface SpacesHierarchyNode {
  id: string
  name: string
  type: 'team' | 'space'
  color?: string | null
  icon?: string | null
  children?: SpacesHierarchyNode[]
}

export default class Service extends BaseService {
  async login(token: string): Promise<boolean> {
    try {
      const client = this.createClientWithToken(token)
      await client.users.getMe()
      credentials.set({ login: 'sanctum', password: token })
      return true
    } catch (_error: any) {
      return false
    }
  }

  async logout(): Promise<void> {
    credentials.clear()
  }

  async listSpaces(): Promise<PaginatedResponse<Space>> {
    return this.client.spaces.list()
  }

  async createSpace(payload: CreateSpaceParams): Promise<Space> {
    return this.client.spaces.create(payload)
  }

  async listTeams(): Promise<PaginatedResponse<Team>> {
    return this.client.teams.list()
  }

  async getTeamsHierarchy(): Promise<TeamHierarchy> {
    return this.client.teams.getHierarchy()
  }

  async createTeam(payload: CreateTeamParams): Promise<Team> {
    return this.client.teams.create(payload)
  }

  async listBlocks(spaceId: string): Promise<PaginatedResponse<Block>> {
    return this.client.blocks.list(spaceId, { per_page: 9999 })
  }

  async listContents(spaceId: string): Promise<PaginatedResponse<Content>> {
    return this.client.contents.list(spaceId)
  }

  async listReleases(spaceId: string): Promise<PaginatedResponse<Release>> {
    return this.client.releases.list(spaceId)
  }

  async createDataSourceEntry(
    spaceId: string,
    dataSourceId: string,
    payload: Partial<DataEntry>
  ): Promise<DataEntry> {
    return this.client.dataSources.createEntry(spaceId, dataSourceId, payload)
  }

  async buildTeamsHierarchy(): Promise<TeamHierarchy | null> {
    try {
      return await this.getTeamsHierarchy()
    } catch {
      return null
    }
  }

  async buildSpacesHierarchy(): Promise<SpacesHierarchyNode | null> {
    const [teamsResponse, spacesResponse] = await Promise.all([
      this.listTeams(),
      this.listSpaces(),
    ])

    if (!teamsResponse.data || teamsResponse.data.length === 0) {
      return null
    }

    const spacesByTeamId = new Map<string, Space[]>()
    const globalSpaces: Space[] = []

    for (const space of spacesResponse.data) {
      const teamId = space.team_id
      if (teamId) {
        if (!spacesByTeamId.has(teamId)) {
          spacesByTeamId.set(teamId, [])
        }
        spacesByTeamId.get(teamId)!.push(space)
      } else {
        globalSpaces.push(space)
      }
    }

    const rootTeams = teamsResponse.data.filter((team) => !team.parent_id)

    const buildNode = (team: Team): SpacesHierarchyNode => {
      const children: SpacesHierarchyNode[] = []

      for (const space of spacesByTeamId.get(team.id) ?? []) {
        children.push({ id: space.id, name: space.name, type: 'space', color: space.color, icon: space.icon })
      }

      for (const child of teamsResponse.data) {
        if (child.parent_id === team.id) {
          children.push(buildNode(child))
        }
      }

      return { id: team.id, name: team.name, type: 'team', ...(children.length > 0 && { children }) }
    }

    if (rootTeams.length === 1) {
      return buildNode(rootTeams[0])
    }

    const children: SpacesHierarchyNode[] = [
      ...globalSpaces.map((s) => ({ id: s.id, name: s.name, type: 'space' as const, color: s.color, icon: s.icon })),
      ...rootTeams.map(buildNode),
    ]

    return { id: '__root__', name: 'Workspace', type: 'team', children }
  }
}
