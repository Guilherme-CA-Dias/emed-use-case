import { useState, useCallback } from "react"
import type { Employee } from "@/types/employee"
import { getAuthHeaders } from "@/app/auth-provider"
import { useDebouncedCallback } from 'use-debounce'

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [customerId, setCustomerId] = useState("")

  const fetchEmployees = async (resetData: boolean = false, isSearchRequest: boolean = false) => {
    if (isSearchRequest) {
      setIsSearching(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    if (resetData) {
      setEmployees([])
      setCursor(null)
      setHasMore(true)
    }

    try {
      const url = new URL('/api/employees', window.location.origin)
      if (cursor && !resetData) {
        url.searchParams.set('cursor', cursor)
      }
      if (searchQuery) {
        url.searchParams.set('q', searchQuery)
      }

      const response = await fetch(url, {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to fetch employees')
      }

      const data = await response.json()
      
      if (data.customerId) {
        setCustomerId(data.customerId)
      }

      const existingIds = new Set(employees.map(e => e._id))
      const newEmployees = data.employees.filter((employee: Employee) => !existingIds.has(employee._id))
      
      setCursor(data.cursor)
      setHasMore(!!data.cursor)
      
      setEmployees(prev => resetData ? data.employees : [...prev, ...newEmployees])
    } catch (err) {
      console.error('Error fetching employees:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch employees'))
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  const debouncedSearch = useDebouncedCallback(
    (query: string) => {
      setSearchQuery(query)
      fetchEmployees(true, true)
    },
    300
  )

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    debouncedSearch(query)
  }, [debouncedSearch])

  const importEmployees = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to import employees')
      }

      await fetchEmployees(true)
    } catch (err) {
      console.error('Error importing employees:', err)
      setError(err instanceof Error ? err : new Error('Failed to import employees'))
    } finally {
      setIsLoading(false)
    }
  }

  const refresh = () => fetchEmployees(true)
  const loadMore = () => fetchEmployees(false)

  return {
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
  }
} 