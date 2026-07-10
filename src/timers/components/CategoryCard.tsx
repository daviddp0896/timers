import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/time';
import { useTimersStore } from '@/timers/store/timers.store';
import type { Category } from '@/timers/interfaces/timer.interface';

interface Props {
  category: Category;
  now: number;
}

export const CategoryCard = ({ category, now }: Props) => {
  const { color } = category;

  // Live total for the whole category and whether any of its activities is running.
  const total = useTimersStore((state) =>
    category.activities.reduce((sum, a) => sum + state.elapsedOf(a.id, now), 0),
  );
  const isActive = useTimersStore(
    (state) =>
      state.runningId !== null &&
      category.activities.some((a) => a.id === state.runningId),
  );

  return (
    <Link
      to={`/category/${category.id}`}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
        color.border,
        color.ring,
      )}
    >
      {/* colored accent bar down the left edge */}
      <span className={cn('absolute inset-y-0 left-0 w-1.5', color.bar)} />

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">{category.name}</h2>
          <p className="text-muted-foreground text-sm">
            {category.activities.length} actividades
          </p>
        </div>
        {isActive && (
          <span className={cn('size-2.5 rounded-full', color.bar, 'animate-pulse')} />
        )}
      </div>

      <div className="mt-6 flex items-end justify-between">
        <span className={cn('font-mono text-2xl tabular-nums', color.text)}>
          {formatDuration(total)}
        </span>
        <ChevronRight
          className={cn(
            'size-5 transition-transform group-hover:translate-x-0.5',
            color.text,
          )}
        />
      </div>
    </Link>
  );
};
