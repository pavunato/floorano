export interface HoverCardData {
  title: string;
  details: string[];
  highlight: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  accent?: string;
}
