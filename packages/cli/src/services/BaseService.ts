import { ManagementClient } from '@b10cks/mgmt-client'

import credentials from '../utils/credentials.js'

const API_BASE_URL = process.env.B10CKS_API_DOMAIN || 'https://api.b10cks.com'

class BaseService {
  protected client: ManagementClient

  constructor() {
    const token = credentials.get()?.password ?? ''
    this.client = new ManagementClient({ baseUrl: API_BASE_URL, token })
  }

  protected createClientWithToken(token: string): ManagementClient {
    return new ManagementClient({ baseUrl: API_BASE_URL, token })
  }

  protected output(content: string, silent: boolean = false): void {
    if (!silent) {
      console.log(content)
    }
  }
}

export default BaseService
