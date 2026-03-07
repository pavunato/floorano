export const theme = {
  bg: '#f5f0e8',
  paper: '#fdfaf4',
  ink: '#1a1614',
  inkLight: '#5c5048',
  wall: '#2a2420',
  wallFill: '#d4cfc8',
  room1: '#e8dfd0',
  room2: '#dce8e0',
  room3: '#dde0ea',
  room4: '#ead8d8',
  room5: '#e8e4d8',
  accent: '#8b6f5e',
  accent2: '#5e7b6f',
  red: '#c0392b',
  newFloor: '#e8f0e8',
  newAccent: '#2d6a4f',
  stairFill: '#e8e8e0',
  fontMono: "'DM Mono', monospace",
  fontSans: "'DM Sans', sans-serif",
  fontSerif: "'Playfair Display', serif",
};

export const roomColors = [
  '#e8dfd0', '#dce8e0', '#dde0ea', '#ead8d8', '#e8e4d8',
  '#ffefd5', '#dce8f0', '#e8f0e4', '#d4edda', '#fde8c8',
];

export function getDefaultRoomColor(index: number): string {
  return roomColors[index % roomColors.length];
}
