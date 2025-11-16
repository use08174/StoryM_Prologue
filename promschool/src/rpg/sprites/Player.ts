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

// 시트에서 우리가 쓰는 첫 행 offset (잘라서 로드했다면 0이면 됨)
const BASE_ROW_OFFSET = 0;

type WASD = {
  WKey: Phaser.Input.Keyboard.Key;
  AKey: Phaser.Input.Keyboard.Key;
  SKey: Phaser.Input.Keyboard.Key;
  DKey: Phaser.Input.Keyboard.Key;
};

/** 🔹 성별별 스프라이트 레이아웃 정의 */
type CharAnimLayout = {
  cols: number; // 한 행의 칸 수
  // 방향 → 행 인덱스 (해당 방향 행이 없으면 undefined)
  rowMap: Partial<Record<Animation, number>>;
  // 특정 방향에서 사용할 컬럼 인덱스 목록 (없으면 0..cols-1 전부 사용)
  colsPerAnim?: Partial<Record<Animation, number[]>>;
  // 왼쪽은 오른쪽 애니메이션을 flipX 로 쓸지
  mirrorLeftFromRight: boolean;
};

// ✅ 여자 시트: 9컬럼, 4행(Up, Left, Down, Right) 있다고 가정
const FEMALE_LAYOUT: CharAnimLayout = {
  cols: 9,
  rowMap: {
    [Animation.Up]: 0,
    [Animation.Left]: 1,
    [Animation.Down]: 2,
    [Animation.Right]: 3,
  },
  // 필요하면 여기서도 특정 방향만 몇 프레임 쓸지 정할 수 있음
  colsPerAnim: undefined,
  mirrorLeftFromRight: false,
};

// ✅ 남자 시트: 6컬럼, 3행(Down, Right, Up)만 있다고 가정 (Left 행 없음)
//     그리고 앞/뒤(Down/Up)는 3프레임(0,1,2)만 사용
const MALE_LAYOUT: CharAnimLayout = {
  cols: 6,
  rowMap: {
    [Animation.Down]: 0,   // 0행 = 앞(Down)
    [Animation.Right]: 1,  // 1행 = 오른쪽
    [Animation.Up]: 2,     // 2행 = 위
    // Left 없음
  },
  colsPerAnim: {
    [Animation.Down]: [0, 1, 2],
    [Animation.Up]: [0, 1, 2],
    // 오른쪽은 6프레임 다 쓰고 싶으면 지정 안 해도 됨
    // [Animation.Right]: [0, 1, 2] 처럼 줄이고 싶으면 여기서 지정 가능
  },
  mirrorLeftFromRight: true,
};

export default class Player extends Phaser.Physics.Arcade.Sprite {
  body!: Phaser.Physics.Arcade.Body;
  sensor: Phaser.Physics.Arcade.Sprite;

  closeNpc: Npc | null = null;
  closeEvidence: Evidence | null = null;

  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  WASDKeys: WASD;

  private lastFacing: Animation = Animation.Right;

