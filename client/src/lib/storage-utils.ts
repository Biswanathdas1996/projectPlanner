import { STORAGE_KEYS } from './bpmn-utils';
import type { MarketResearchData } from './market-research-agent';

export function getMarketResearchData(): MarketResearchData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.MARKET_RESEARCH_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to parse market research data:', error);
    localStorage.removeItem(STORAGE_KEYS.MARKET_RESEARCH_DATA);
    return null;
  }
}

export function saveMarketResearchData(data: MarketResearchData): void {
  localStorage.setItem(STORAGE_KEYS.MARKET_RESEARCH_DATA, JSON.stringify(data));
  localStorage.setItem(STORAGE_KEYS.MARKET_RESEARCH_TIMESTAMP, new Date().toISOString());
}

export function clearMarketResearchData(): void {
  localStorage.removeItem(STORAGE_KEYS.MARKET_RESEARCH_DATA);
  localStorage.removeItem(STORAGE_KEYS.MARKET_RESEARCH_TIMESTAMP);
}

export function hasMarketResearchData(): boolean {
  return localStorage.getItem(STORAGE_KEYS.MARKET_RESEARCH_DATA) !== null;
}

export function getMarketResearchTimestamp(): Date | null {
  const timestamp = localStorage.getItem(STORAGE_KEYS.MARKET_RESEARCH_TIMESTAMP);
  return timestamp ? new Date(timestamp) : null;
}

export function getProjectDescription(): string {
  return localStorage.getItem(STORAGE_KEYS.PROJECT_DESCRIPTION) || '';
}

export function saveProjectDescription(description: string): void {
  localStorage.setItem(STORAGE_KEYS.PROJECT_DESCRIPTION, description);
}