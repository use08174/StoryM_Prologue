// import Phaser from "phaser";

// import { Npc } from "./Npc";
// import { Evidence } from "./Evidence";
// import PubSub from "pubsub-js";
// import topics from "rpg/data/topics";
// import characters from "rpg/data/characters";
// import Topics from "rpg/data/topics";
// import { GameResult, ResultScreenProps } from "components/ResultScreen";

// enum Animation {
//   Left = "Left",
//   Right = "Right",
//   Up = "Up",
//   Down = "Down",
// }

// const Velocity = {
//   Horizontal: 250,
//   Vertical: 250,
// } as const;

// type WASD = {
//   WKey: Phaser.Input.Keyboard.Key;
//   AKey: Phaser.Input.Keyboard.Key;
//   SKey: Phaser.Input.Keyboard.Key;
//   DKey: Phaser.Input.Keyboard.Key;
// };

// export default class Player extends Phaser.Physics.Arcade.Sprite {
//   body!: Phaser.Physics.Arcade.Body;
//   sensor: Phaser.Physics.Arcade.Sprite;
//   // An NPC that is close enough to speak to.
//   closeNpc: Npc | null = null;
//   closeEvidence: Evidence | null = null;
//   cursors: Phaser.Types.Input.Keyboard.CursorKeys;
//   WASDKeys: WASD;

//   constructor(
//     scene: Phaser.Scene,
//     x: number,
//     y: number,
//     texture = characters.main_girl.sprite,
//     frame = 0,
//   ) {
//     super(scene, x, y, texture, frame);
//     this.setDepth(2);

//     // Add the sprite to the scene
//     scene.add.existing(this);

//     // Enable physics for the sprite
//     scene.physics.world.enable(this);

//     // The image has a bit of whitespace so use setSize and
//     // setOffset to control the size of the player's body
//     this.setSize(32, 48).setOffset(16, 14);
//     this.sensor = scene.physics.add.sprite(this.x, this.y, "");
//     this.sensor.setSize(72, 96);
//     this.sensor.setVisible(false);

//     // Collide the sprite body with the world boundary
//     this.setCollideWorldBounds(true);

//     // Set the camera to follow the game object
//     scene.cameras.main.startFollow(this);
//     scene.cameras.main.setZoom(1);

//     // Add cursor keys
//     this.cursors = scene.input.keyboard!.createCursorKeys();
//     this.WASDKeys = scene.input.keyboard!.addKeys({
//       WKey: Phaser.Input.Keyboard.KeyCodes.W,
//       AKey: Phaser.Input.Keyboard.KeyCodes.A,
//       SKey: Phaser.Input.Keyboard.KeyCodes.S,
//       DKey: Phaser.Input.Keyboard.KeyCodes.D,
//     }) as WASD;

//     // Create sprite animations
//     this.createAnimations();

//     this.play(Animation.Right);
//   }

//   public setUpSensingNpcs(npcs: Npc[]) {
//     for (const npc of npcs) {
//       this.scene.physics.add.overlap(this.sensor, npc, (player, object) => {
//         const npc = object as Npc;
//         if (this.closeNpc !== npc) {
//           this.closeNpc = npc as Npc;
//           this.closeNpc.toggleInteractText();
//         }
//       });
//     }
//   }

//   public setUpSensingEvidence(evidences: Evidence[]) {
//     for (const evidence of evidences) {
//       this.scene.physics.add.overlap(this, evidence, (_player, object) => {
//         const evidence = object as Evidence;
//         if (this.closeEvidence !== evidence) {
//           this.closeEvidence = evidence as Evidence;
//         }
//         this.closeEvidence = evidence as Evidence;
//       });
//     }
//   }

//   // public setUpEvents(map: Phaser.Tilemaps.Tilemap) {
//   //   // Hacky hardcode real quick lol.
//   //   const caning_point = map.findObject(
//   //     "Misc",
//   //     object => object.name === "Caning Teleport",
//   //   )!;
//   //   PubSub.subscribe(
//   //     Topics.action,
//   //     (_channel, data: { character: string; action: string }) => {
//   //       if (data.action === "Cane") {
//   //         this.x = caning_point.x!;
//   //         this.y = caning_point.y!;
//   //         this.setVelocity(0, 0);
//   //       }
//   //     },
//   //   );
//   // }

