import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/server-auth'
import { getIntegrationClient } from '@/lib/integration-app-client'

async function checkFlowOutput(integrationApp: any, flowRunId: string) {
  try {
    console.log(`Checking flow output for run ID: ${flowRunId}`)
    const output = await integrationApp
      .flowRun(flowRunId)
      .getOutput({nodeKey: 'create-data-record'})
    console.log('Flow output received:', output)
    
    // Check if the output contains an error
    if (output?.error) {
      throw new Error(`Flow error: ${output.error}`)
    }
    
    return output
  } catch (error) {
    console.error('Error checking flow output:', error)
    throw error // Propagate the error instead of returning null
  }
}

async function pollFlowOutput(integrationApp: any, flowRunId: string, maxAttempts = 12) {
  console.log(`Starting to poll flow output. Flow run ID: ${flowRunId}`)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`Polling attempt ${attempt + 1} of ${maxAttempts}`)
    try {
      const output = await checkFlowOutput(integrationApp, flowRunId)
      if (output) {
        console.log('Flow completed successfully')
        return output
      }
      console.log('No output yet, waiting 5 seconds...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    } catch (error) {
      console.error('Error during polling:', error)
      throw error // Stop polling on error
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
    console.log('Sending webhook event...')
    const webhookResponse = await fetch('https://api.integration.app/webhooks/app-events/02856efd-d578-437e-a8f1-95d6d186f980', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId: auth.customerId,
        type: 'created',
        event: 'contact.created',
        record: data
      })
    })

    if (!webhookResponse.ok) {
      throw new Error('Failed to trigger contact creation flow')
    }

    const webhookData = await webhookResponse.json()
    console.log('Webhook response:', webhookData)

    const launchedFlowId = webhookData.launchedFlowRunIds?.[0]
    if (!launchedFlowId) {
      throw new Error(`No flow ID received. Response: ${JSON.stringify(webhookData)}`)
    }

    // Return success immediately after getting the flow ID
    return NextResponse.json({ 
      success: true,
      message: 'Contact creation initiated',
      flowRunId: launchedFlowId
    })

  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create contact' },
      { status: 500 }
    )
  }
} 