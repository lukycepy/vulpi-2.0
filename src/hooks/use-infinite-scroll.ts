import { useState, useEffect, useRef, useCallback } from 'react';

export function useInfiniteScroll<T>(items: T[], itemsPerPage = 20) {
  const [displayedItems, setDisplayedItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const observerTarget = useRef<any>(null);

  useEffect(() => {
    // Reset when items change (e.g. filtering)
    setPage(1);
    setDisplayedItems(items.slice(0, itemsPerPage));
  }, [items, itemsPerPage]);

  useEffect(() => {
    const currentLimit = page * itemsPerPage;
    if (currentLimit > displayedItems.length && displayedItems.length < items.length) {
       setDisplayedItems(items.slice(0, currentLimit));
    }
  }, [page, items, itemsPerPage, displayedItems.length]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && displayedItems.length < items.length) {
      setPage((prev) => prev + 1);
    }
  }, [displayedItems.length, items.length]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  return { displayedItems, observerTarget };
}
