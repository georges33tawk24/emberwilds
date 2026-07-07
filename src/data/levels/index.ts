import type { LevelDef } from '../levelTypes';
import { LEVEL as THORNWOOD_1 } from './thornwood1';
import { LEVEL as THORNWOOD_2 } from './thornwood2';
import { LEVEL as THORNWOOD_3 } from './thornwood3';
import { LEVEL as CANYON_1 } from './canyon1';
import { LEVEL as CANYON_2 } from './canyon2';
import { LEVEL as CANYON_3 } from './canyon3';
import { LEVEL as CANYON_4 } from './canyon4';
import { LEVEL as CANYON_5 } from './canyon5';
import { LEVEL as MOSS_1 } from './moss1';
import { LEVEL as MOSS_2 } from './moss2';
import { LEVEL as MOSS_3 } from './moss3';
import { LEVEL as MOSS_4 } from './moss4';
import { LEVEL as MOSS_5 } from './moss5';
import { LEVEL as CINDER_1 } from './cinder1';
import { LEVEL as CINDER_2 } from './cinder2';
import { LEVEL as CINDER_3 } from './cinder3';
import { LEVEL as CINDER_4 } from './cinder4';

export const LEVELS: LevelDef[] = [
  THORNWOOD_1 as LevelDef,
  THORNWOOD_2 as LevelDef,
  THORNWOOD_3 as LevelDef,
  CANYON_1 as LevelDef,
  CANYON_2 as LevelDef,
  CANYON_3 as LevelDef,
  CANYON_4 as LevelDef,
  CANYON_5 as LevelDef,
  MOSS_1 as LevelDef,
  MOSS_2 as LevelDef,
  MOSS_3 as LevelDef,
  MOSS_4 as LevelDef,
  MOSS_5 as LevelDef,
  CINDER_1 as LevelDef,
  CINDER_2 as LevelDef,
  CINDER_3 as LevelDef,
  CINDER_4 as LevelDef,
];

const WORLD_LABELS: Record<string, { label: string; num: number }> = {
  thornwood: { label: 'THORNWOOD', num: 1 },
  canyon: { label: 'OCHRE CANYON', num: 2 },
  mossgrave: { label: 'MOSSGRAVE RUINS', num: 3 },
  cinder: { label: 'THE CINDERPEAKS', num: 4 },
};

export function worldOf(index: number): { label: string; num: number } {
  return WORLD_LABELS[LEVELS[index]?.theme] ?? WORLD_LABELS.thornwood;
}

/** e.g. 'OCHRE CANYON 2-3' — numbering within the level's world. */
export function levelLabel(index: number): string {
  const w = worldOf(index);
  let n = 0;
  for (let i = 0; i <= index; i++) {
    if (LEVELS[i].theme === LEVELS[index].theme) n++;
  }
  return `${w.label} ${w.num}-${n}`;
}
