export * from './product';
export * from './supplier';
export * from './purchase';
export * from './sales';

export type EventType = 'pago' | 'fiscal' | 'operativo' | 'inventario';
export type EventStatus = 'pendiente' | 'completado';

export interface AppEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  description: string;
  status: EventStatus;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  read: boolean;
  createdAt: string;
}
