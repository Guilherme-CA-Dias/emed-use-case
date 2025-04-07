import { useState, useCallback } from "react"
import type { Contact } from "@/types/contact"
import { getAuthHeaders } from "@/app/auth-provider"
import { useDebouncedCallback } from 'use-debounce'

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Get customerId from API response instead
  const [customerId, setCustomerId] = useState("")

  const fetchContacts = async (resetData: boolean = false, isSearchRequest: boolean = false) => {
    if (isSearchRequest) {
      setIsSearching(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    if (resetData) {
      setContacts([])
      setCursor(null)
      setHasMore(true)
    }

    try {
      const url = new URL('/api/contacts', window.location.origin)
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
        throw new Error('Failed to fetch contacts')
      }

      const data = await response.json()
      
      // Get customerId from the response
      if (data.customerId) {
        setCustomerId(data.customerId)
      }

      // Create a Set of existing contact IDs
      const existingIds = new Set(contacts.map(c => c._id))
      
      // Filter out any duplicates from the new contacts
      const newContacts = data.contacts.filter((contact: Contact) => !existingIds.has(contact._id))
      
      setCursor(data.cursor)
      setHasMore(!!data.cursor)
      
      setContacts(prev => resetData ? data.contacts : [...prev, ...newContacts])
    } catch (err) {
      console.error('Error fetching contacts:', err)
      setError(err instanceof Error ? err : new Error('Failed to fetch contacts'))
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  // Debounce search to avoid too many requests
  const debouncedSearch = useDebouncedCallback(
    (query: string) => {
      setSearchQuery(query)
      fetchContacts(true, true)
    },
    300
  )

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    debouncedSearch(query)
  }, [debouncedSearch])

  const importContacts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Failed to import contacts')
      }

      await fetchContacts(true)
    } catch (err) {
      console.error('Error importing contacts:', err)
      setError(err instanceof Error ? err : new Error('Failed to import contacts'))
    } finally {
      setIsLoading(false)
    }
  }

  const refresh = () => fetchContacts(true)
  const loadMore = () => fetchContacts(false)

  return {
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
  }
} 