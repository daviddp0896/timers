import { CATEGORIES } from '@/timers/data/categories.data';
import { CategoryCard } from '@/timers/components/CategoryCard';
import { useNow } from '@/timers/hooks/useNow';

export const CategoriesPage = () => {
  const now = useNow();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
        <p className="text-muted-foreground">
          Elige una categoría para ver y cronometrar sus actividades.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category) => (
          <CategoryCard key={category.id} category={category} now={now} />
        ))}
      </div>
    </div>
  );
};
