export * from './product';
export * from './supplier';
export * from './purchase';
export * from './sales';
export * from './supply';
export * from './crm';

export type EventType = 'pago' | 'fiscal' | 'operativo' | 'inventario';
export type EventStatus = 'pendiente' | 'completado';

export interface AppEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  description: string;
  status: EventStatus;
  // System-generated event fields
  sourceType?: 'PAYMENT_DUE' | 'SUPPLY_ARRIVAL' | 'REQUEST_FOLLOWUP';
  sourceId?: string;
  isSystemGenerated?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  read: boolean;
  createdAt: string;
}
