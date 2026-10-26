export interface CoverageItem {
  id: string;
  group: string;
  source: string;
  target?: string;
  reviewed?: boolean;
  audioReady?: boolean;
}

export interface CoverageGroup {
  group: string;
  total: number;
  translated: number;
  reviewed: number;
  dubbed: number;
  translationPercent: number;
  reviewPercent: number;
  dubbingPercent: number;
}

export function buildCoverage(items: CoverageItem[]): CoverageGroup[] {
  const groups = new Map<string, CoverageItem[]>();
  for (const item of items) {
    const key = item.group || "Sem grupo";
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([group, list]) => {
      const total = list.length;
      const translated = list.filter((item) => item.target?.trim()).length;
      const reviewed = list.filter((item) => item.reviewed).length;
      const dubbed = list.filter((item) => item.audioReady).length;
      return {
        group,
        total,
        translated,
        reviewed,
        dubbed,
        translationPercent: total ? Math.round((translated / total) * 100) : 0,
        reviewPercent: total ? Math.round((reviewed / total) * 100) : 0,
        dubbingPercent: total ? Math.round((dubbed / total) * 100) : 0,
      };
    })
    .sort((a, b) => a.translationPercent - b.translationPercent || b.total - a.total);
}

export function findCoverageGaps(items: CoverageItem[]) {
  return items.filter((item) =>
    !item.target?.trim() ||
    !item.reviewed ||
    !item.audioReady
  );
}

export function coverageSummary(items: CoverageItem[]) {
  const groups = buildCoverage(items);
  const total = items.length;
  const translated = items.filter((item) => item.target?.trim()).length;
  const reviewed = items.filter((item) => item.reviewed).length;
  const dubbed = items.filter((item) => item.audioReady).length;
  return {
    total,
    translated,
    reviewed,
    dubbed,
    groups: groups.length,
    translationPercent: total ? Math.round((translated / total) * 100) : 0,
    reviewPercent: total ? Math.round((reviewed / total) * 100) : 0,
    dubbingPercent: total ? Math.round((dubbed / total) * 100) : 0,
  };
}
