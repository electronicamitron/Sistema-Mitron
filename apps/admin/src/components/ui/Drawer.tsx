import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@mitron/ui';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function Drawer({ isOpen, onClose, title, children, width = '400px' }: DrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        style={{ width, maxWidth: '90vw' }}
        className="flex flex-col gap-0 p-0"
      >
        <SheetHeader className="border-b border-[#292C2D] px-6 py-5">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
