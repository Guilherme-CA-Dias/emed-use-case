"use client"

import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useForm } from "react-hook-form"
import { getAuthHeaders } from "@/app/auth-provider"

interface CreateContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerId: string
}

interface ContactFormData {
  name: string
  websiteUrl: string
  description: string
  currency: string
  industry: string
  ownerId: string
  primaryAddress: string
  primaryPhone: string
}

export function CreateContactModal({ open, onOpenChange, customerId }: CreateContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>()

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true)
      
      const response = await fetch('/api/contacts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to create contact')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to create contact')
      }

      reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating contact:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal 
      open={open} 
      onClose={() => onOpenChange(false)}
      className="max-w-2xl"
    >
      <div className="flex justify-between items-start p-6 border-b">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create Contact</h2>
          <p className="text-muted-foreground mt-1">
            Add a new contact to your database
          </p>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="rounded-full p-2 hover:bg-accent"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...register("name", { required: "Name is required" })}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input
            id="websiteUrl"
            type="url"
            {...register("websiteUrl")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            {...register("description")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            {...register("industry")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryPhone">Phone</Label>
          <Input
            id="primaryPhone"
            type="tel"
            {...register("primaryPhone")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryAddress">Address</Label>
          <Input
            id="primaryAddress"
            {...register("primaryAddress")}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-md font-medium transition-colors bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-200"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Contact"}
          </Button>
        </div>
      </form>
    </Modal>
  )
} 