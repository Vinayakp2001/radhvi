const COLOR_MAP: Record<string, string> = {
  // order status
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped:    'bg-purple-100 text-purple-800',
  delivered:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
  refunded:   'bg-gray-100 text-gray-700',
  // payment
  paid:       'bg-green-100 text-green-800',
  failed:     'bg-red-100 text-red-800',
  // return
  approved:   'bg-green-100 text-green-800',
  rejected:   'bg-red-100 text-red-800',
  picked_up:  'bg-blue-100 text-blue-800',
  completed:  'bg-gray-100 text-gray-700',
  // inquiry
  contacted:  'bg-blue-100 text-blue-800',
  quoted:     'bg-indigo-100 text-indigo-800',
  converted:  'bg-green-100 text-green-800',
};

export default function StatusBadge({ status }: { status: string }) {
  const cls = COLOR_MAP[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
