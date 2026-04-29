const FAVORITES_KEY = "orbix_favorites";

interface FavoriteEntry {
  id: string;
  savedAt: number;
}

export function getFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const entries: FavoriteEntry[] = JSON.parse(raw);
    return new Set(entries.map((e) => e.id));
  } catch {
    return new Set();
  }
}

export function isFavorited(id: string): boolean {
  return getFavorites().has(id);
}

export function toggleFavorite(id: string): boolean {
  const favorites = getFavorites();
  if (favorites.has(id)) {
    favorites.delete(id);
  } else {
    favorites.add(id);
  }

  const entries: FavoriteEntry[] = Array.from(favorites).map((fid) => ({
    id: fid,
    savedAt: Date.now(),
  }));

  const maxItems = 50;
  if (entries.length > maxItems) {
    entries.sort((a, b) => b.savedAt - a.savedAt);
    entries.length = maxItems;
  }

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(entries));
  } catch {
    // storage full — ignore
  }

  return !favorites.has(id) || favorites.has(id);
}