//   private createAnimation(
//     animationKey: Animation,
//     row: number,
//     numFrames: number = 9,
//     frameRate: number = 16,
//     repeat: number = -1,
//   ) {
//     this.anims.create({
//       key: animationKey,
//       frames: this.anims.generateFrameNumbers(characters.main_girl.sprite, {
//         // 13 is hardcoded from the spritesheet
//         start: row * 9,
//         end: row * 9 + numFrames - 1,
//       }),
//       frameRate,
//       repeat,
//     });
//   }

//   private createAnimations() {
//     // row to directionmap hardcoded from LPC spritesheets
//     this.createAnimation(Animation.Up, 0);
//     this.createAnimation(Animation.Left, 1);
//     this.createAnimation(Animation.Down, 2);
//     this.createAnimation(Animation.Right, 3);
//   }

//   update() {
//     // Stop any previous movement from the last frame
//     this.body.setVelocity(0);
//     this.sensor.x = this.x;
//     this.sensor.y = this.y;

//     if (
//       !this.closeNpc ||
//       !this.scene.physics.overlap(this.sensor, this.closeNpc)
//     ) {
//       this.closeNpc?.toggleInteractText();
//       this.closeNpc = null;
//     }
//     if (
//       !this.closeEvidence ||
//       !this.scene.physics.overlap(this, this.closeEvidence)
//     ) {
//       this.closeEvidence = null;
//     }

//     if (this.cursors.space.isDown && this.closeNpc?.canInteract) {
//       PubSub.publish(
//         this.closeNpc.characterDef.interactTopic,
//         this.closeNpc.characterDef.eastworldId,
//       );
//       PubSub.publish(
//         topics.giveKeysToDom,
//         this.closeNpc.characterDef.eastworldId,
//       );
//       // This needs to be reset or isDown gets stuck when we disable keyboard input later on
//       Object.values(this.cursors).forEach(value => value.reset());
//       Object.values(this.WASDKeys).forEach(value => value.reset());
//     }

//     if (this.cursors.space.isDown && this.closeEvidence) {
//       PubSub.publish(
//         topics.enterEvidenceModal,
//         this.closeEvidence.evidence_name,
//       );
//       PubSub.publish(topics.giveKeysToDom);
//       // This needs to be reset or isDown gets stuck when we disable keyboard input later on
//       Object.values(this.cursors).forEach(value => value.reset());
//       Object.values(this.WASDKeys).forEach(value => value.reset());
//     }

//     // Horizontal movement
//     switch (true) {
//       case this.cursors.left.isDown || this.WASDKeys.AKey.isDown:
//         this.body.setVelocityX(-Velocity.Horizontal);
//         break;

//       case this.cursors.right.isDown || this.WASDKeys.DKey.isDown:
//         this.body.setVelocityX(Velocity.Horizontal);
//         break;
//     }

//     // Vertical movement
//     switch (true) {
//       case this.cursors.up.isDown || this.WASDKeys.WKey.isDown:
//         this.body.setVelocityY(-Velocity.Vertical);
//         break;

//       case this.cursors.down.isDown || this.WASDKeys.SKey.isDown:
//         this.body.setVelocityY(Velocity.Vertical);
//         break;
//     }

//     let speed = Velocity.Horizontal;
//     if (this.cursors.shift.isDown) {
//       speed *= 2;
//     }

//     // Normalize and scale the velocity so that player can't move faster along a diagonal
//     this.body.velocity.normalize().scale(speed);

//     // Update the animation last and give left/right animations precedence over up/down animations
//     switch (true) {
//       case this.cursors.left.isDown || this.WASDKeys.AKey.isDown:
//         this.anims.play(Animation.Left, true);
//         break;

//       case this.cursors.right.isDown || this.WASDKeys.DKey.isDown:
//         this.anims.play(Animation.Right, true);
//         break;

//       case this.cursors.up.isDown || this.WASDKeys.WKey.isDown:
//         this.anims.play(Animation.Up, true);
//         break;

//       case this.cursors.down.isDown || this.WASDKeys.SKey.isDown:
//         this.anims.play(Animation.Down, true);
//         break;

//       // default:
//       //   if (this.anims.currentAnim !== this.anims.get(Animation.Fall)) {
//       //     const frame = this.anims.currentAnim?.frames[0].frame;
//       //     this.anims.stop();

//       //     this.setFrame(frame!);
//       //   }
//     }
//   }
// }
import Phaser from "phaser";

import { Npc } from "./Npc";
import { Evidence } from "./Evidence";
import PubSub from "pubsub-js";
import topics from "rpg/data/topics";
import characters from "rpg/data/characters";

