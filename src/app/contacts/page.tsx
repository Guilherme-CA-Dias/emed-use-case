"use client"

import { useState } from "react"
import { ContactsTable } from "./components/contacts-table"
import { CreateContactModal } from "./components/create-contact-modal"
import { useContacts } from "@/hooks/use-contacts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCw, Download, Search, Loader2, UserPlus } from "lucide-react"
import { useEffect } from "react"
import { useIntegrations } from "@integration-app/react"

export default function ContactsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const { 
    contacts, 
    isLoading,
    isSearching,
    error, 
    hasMore, 
    searchQuery,
    handleSearch,
    refresh, 
    loadMore, 
    importContacts,
    customerId
  } = useContacts()
  const { integrations } = useIntegrations()

  useEffect(() => {
    refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Show message if no integrations are connected
  if (integrations.length === 0 || !integrations.some(i => i.connection?.id)) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
              <p className="text-muted-foreground">View all your contacts</p>
            </div>
          </div>
          <div className="rounded-md border p-8 text-center">
            <p className="text-muted-foreground">
              Please connect an integration first to view contacts.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">View all your contacts</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setCreateModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Contact
            </Button>
            <Button onClick={importContacts} disabled={isLoading || isSearching}>
              <Download className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Import
            </Button>
            <Button onClick={refresh} disabled={isLoading || isSearching}>
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={isLoading}
            />
            {isSearching && (
              <div className="absolute right-2.5 top-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/10 p-4 mb-4">
            <p className="text-red-600 dark:text-red-400">
              {error.message}
            </p>
          </div>
        )}
        <ContactsTable 
          contacts={contacts} 
          isLoading={isLoading} 
          isError={error} 
        />
        {hasMore && (
          <div className="flex justify-center mt-4">
            <Button
              onClick={loadMore}
              disabled={isLoading || isSearching}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Load More
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <CreateContactModal 
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        customerId={customerId}
      />
    </div>
  )
} 