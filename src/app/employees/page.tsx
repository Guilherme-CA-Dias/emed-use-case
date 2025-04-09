"use client"

import { useState } from "react"
import { EmployeesTable } from "./components/employees-table"
import { useEmployees } from "@/hooks/use-employees"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RefreshCw, Download, Search, Loader2 } from "lucide-react"
import { useEffect } from "react"
import { useIntegrations } from "@integration-app/react"

export default function EmployeesPage() {
  const { 
    employees,
    isLoading,
    isSearching,
    error, 
    hasMore, 
    searchQuery,
    handleSearch,
    refresh, 
    loadMore, 
    importEmployees,
    customerId
  } = useEmployees()
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
              <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
              <p className="text-muted-foreground">View all your employees</p>
            </div>
          </div>
          <div className="rounded-md border p-8 text-center">
            <p className="text-muted-foreground">
              Please connect an integration first to view employees.
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
            <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
            <p className="text-muted-foreground">View all your employees</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={importEmployees} disabled={isLoading || isSearching}>
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
              placeholder="Search employees..."
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
        <EmployeesTable 
          employees={employees} 
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
    </div>
  )
} 