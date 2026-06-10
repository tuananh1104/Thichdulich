export function prioritizeFavorites<T extends { id: string }>(items: T[], favoriteIds: Set<string>): T[] {
  return [...items].sort((a, b) => {
    const aFavorite = favoriteIds.has(a.id);
    const bFavorite = favoriteIds.has(b.id);
    if (aFavorite === bFavorite) return 0;
    return aFavorite ? -1 : 1;
  });
}
