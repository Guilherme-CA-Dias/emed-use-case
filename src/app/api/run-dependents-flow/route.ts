import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/server-auth'
import { generateIntegrationToken } from '@/lib/integration-token'
import { getAuthHeaders } from '@/app/auth-provider'

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request)
    if (!auth.customerId) {
      return NextResponse.json(
        { error: 'No customer ID found' },
        { status: 401 }
      )
    }

    const { integrationKey } = await request.json()
    
    console.log('Auth:', { customerId: auth.customerId, customerName: auth.customerName })
    console.log('Integration Key:', integrationKey)
    
    const token = await generateIntegrationToken({
      ...auth,
      id: auth.customerId, // Make sure to set id for Integration.app API
      name: auth.customerName || ''
    })

    const flowUrl = `https://api.integration.app/connections/${integrationKey}/flows/get-dependents/run`
    console.log('Making request to:', flowUrl)

    const flowResponse = await fetch(flowUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!flowResponse.ok) {
      const errorData = await flowResponse.text()
      console.error('Flow API Error:', {
        status: flowResponse.status,
        statusText: flowResponse.statusText,
        body: errorData
      })
      throw new Error(`Failed to run dependents flow: ${flowResponse.status} ${flowResponse.statusText}`)
    }

    const responseData = await flowResponse.json()
    console.log('Flow Response:', responseData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error running dependents flow:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run dependents flow' },
      { status: 500 }
    )
  }
} 