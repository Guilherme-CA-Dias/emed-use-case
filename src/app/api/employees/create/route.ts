import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/server-auth'
import { generateIntegrationToken } from '@/lib/integration-token'

interface FlowRunResponse {
  items: Array<{
    id: string
    status: string
    input: {
      'app-event-trigger': {
        customerId: string
        type: string
        event: string
        record: any
      }
    }
  }>
}

async function checkFlowStatus(flowRunId: string, token: string) {
  try {
    const response = await fetch(`https://api.integration.app/flow-runs/${flowRunId}/nodes/create-data-record/runs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch flow status')
    }

    const data = await response.json() as FlowRunResponse
    console.log('Flow run status response:', data)
    
    // Return null if items is empty to indicate we should keep polling
    if (!data.items?.length) {
      console.log('No items in response, will retry...')
      return null
    }
    
    console.log('Flow run status:', data.items[0]?.status)
    return data
  } catch (error) {
    console.error('Error checking flow status:', error)
    throw error
  }
}

async function pollFlowStatus(flowRunId: string, token: string, maxAttempts = 5) { // Increased attempts since we're handling empty responses
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const status = await checkFlowStatus(flowRunId, token)
      
      // If status is null (empty items), continue polling
      if (!status) {
        console.log(`Attempt ${attempt + 1}: No items yet, waiting 5 seconds...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        continue
      }

      if (!status.items?.[0]) {
        throw new Error('Invalid flow run response')
      }

      const currentStatus = status.items[0].status
      
      if (currentStatus === 'completed') {
        return {
          status: 'completed',
          data: status.items[0]
        }
      }
      
      if (currentStatus === 'failed') {
        throw new Error('Flow execution failed')
      }

      console.log(`Attempt ${attempt + 1}: Status is ${currentStatus}, waiting 5 seconds...`)
      await new Promise(resolve => setTimeout(resolve, 5000))
    } catch (error) {
      throw error
    }
  }
  throw new Error('Flow execution timed out')
}

export async function POST(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request)
    if (!auth.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()

    // Create webhook event
    const webhookResponse = await fetch('https://api.integration.app/webhooks/app-events/02856efd-d578-437e-a8f1-95d6d186f980', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: auth.customerId,
        type: 'created',
        event: 'employee.created',
        record: data
      })
    })

    if (!webhookResponse.ok) {
      throw new Error('Failed to trigger employee creation flow')
    }

    const webhookData = await webhookResponse.json()
    const launchedFlowId = webhookData.launchedFlowRunIds?.[0]
    if (!launchedFlowId) {
      throw new Error(`No flow ID received`)
    }

    // Generate token for flow status checks
    const token = await generateIntegrationToken(auth)
    
    // Poll for flow completion
    const flowStatus = await pollFlowStatus(launchedFlowId, token)

    return NextResponse.json({ 
      success: true,
      message: 'Employee created successfully',
      flowStatus
    })

  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create employee' },
      { status: 500 }
    )
  }
} 