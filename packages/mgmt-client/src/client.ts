import { HttpClient } from './http-client'
import { AiResource } from './resources/ai'
import { AssetFoldersResource } from './resources/asset-folders'
import { AssetTagsResource } from './resources/asset-tags'
import { AssetsResource } from './resources/assets'
import { BlockFoldersResource } from './resources/block-folders'
import { BlockTagsResource } from './resources/block-tags'
import { BlocksResource } from './resources/blocks'
import { ContentsResource } from './resources/contents'
import { DataSourcesResource } from './resources/data-sources'
import { RedirectsResource } from './resources/redirects'
import { SpacesResource } from './resources/spaces'
import { SystemResource } from './resources/system'
import { TeamsResource } from './resources/teams'
import { TokensResource } from './resources/tokens'
import { UsersResource } from './resources/users'
import type { ClientConfig } from './types'

export class ManagementClient {
  private readonly httpClient: HttpClient

  public readonly users: UsersResource
  public readonly teams: TeamsResource
  public readonly spaces: SpacesResource
  public readonly blocks: BlocksResource
  public readonly blockTags: BlockTagsResource
  public readonly blockFolders: BlockFoldersResource
  public readonly contents: ContentsResource
  public readonly assets: AssetsResource
  public readonly assetFolders: AssetFoldersResource
  public readonly assetTags: AssetTagsResource
  public readonly redirects: RedirectsResource
  public readonly tokens: TokensResource
  public readonly dataSources: DataSourcesResource
  public readonly ai: AiResource
  public readonly system: SystemResource

  constructor(config: ClientConfig) {
    this.httpClient = new HttpClient(config)

    this.users = new UsersResource(this.httpClient)
    this.teams = new TeamsResource(this.httpClient)
    this.spaces = new SpacesResource(this.httpClient)
    this.blocks = new BlocksResource(this.httpClient)
    this.blockTags = new BlockTagsResource(this.httpClient)
    this.blockFolders = new BlockFoldersResource(this.httpClient)
    this.contents = new ContentsResource(this.httpClient)
    this.assets = new AssetsResource(this.httpClient)
    this.assetFolders = new AssetFoldersResource(this.httpClient)
    this.assetTags = new AssetTagsResource(this.httpClient)
    this.redirects = new RedirectsResource(this.httpClient)
    this.tokens = new TokensResource(this.httpClient)
    this.dataSources = new DataSourcesResource(this.httpClient)
    this.ai = new AiResource(this.httpClient)
    this.system = new SystemResource(this.httpClient)
  }
}