  private gender: "male" | "female";
  private layout: CharAnimLayout;
  private rowMap: Partial<Record<Animation, number>>;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    gender: "male" | "female" = "female",
  ) {
    const textureKey =
      gender === "male"
        ? characters.main_boy.sprite
        : characters.main_girl.sprite;

    super(scene, x, y, textureKey, 0);

    this.gender = gender;
    this.layout = gender === "male" ? MALE_LAYOUT : FEMALE_LAYOUT;
    this.rowMap = this.layout.rowMap;

    this.setDepth(2);

    scene.add.existing(this);
    scene.physics.world.enable(this);

    // 충돌 박스
    this.setSize(32, 48).setOffset(16, 14);

    this.sensor = scene.physics.add.sprite(this.x, this.y, "");
    this.sensor.setSize(72, 96).setVisible(false);

    this.setCollideWorldBounds(true);

    scene.cameras.main.startFollow(this);
    scene.cameras.main.setZoom(1.6);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.WASDKeys = scene.input.keyboard!.addKeys({
      WKey: Phaser.Input.Keyboard.KeyCodes.W,
      AKey: Phaser.Input.Keyboard.KeyCodes.A,
      SKey: Phaser.Input.Keyboard.KeyCodes.S,
      DKey: Phaser.Input.Keyboard.KeyCodes.D,
    }) as WASD;

    this.createAnimations();

    // 시작 자세: 앞(Down)을 보고, 없으면 Right
    this.lastFacing = Animation.Down;
    const startAnim =
      this.rowMap[Animation.Down] !== undefined
        ? Animation.Down
        : Animation.Right;
    this.anims.play(this.animKey(startAnim));
  }

  /** 텍스처 프리픽스가 붙은 애니메이션 키(전역 키 충돌 방지) */
  private animKey(a: Animation) {
    return `${this.texture.key}:${a}`;
  }

  /** (row, col) → 전역 프레임 인덱스 */
  private frameIndex(row: number, col: number) {
    return (BASE_ROW_OFFSET + row) * this.layout.cols + col;
  }

  /** 지정된 행/방향에서 사용할 프레임 배열 생성 */
  private framesForAnimRow(anim: Animation, row: number) {
    const key = this.texture.key;

    // 이 방향에서 사용할 컬럼 목록이 있으면 그걸 사용
    const customCols = this.layout.colsPerAnim?.[anim];
    const cols =
      customCols ??
      Array.from({ length: this.layout.cols }, (_, i) => i);

    return cols.map((col) => ({
      key,
      frame: this.frameIndex(row, col),
    }));
  }

  private createAnimation(
    anim: Animation,
    row: number,
    frameRate = 16,
    repeat = -1,
  ) {
    const animKey = this.animKey(anim);

    if (this.anims.exists(animKey)) this.anims.remove(animKey);

    this.anims.create({
      key: animKey,
      frames: this.framesForAnimRow(anim, row),
      frameRate,
      repeat,
    });
  }

  private createAnimations() {
    // rowMap에 정의된 방향만 애니메이션 생성
    ([
      Animation.Up,
      Animation.Left,
      Animation.Down,
      Animation.Right,
    ] as Animation[]).forEach((dir) => {
      const row = this.rowMap[dir];
      if (row === undefined) return;
      this.createAnimation(dir, row);
    });
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
    if (
      !this.closeNpc ||
      !this.scene.physics.overlap(this.sensor, this.closeNpc)
    ) {
      this.closeNpc?.toggleInteractText();
      this.closeNpc = null;
    }
    if (
      !this.closeEvidence ||
      !this.scene.physics.overlap(this, this.closeEvidence)
    ) {
      this.closeEvidence = null;
    }

    // 상호작용
    if (this.cursors.space.isDown && this.closeNpc?.canInteract) {
      PubSub.publish(
        this.closeNpc.characterDef.interactTopic,
        this.closeNpc.characterDef.eastworldId,
      );
      PubSub.publish(
        topics.giveKeysToDom,
        this.closeNpc.characterDef.eastworldId,
      );
      Object.values(this.cursors).forEach((v: any) => v?.reset?.());
      Object.values(this.WASDKeys).forEach((v) => v.reset());
    }
    if (this.cursors.space.isDown && this.closeEvidence) {
      PubSub.publish(
        topics.enterEvidenceModal,
        this.closeEvidence.evidence_name,
      );
      PubSub.publish(topics.giveKeysToDom);
      Object.values(this.cursors).forEach((v: any) => v?.reset?.());
      Object.values(this.WASDKeys).forEach((v) => v.reset());
    }

    // 입력 읽기
    const left = this.cursors.left.isDown || this.WASDKeys.AKey.isDown;
    const right = this.cursors.right.isDown || this.WASDKeys.DKey.isDown;
    const up = this.cursors.up.isDown || this.WASDKeys.WKey.isDown;
    const down = this.cursors.down.isDown || this.WASDKeys.SKey.isDown;

    // 이동 벡터
    if (left) this.body.setVelocityX(-Velocity.Horizontal);
    else if (right) this.body.setVelocityX(Velocity.Horizontal);

    if (up) this.body.setVelocityY(-Velocity.Vertical);
    else if (down) this.body.setVelocityY(Velocity.Vertical);

    // 대각선 속도 보정
    let speed = Velocity.Horizontal;
    if (this.cursors.shift.isDown) speed *= 2;

    const v = this.body.velocity;
    if (v.lengthSq() > 0) v.normalize().scale(speed);
    else this.body.setVelocity(0, 0);

    // 애니메이션 재생 (좌/우 > 상/하 우선)
    if (left) {
      if (
        this.layout.mirrorLeftFromRight &&
        this.rowMap[Animation.Right] !== undefined
      ) {
        // 남자: 오른쪽 행을 flipX 해서 왼쪽으로 사용
        this.setFlipX(true);
        this.anims.play(this.animKey(Animation.Right), true);
      } else if (this.rowMap[Animation.Left] !== undefined) {
        this.setFlipX(false);
        this.anims.play(this.animKey(Animation.Left), true);
      }
      this.lastFacing = Animation.Left;
    } else if (right) {
      this.setFlipX(false);
      const hasRight = this.rowMap[Animation.Right] !== undefined;
      const animKey = hasRight
        ? this.animKey(Animation.Right)
        : this.animKey(Animation.Left);
      this.anims.play(animKey, true);
      this.lastFacing = Animation.Right;
    } else if (up) {
      this.setFlipX(false);
      if (this.rowMap[Animation.Up] !== undefined) {
        this.anims.play(this.animKey(Animation.Up), true);
      }
      this.lastFacing = Animation.Up;
    } else if (down) {
      this.setFlipX(false);
      if (this.rowMap[Animation.Down] !== undefined) {
        this.anims.play(this.animKey(Animation.Down), true);
      }
      this.lastFacing = Animation.Down;
    } else {
      // Idle: 마지막 보는 방향의 첫 프레임
      this.anims.stop();

      let idleFacing = this.lastFacing;
      let idleRow = this.rowMap[idleFacing];

      // Left인데 행이 없고, mirror 모드면 Right 행을 사용
      if (
        idleRow === undefined &&
        idleFacing === Animation.Left &&
        this.layout.mirrorLeftFromRight
      ) {
        idleRow =
          this.rowMap[Animation.Right] ??
          this.rowMap[Animation.Down] ??
          this.rowMap[Animation.Up];
      }

      // 그래도 없으면 Down → Right → Up 순으로 찾고, 그래도 없으면 0
      if (idleRow === undefined) {
        idleRow =
          this.rowMap[Animation.Down] ??
          this.rowMap[Animation.Right] ??
          this.rowMap[Animation.Up] ??
          0;
      }

      this.setFrame(this.frameIndex(idleRow!, 0));
      this.setFlipX(
        this.layout.mirrorLeftFromRight &&
          this.lastFacing === Animation.Left,
      );
    }
  }
}