enum Animation {
  Left = "Left",
  Right = "Right",
  Up = "Up",
  Down = "Down",
}

const Velocity = { Horizontal: 250, Vertical: 250 } as const;

/** ✅ 시트 한 행의 프레임 개수(열 수). 보통 9 */
const COLS = 9;

/** ✅ 우리가 쓰는 첫 행의 0-based 오프셋.
 *  - 9~12행만 잘라서 로드했다면: 0
 *  - 전체 시트(1행~13행 등)에서 9~12행을 쓴다면: 8 (9번째 행이 0-based 8)
 */
const BASE_ROW_OFFSET = 0;

/** ✅ 방향 → 실제 행 인덱스(잘라서 로드한 뒤의 상대 행, 즉 0~3)
 *  당신 시트 설명: 9=Up, 10=Left, 11=Down, 12=Right
 *  → 잘라서 로드했다면 {Up:0, Left:1, Down:2, Right:3} 가 맞습니다.
 *  만약 아래/오른쪽이 뒤바뀌어 보이면 여기 숫자를 바꿔 바로잡으면 됩니다.
 */
const ROW_MAP: Record<Animation, number> = {
  [Animation.Up]: 0,
  [Animation.Left]: 1,
  [Animation.Down]: 2,
  [Animation.Right]: 3,
};

/** ✅ 투명(빈) 프레임이 섞여 있는 열 인덱스를 지정 (0~COLS-1)
 *  예) 왼쪽 행의 3,7번 칸이 비었다면 Left: [3,7]
 */
const SKIP_COLS: Partial<Record<Animation, number[]>> = {
  // Left: [/* 예: 3, 7 */],
  // Right: [],
  // Up: [],
  // Down: [],
};

