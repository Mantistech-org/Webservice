export interface OutreachLead {
  id: string
  business_name: string
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  rating: number | null
  category: string | null
  location_searched: string | null
  place_id: string | null
  status: 'new' | 'called' | 'emailed' | 'bounced'
  notes: string | null
  last_emailed_at: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}
