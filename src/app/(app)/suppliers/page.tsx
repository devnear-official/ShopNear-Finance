import React from 'react';
import { PartiesView } from '@/components/parties/parties-view';

export const metadata = {
  title: 'Suppliers | ShopNear Finance',
};

export default function SuppliersPage() {
  return <PartiesView type="supplier" />;
}
