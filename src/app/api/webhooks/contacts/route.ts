import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { Contact } from '@/models/contact'
import type { WebhookPayload } from '@/types/webhook'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const payload = await request.json() as WebhookPayload
    console.log('Webhook payload:', payload)

    if (payload.type !== 'api-request' || !payload.data?.request?.data) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    const { event, record } = payload.data.request.data

    switch (event) {
      case 'contact.created':
      case 'contact.updated': {
        if (!record) {
          throw new Error('Invalid record data in webhook payload')
        }

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
        const contactId = record?.id
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