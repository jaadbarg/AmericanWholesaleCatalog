// src/app/(protected)/admin/orders/cancelled/[id]/page.tsx
import { redirect } from 'next/navigation';

export default function CancelledOrderDetailRedirectPage(props: any) {
  const { params } = props;
  
  // Redirect to the main order detail page
  redirect(`/admin/orders/${params.id}`);
}