type WASD = {
  WKey: Phaser.Input.Keyboard.Key;
  AKey: Phaser.Input.Keyboard.Key;
  SKey: Phaser.Input.Keyboard.Key;
  DKey: Phaser.Input.Keyboard.Key;
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
  body!: Phaser.Physics.Arcade.Body;
  sensor: Phaser.Physics.Arcade.Sprite;

  closeNpc: Npc | null = null;
  closeEvidence: Evidence | null = null;

  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  WASDKeys: WASD;

  private lastFacing: Animation = Animation.Right;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture = characters.main_girl.sprite,
    frame = 0,
  ) {
    super(scene, x, y, texture, frame);
    this.setDepth(2);

    scene.add.existing(this);
    scene.physics.world.enable(this);

    // 충돌 박스 (렌더링 잘림과는 무관)
    this.setSize(32, 48).setOffset(16, 14);

    this.sensor = scene.physics.add.sprite(this.x, this.y, "");
    this.sensor.setSize(72, 96).setVisible(false);

    this.setCollideWorldBounds(true);

    scene.cameras.main.startFollow(this);
    scene.cameras.main.setZoom(1);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.WASDKeys = scene.input.keyboard!.addKeys({
      WKey: Phaser.Input.Keyboard.KeyCodes.W,
      AKey: Phaser.Input.Keyboard.KeyCodes.A,
      SKey: Phaser.Input.Keyboard.KeyCodes.S,
      DKey: Phaser.Input.Keyboard.KeyCodes.D,
    }) as WASD;

    this.createAnimations();
    this.anims.play(this.animKey(Animation.Right));
  }

  /** 텍스처 프리픽스가 붙은 애니메이션 키(전역 키 충돌 방지) */
  private animKey(a: Animation) {
    return `${this.texture.key}:${a}`;
  }

  /** (row, col) → 전역 프레임 인덱스 */
  private frameIndex(row: number, col: number) {
    return (BASE_ROW_OFFSET + row) * COLS + col;
  }

  /** 지정된 행에서, 스킵할 열을 제외한 프레임 배열 생성 */
  private framesForRow(row: number, skipCols: number[] = []) {
    const key = this.texture.key;
    const skip = new Set(skipCols);
    const cols = Array.from({ length: COLS }, (_, i) => i).filter(i => !skip.has(i));
    return cols.map(col => ({ key, frame: this.frameIndex(row, col) }));
  }

  private createAnimation(a: Animation, row: number, frameRate = 16, repeat = -1) {
    const key = this.texture.key;
    const animKey = this.animKey(a);

    if (this.anims.exists(animKey)) this.anims.remove(animKey);

    const skips = SKIP_COLS[a] ?? [];
    this.anims.create({
      key: animKey,
      frames: this.framesForRow(row, skips),
      frameRate,
      repeat,
    });
  }

  private createAnimations() {
    // ROW_MAP을 기반으로 방향별로 정확한 행을 지정 (잘라서 로드/전체 시트 모두 대응)
    this.createAnimation(Animation.Up, ROW_MAP[Animation.Up]);
    this.createAnimation(Animation.Left, ROW_MAP[Animation.Left]);
    this.createAnimation(Animation.Down, ROW_MAP[Animation.Down]);
    this.createAnimation(Animation.Right, ROW_MAP[Animation.Right]);
  }

  public setUpSensingNpcs(npcs: Npc[]) {
    for (const npc of npcs) {
      this.scene.physics.add.overlap(this.sensor, npc, (_player, object) => {
        const n = object as Npc;
        if (this.closeNpc !== n) {
          this.closeNpc = n;
          this.closeNpc.toggleInteractText();
        }
      });
    }
  }

  public setUpSensingEvidence(evidences: Evidence[]) {
    for (const e of evidences) {
      this.scene.physics.add.overlap(this, e, (_player, object) => {
        const ev = object as Evidence;
        if (this.closeEvidence !== ev) {
          this.closeEvidence = ev;
        }
        this.closeEvidence = ev;
      });
    }
  }

  update() {
    // 속도 초기화
    this.body.setVelocity(0);
    this.sensor.setPosition(this.x, this.y);

    // 근접 대상 갱신
    if (!this.closeNpc || !this.scene.physics.overlap(this.sensor, this.closeNpc)) {
      this.closeNpc?.toggleInteractText();
      this.closeNpc = null;
    }
    if (!this.closeEvidence || !this.scene.physics.overlap(this, this.closeEvidence)) {
      this.closeEvidence = null;
    }

    // 상호작용
    if (this.cursors.space.isDown && this.closeNpc?.canInteract) {
      PubSub.publish(this.closeNpc.characterDef.interactTopic, this.closeNpc.characterDef.eastworldId);
      PubSub.publish(topics.giveKeysToDom, this.closeNpc.characterDef.eastworldId);
      Object.values(this.cursors).forEach((v: any) => v?.reset?.());
      Object.values(this.WASDKeys).forEach(v => v.reset());
    }
    if (this.cursors.space.isDown && this.closeEvidence) {
      PubSub.publish(topics.enterEvidenceModal, this.closeEvidence.evidence_name);
      PubSub.publish(topics.giveKeysToDom);
      Object.values(this.cursors).forEach((v: any) => v?.reset?.());
      Object.values(this.WASDKeys).forEach(v => v.reset());
    }

    // 입력 읽기
    const left  = this.cursors.left.isDown  || this.WASDKeys.AKey.isDown;
    const right = this.cursors.right.isDown || this.WASDKeys.DKey.isDown;
    const up    = this.cursors.up.isDown    || this.WASDKeys.WKey.isDown;
    const down  = this.cursors.down.isDown  || this.WASDKeys.SKey.isDown;

    // 이동 벡터
    if (left)      this.body.setVelocityX(-Velocity.Horizontal);
    else if (right) this.body.setVelocityX(Velocity.Horizontal);

    if (up)        this.body.setVelocityY(-Velocity.Vertical);
    else if (down)  this.body.setVelocityY(Velocity.Vertical);

    // 대각선 속도 보정 (0속도 가드)
    let speed = Velocity.Horizontal;
    if (this.cursors.shift.isDown) speed *= 2;

    const v = this.body.velocity;
    if (v.lengthSq() > 0) v.normalize().scale(speed);
    else this.body.setVelocity(0, 0);

    // 애니메이션 재생 (좌/우 > 상/하 우선)
    if (left) {
      this.anims.play(this.animKey(Animation.Left), true);
      this.lastFacing = Animation.Left;
    } else if (right) {
      this.anims.play(this.animKey(Animation.Right), true);
      this.lastFacing = Animation.Right;
    } else if (up) {
      this.anims.play(this.animKey(Animation.Up), true);
      this.lastFacing = Animation.Up;
    } else if (down) {
      this.anims.play(this.animKey(Animation.Down), true);
      this.lastFacing = Animation.Down;
    } else {
      // Idle: 해당 방향의 첫 프레임로 고정
      const row = ROW_MAP[this.lastFacing];
      this.anims.stop();
      this.setFrame(this.frameIndex(row, 0));
    }
  }
}
