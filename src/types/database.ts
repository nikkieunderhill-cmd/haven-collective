export type UserRole = 'recipient' | 'donor' | 'admin' | 'super_admin'
export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending'
export type VerificationPathway = 'benefits' | 'income'
export type RequestStatus = 'draft' | 'pending_review' | 'active' | 'claimed' | 'fulfilled' | 'denied' | 'expired'
export type ClaimStatus = 'pending' | 'paid' | 'lapsed' | 'fulfilled'
export type FulfillmentType = 'money' | 'goods'
export type FlagStatus = 'open' | 'resolved'
export type SenderType = 'recipient' | 'donor' | 'admin'

export interface User {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface RecipientProfile {
  id: string
  user_id: string
  full_name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string | null
  household_size: number
  num_dependents: number
  stripe_identity_session_id: string | null
  stripe_identity_verified: boolean
  verification_pathway: VerificationPathway | null
  benefits_doc_url: string | null
  benefits_verified: boolean
  income_doc_url: string | null
  income_verified: boolean
  service_area: string | null
  approved_at: string | null
  approved_by: string | null
  denial_reason: string | null
  application_step: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  fulfillment_type: FulfillmentType
  funding_cap: number | null
  request_frequency_days: number
  requires_documentation: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Request {
  id: string
  recipient_id: string
  category_id: string
  title: string
  description: string
  amount_needed: number | null
  documentation_url: string | null
  documentation_note: string | null
  status: RequestStatus
  view_count: number
  denial_reason: string | null
  expires_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
  updated_at: string
}

export interface Claim {
  id: string
  request_id: string
  donor_id: string
  payment_intent_id: string | null
  stripe_transfer_id: string | null
  amount: number | null
  fee_covered: boolean
  status: ClaimStatus
  donor_message: string | null
  claimed_at: string
  lapse_at: string
  paid_at: string | null
  fulfilled_at: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  request_id: string
  sender_id: string
  sender_type: SenderType
  content: string
  is_read: boolean
  sent_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  action_url: string | null
  read_at: string | null
  created_at: string
}
