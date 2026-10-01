export interface Supplier {
  id: string;
  name: string;
  rfc: string;
  contactName?: string;
  phone?: string;
  email?: string;
  whatsappUrl?: string;
  notes?: string;
  isMock?: boolean;
}
