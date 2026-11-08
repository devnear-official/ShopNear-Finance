import React from 'react';
import { PartiesView } from '@/components/parties/parties-view';

export const metadata = {
  title: 'Customers | ShopNear Finance',
};

export default function CustomersPage() {
  return <PartiesView type="customer" />;
}
