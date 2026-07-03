/**
 * Unified action map over keyboard + gamepad (spec §12).
 * The sim consumes immutable InputFrame snapshots; edges (pressed) are
 * computed per fixed step so buffering works identically at any display Hz.
 */
import Phaser from 'phaser';
import type { InputFrame } from '../entities/playerSim';
import { touchState } from './touch';

export interface ActionBindings {
  left: string[];
  right: string[];
  up: string[];
  down: string[];
  jump: string[];
  fire: string[];
  pound: string[];
  pause: string[];
}

export const DEFAULT_BINDINGS: ActionBindings = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  jump: ['KeyZ', 'Space', 'KeyK'],
  fire: ['KeyX', 'KeyJ'],
  pound: ['KeyC', 'KeyL', 'ShiftLeft'],
  pause: ['Escape', 'KeyP'],
};

const PAD = {
  jump: [0, 2], // A / X
  fire: [1, 3], // B / Y  (and shoulder R)
  fireShoulder: [5, 7],
  pound: [4, 6], // shoulders L
  pause: [9],
  deadzone: 0.35,
};

export class InputSystem {
  private keysDown = new Set<string>();
  private prev = { jump: false, fire: false, pound: false, pause: false };
  pausePressed = false;
  /** true once any input has happened (unlocks audio context) */
  interacted = false;

  constructor(private scene: Phaser.Scene, private bindings: ActionBindings = DEFAULT_BINDINGS) {
    const kb = scene.input.keyboard;
    if (kb) {
      kb.on('keydown', (e: KeyboardEvent) => {
        this.keysDown.add(e.code);
        this.interacted = true;
      });
      kb.on('keyup', (e: KeyboardEvent) => this.keysDown.delete(e.code));
    }
    scene.game.events.on(Phaser.Core.Events.BLUR, () => this.keysDown.clear());
  }

  private key(action: keyof ActionBindings): boolean {
    return this.bindings[action].some((code) => this.keysDown.has(code));
  }

  private pad(): Phaser.Input.Gamepad.Gamepad | null {
    const gp = this.scene.input.gamepad;
    if (!gp || gp.total === 0) return null;
    return gp.getPad(0) ?? null;
  }

  private padButton(indices: number[]): boolean {
    const pad = this.pad();
    if (!pad) return false;
    return indices.some((i) => pad.buttons[i]?.pressed);
  }

  /** Sample the current device state; edges are computed vs the last sample. */
  sample(): InputFrame & { pause: boolean } {
    const pad = this.pad();
    let axisX = 0;
    let axisY = 0;
    if (pad) {
      axisX = pad.axes.length > 0 ? pad.axes[0].getValue() : 0;
      axisY = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;
      if (pad.buttons.some((b) => b.pressed)) this.interacted = true;
    }

    const left = this.key('left') || axisX < -PAD.deadzone || this.padButton([14]) || touchState.left;
    const right = this.key('right') || axisX > PAD.deadzone || this.padButton([15]) || touchState.right;
    const up = this.key('up') || axisY < -PAD.deadzone || this.padButton([12]) || touchState.up;
    const down = this.key('down') || axisY > PAD.deadzone || this.padButton([13]) || touchState.down;
    const jump = this.key('jump') || this.padButton(PAD.jump) || touchState.jump;
    const fire = this.key('fire') || this.padButton(PAD.fire) || this.padButton(PAD.fireShoulder) || touchState.fire;
    const pound = this.key('pound') || this.padButton(PAD.pound) || touchState.pound;
    const pause = this.key('pause') || this.padButton(PAD.pause) || touchState.pause;
    if (touchState.left || touchState.right || touchState.jump || touchState.fire) this.interacted = true;

    const frame = {
      left, right, up, down,
      jumpHeld: jump,
      jumpPressed: jump && !this.prev.jump,
      fireHeld: fire,
      firePressed: fire && !this.prev.fire,
      poundPressed: pound && !this.prev.pound,
      pause: pause && !this.prev.pause,
    };
    this.prev = { jump, fire, pound, pause };
    return frame;
  }
}
