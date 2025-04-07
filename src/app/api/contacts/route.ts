import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/server-auth'
import { getIntegrationClient } from '@/lib/integration-app-client'
import connectDB from '@/lib/mongodb'
import { Contact } from '@/models/contact'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthFromRequest(request)
    if (!auth.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()
    
    // Get cursor and search query from params
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const search = searchParams.get('q')
    
    // Base query
    const baseQuery = { customerId: auth.customerId }

    // Add text search if search parameter exists
    if (search && search.trim()) {
      Object.assign(baseQuery, {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      })
    }

    // If cursor is provided, add _id condition
    if (cursor) {
      Object.assign(baseQuery, {
        _id: { $lt: cursor }
      })
    }
    
    // Find contacts for this customer, paginated
    const limit = 10
    const contacts = await Contact.find(baseQuery)
      .sort({ _id: -1 }) // Sort by _id instead of createdAt for more reliable pagination
      .limit(limit + 1) // Get one extra to check if there are more
      
    // Check if there are more results
    const hasMore = contacts.length > limit
    const results = hasMore ? contacts.slice(0, -1) : contacts

    return NextResponse.json({
      contacts: results,
      cursor: hasMore ? results[results.length - 1]._id : null,
      customerId: auth.customerId
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
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

    await connectDB()

    // Get Integration.app client
    const client = await getIntegrationClient(auth)

    // Find the first available connection
    const connectionsResponse = await client.connections.find()
    const firstConnection = connectionsResponse.items?.[0]

    if (!firstConnection) {
      return NextResponse.json(
        { error: 'No apps connected to import contacts from' },
        { status: 400 }
      )
    }

    let allContacts: any[] = []
    let hasMore = true
    let cursor: string | null = null

    // Fetch all contacts using pagination
    while (hasMore) {
      // Get contacts from the integration
      const result = await client
        .connection(firstConnection.id)
        .action('get-contacts')
        .run({
          ...(cursor ? { cursor } : {})
        })

      if (!result?.output?.records) {
        throw new Error('Invalid response format from contacts API')
      }

      // Store the cursor for the next iteration
      cursor = result.output.cursor || null
      hasMore = !!cursor

      // Add the current page of records to our collection
      allContacts = [...allContacts, ...result.output.records]

      // Optional: Add a small delay to avoid rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Transform and save all contacts
    const contacts = await Promise.all(
      allContacts.map(async (record: any) => {
        // Debug log to see the structure of the record
        console.log('Record data:', {
          id: record.id,
          fields: record.fields,
          rawRecord: record
        })

        const contactData = {
          customerId: auth.customerId,
          contactId: record.id,
          name: record.name || record.fullName || record.fields?.fullName || 'Unknown',
          email: record.primaryEmail || record.emails?.[0]?.value || record.fields?.primaryEmail,
          phone: record.primaryPhone || record.phones?.[0]?.value || record.fields?.primaryPhone,
          source: record.source || record.fields?.source || 'Unknown',
        }

        // Debug log the final contact data
        console.log('Contact data being saved:', contactData)

        // Upsert the contact
        return Contact.findOneAndUpdate(
          { 
            customerId: contactData.customerId,
            contactId: contactData.contactId
          },
          contactData,
          { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true
          }
        )
      })
    )

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Error importing contacts:', error)
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    )
  }
} 