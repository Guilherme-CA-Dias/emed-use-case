import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Contact } from '@/models/contact'

interface WebhookPayload {
  event: 'contact.created' | 'contact.updated' | 'contact.deleted'
  record: {
    id: string
    name: string
    createdTime: string
    updatedTime: string
    uri: string
    fields: {
      fullName: string
      primaryEmail: string | null
      primaryPhone: string | null
      source: string
      // ... other fields as needed
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const payload = await request.json() as WebhookPayload


    // Simplified validation
    if (!payload?.event || !payload?.record) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    const { event, record } = payload

    switch (event) {
      case 'contact.created':
      case 'contact.updated': {
        const contactData = {
          contactId: record.id,
          name: record.name || record.fields?.fullName || 'Unknown',
          email: record.fields?.primaryEmail || '',
          phone: record.fields?.primaryPhone || '',
          source: record.fields?.source || 'Unknown',
          createdAt: new Date(record.createdTime),
          updatedAt: new Date(record.updatedTime)
        }

        const contact = await Contact.findOneAndUpdate(
          { 
            contactId: contactData.contactId
          },
          contactData,
          { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true
          }
        )

        return NextResponse.json({ success: true, contact })
      }

      case 'contact.deleted': {
        const contactId = record.id
        if (!contactId) {
          throw new Error('Contact ID not found in delete event')
        }

        await Contact.findOneAndDelete({
          contactId: contactId
        })

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json(
          { error: 'Unsupported event type' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    )
  }
} 