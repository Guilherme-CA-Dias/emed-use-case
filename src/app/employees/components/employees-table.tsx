import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import type { Employee } from "@/types/employee"
import { Loader2 } from "lucide-react"
import { getAuthHeaders } from "@/app/auth-provider"

interface EmployeesTableProps {
  employees: Employee[]
  isLoading?: boolean
  isError?: Error | null
}

export function EmployeesTable({
  employees,
  isLoading = false,
  isError = null,
}: EmployeesTableProps) {
  const runDependentsFlow = async () => {
    try {
      const response = await fetch('/api/run-dependents-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ integrationKey: 'workday' })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to run dependents flow')
      }
    } catch (error) {
      console.error('Error running dependents flow:', error)
    }
  }

  if (isError) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">
          Error loading employees. Please try again later.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-md border p-8">
        <div className="flex justify-center items-center text-primary">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading employees...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={runDependentsFlow}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Update Dependents
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Dependents</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow key="no-employees">
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee._id || `${employee.customerId}-${employee.employeeId}`}>
                  <TableCell>{employee.employeeId}</TableCell>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.title || "-"}</TableCell>
                  <TableCell>{employee.email || "-"}</TableCell>
                  <TableCell>{employee.phone || "-"}</TableCell>
                  <TableCell>{employee.dependents || "0"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 