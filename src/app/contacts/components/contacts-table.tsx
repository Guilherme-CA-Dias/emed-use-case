import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Contact } from "@/types/contact"
import { Loader2 } from "lucide-react"

interface ContactsTableProps {
  contacts: Contact[]
  isLoading?: boolean
  isError?: Error | null
}

export function ContactsTable({
  contacts,
  isLoading = false,
  isError = null,
}: ContactsTableProps) {
  if (isError) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">
          Error loading contacts. Please try again later.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-md border p-8">
        <div className="flex justify-center items-center text-primary">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading contacts...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow key="no-contacts">
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                No contacts found
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow key={contact._id || `${contact.customerId}-${contact.contactId}`}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.email || "-"}</TableCell>
                <TableCell>{contact.phone || "-"}</TableCell>
                <TableCell>{contact.source || "-"}</TableCell>
                <TableCell>
                  {new Date(contact.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
} 