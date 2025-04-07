import mongoose from "mongoose"

const contactSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  contactId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  source: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
})

// Compound index to ensure unique contacts per customer
contactSchema.index({ customerId: 1, contactId: 1 }, { unique: true })

// Text index for search
contactSchema.index({ name: 'text', email: 'text', phone: 'text', source: 'text' })

// Clear existing model if it exists (in development)
if (mongoose.models.Contact) {
  delete mongoose.models.Contact
}

export const Contact = mongoose.model('Contact', contactSchema) 