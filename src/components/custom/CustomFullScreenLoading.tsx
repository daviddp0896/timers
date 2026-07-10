import { Loader2 } from 'lucide-react';

export const CustomFullScreenLoading = () => (
  <div className="flex min-h-screen w-full items-center justify-center">
    <Loader2 className="text-muted-foreground size-8 animate-spin" />
  </div>
);
