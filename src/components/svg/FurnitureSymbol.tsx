'use client';

import { FurnitureType } from '@/lib/dsl/types';
import StoveSymbol from './symbols/StoveSymbol';
import SinkSymbol from './symbols/SinkSymbol';
import FridgeSymbol from './symbols/FridgeSymbol';
import ToiletSymbol from './symbols/ToiletSymbol';
import ShowerSymbol from './symbols/ShowerSymbol';
import WasherSymbol from './symbols/WasherSymbol';
import DryerSymbol from './symbols/DryerSymbol';
import SofaSymbol from './symbols/SofaSymbol';
import TVSymbol from './symbols/TVSymbol';
import BedSymbol from './symbols/BedSymbol';
import TableSymbol from './symbols/TableSymbol';
import ChairSymbol from './symbols/ChairSymbol';
import DeskSymbol from './symbols/DeskSymbol';
import WardrobeSymbol from './symbols/WardrobeSymbol';
import PlantSymbol from './symbols/PlantSymbol';
import BathtubSymbol from './symbols/BathtubSymbol';

interface Props {
  furnitureType: FurnitureType;
  x: number;
  y: number;
  w: number;
  h: number;
}

const symbolMap: Record<FurnitureType, React.ComponentType<{ x: number; y: number; w: number; h: number }>> = {
  stove: StoveSymbol,
  sink: SinkSymbol,
  fridge: FridgeSymbol,
  toilet: ToiletSymbol,
  shower: ShowerSymbol,
  washer: WasherSymbol,
  dryer: DryerSymbol,
  sofa: SofaSymbol,
  tv: TVSymbol,
  bed: BedSymbol,
  table: TableSymbol,
  chair: ChairSymbol,
  desk: DeskSymbol,
  wardrobe: WardrobeSymbol,
  plant: PlantSymbol,
  bathtub: BathtubSymbol,
};

export default function FurnitureSymbol({ furnitureType, x, y, w, h }: Props) {
  const Component = symbolMap[furnitureType];
  if (!Component) return null;
  return <Component x={x} y={y} w={w} h={h} />;
}
