import { NextRequest, NextResponse } from 'next/server'
import { getAuthFromRequest } from '@/lib/server-auth'
import { getIntegrationClient } from '@/lib/integration-app-client'
import connectDB from '@/lib/mongodb'
import { Employee } from '@/models/employee'

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
    
    // Find employees for this customer, paginated
    const limit = 10
    const employees = await Employee.find(baseQuery)
      .sort({ _id: -1 })
      .limit(limit + 1)
      
    // Check if there are more results
    const hasMore = employees.length > limit
    const results = hasMore ? employees.slice(0, -1) : employees

    return NextResponse.json({
      employees: results,
      cursor: hasMore ? results[results.length - 1]._id : null,
      customerId: auth.customerId
    })
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
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
        { error: 'No apps connected to import employees from' },
        { status: 400 }
      )
    }

    let allEmployees: any[] = []
    let hasMore = true
    let cursor: string | null = null

    // Fetch all employees using pagination
    while (hasMore) {
      const result = await client
        .connection(firstConnection.id)
        .action('list-employees')
        .run({
          ...(cursor ? { cursor } : {})
        })

      if (!result?.output?.records) {
        throw new Error('Invalid response format from employees API')
      }

      cursor = result.output.cursor || null
      hasMore = !!cursor

      allEmployees = [...allEmployees, ...result.output.records]

      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Transform and save all employees
    const employees = await Promise.all(
      allEmployees.map(async (record: any) => {
        console.log('Record data:', {
          id: record.id,
          fields: record.fields,
          rawRecord: record
        })

        const employeeData = {
          customerId: auth.customerId,
          employeeId: record.id,
          name: record.name || record.fullName || record.fields?.fullName || 'Unknown',
          title: record.title || record.fields?.title,
          email: record.primaryEmail || record.emails?.[0]?.value || record.fields?.primaryEmail,
          phone: record.primaryPhone || record.phones?.[0]?.value || record.fields?.primaryPhone,
          dependents: String(record.dependents || record.fields?.dependents || ''),
        }

        console.log('Employee data being saved:', employeeData)

        return Employee.findOneAndUpdate(
          { 
            customerId: employeeData.customerId,
            employeeId: employeeData.employeeId
          },
          employeeData,
          { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true
          }
        )
      })
    )

    return NextResponse.json({ employees })
  } catch (error) {
    console.error('Error importing employees:', error)
    return NextResponse.json(
      { error: 'Failed to import employees' },
      { status: 500 }
    )
  }
} 