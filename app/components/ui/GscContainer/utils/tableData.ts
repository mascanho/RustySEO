export interface TableData {
  id: string;
  keyword: string;
  clicks: number;
  url: string;
  impressions: number;
  ctr: number;
}

export const mockData: TableData[] = Array.from({ length: 50 }, (_, i) => ({
  id: (i + 1).toString(),
  keyword: `Keyword ${i + 1}`,
  clicks: Math.floor(Math.random() * 1000),
  url: `https://algarvewonders.com{i + 1}.com`,
  impressions: Math.floor(Math.random() * 10000),
  ctr: Math.floor(Math.random() * 100),
}));
