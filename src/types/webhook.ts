export interface WebhookPayload {
  data: {
    request: {
      method: string
      url: string
      query: Record<string, string>
      headers: Record<string, string>
      data: {
        event: 'contact.created' | 'contact.updated' | 'contact.deleted'
        record: {
          id: string
          name: string
          createdTime: string
          updatedTime: string
          uri: string
          fields: {
            id: string
            fullName: string
            firstName?: string
            lastName?: string
            primaryEmail?: string
            primaryPhone?: string | null
            stage?: string
            companyName?: string | null
            ownerId?: string | null
            jobTitle?: string | null
            source?: string
            createdTime: string
            createdBy?: string | null
            updatedTime: string
            updatedBy?: string | null
            companyId?: string
            emails: Array<{ value: string }>
            phones: Array<{ value: string }>
            addresses: Array<any>
          }
        }
      }
    }
    response?: {
      status: number
      data: any
    }
  }
} 