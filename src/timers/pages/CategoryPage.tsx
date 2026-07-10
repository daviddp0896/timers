import { Link, Navigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/time';
import { CATEGORY_BY_ID } from '@/timers/data/categories.data';
import { ActivityTimer } from '@/timers/components/ActivityTimer';
import { useNow } from '@/timers/hooks/useNow';
import { useTimersStore } from '@/timers/store/timers.store';

export const CategoryPage = () => {
  const { categoryId } = useParams();
  const now = useNow();
  const category = categoryId ? CATEGORY_BY_ID.get(categoryId) : undefined;

  // Live total for the header — hook must run before any early return.
  const total = useTimersStore((state) =>
    (category?.activities ?? []).reduce((sum, a) => sum + state.elapsedOf(a.id, now), 0),
  );

  // Unknown category id → back to the list (Rule 23).
  if (!category) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Categorías
      </Link>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={cn('h-8 w-1.5 rounded-full', category.color.bar)} />
          <h1 className="text-2xl font-bold tracking-tight">{category.name}</h1>
        </div>
        <span className={cn('font-mono text-xl tabular-nums', category.color.text)}>
          {formatDuration(total)}
        </span>
      </div>

      <div className="space-y-3">
        {category.activities.map((activity) => (
          <ActivityTimer
            key={activity.id}
            activity={activity}
            color={category.color}
            now={now}
          />
        ))}
      </div>
    </div>
  );
};
