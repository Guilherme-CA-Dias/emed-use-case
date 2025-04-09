import mongoose from "mongoose"

const employeeSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  employeeId: { type: String, required: true },
  name: { type: String, required: true },
  title: { type: String },
  email: { type: String },
  phone: { type: String },
  dependents: { type: String, default: '0' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
})

// Compound index to ensure unique employees per customer
employeeSchema.index({ customerId: 1, employeeId: 1 }, { unique: true })

// Text index for search
employeeSchema.index({ name: 'text', email: 'text', phone: 'text', title: 'text' })

// Clear existing model if it exists (in development)
if (mongoose.models.Employee) {
  delete mongoose.models.Employee
}

export const Employee = mongoose.model('Employee', employeeSchema) 