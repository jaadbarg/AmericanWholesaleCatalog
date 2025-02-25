// src/app/(protected)/admin/orders/confirmed/[id]/page.tsx
import { redirect } from 'next/navigation';

export default function ConfirmedOrderDetailRedirectPage(props: any) {
  const { params } = props;
  
  // Redirect to the main order detail page
  redirect(`/admin/orders/${params.id}`);
}