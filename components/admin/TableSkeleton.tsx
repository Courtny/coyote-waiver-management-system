import { Skeleton } from '@coyote-force/ui';

type TableSkeletonProps = {
  columns: number;
  rows?: number;
  /** Accessible name for the loading region */
  ariaLabel?: string;
  className?: string;
};

export function TableSkeleton({
  columns,
  rows = 8,
  ariaLabel = 'Loading table',
  className = '',
}: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
      className={`overflow-x-auto ${className}`.trim()}
    >
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-border">
            {Array.from({ length: columns }, (_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-4 max-w-[7rem]" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, ri) => (
            <tr key={ri} className="border-b border-border">
              {Array.from({ length: columns }, (_, ci) => (
                <td key={ci} className="px-4 py-3">
                  <Skeleton
                    className="h-4"
                    style={{ maxWidth: ci === 0 ? '65%' : '92%' }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
