export interface Contact {
  _id?: string
  customerId: string
  contactId: string
  name: string
  email?: string
  phone?: string
  source?: string
  createdAt: string
  updatedAt: string
}

export interface Employee {
  _id?: string
  customerId: string
  employeeId: string
  name: string
  title?: string
  email?: string
  phone?: string
  dependents?: number
  createdAt?: Date
  updatedAt?: Date
} 