import Phaser from "phaser";
import { key } from "../data";
import { Player } from "../sprites";
import { isProduction } from "env";
import { Npc } from "rpg/sprites/Npc";
import Topics from "rpg/data/topics";
import characters from "rpg/data/characters";
import { Evidence } from "rpg/sprites/Evidence";
import { getGameState } from "rpg/data/persistence";
import PubSub from "pubsub-js";


type TilesetDef = { name: string; image: string; extruded?: boolean };

type MapConfig = {
  // 스폰/포털 오브젝트가 들어있는 오브젝트 레이어 이름들 (여러 개 가능)
  objectGroups: string[];

  // 스폰 오브젝트 기본 이름
  spawnName: string;

  // 포털을 찾는 기준
  portalNameList?: string[];   // 예: ["to_town", "to_subway"]
  portalNamePrefix?: string;   // 예: "to_"
  portalFlagProperty?: string; // 예: "isPortal" (bool)

  // 타일 충돌 (여러 타일 레이어 가능)
  tileCollision: {
    layerNames?: string[];     // 명시 안 하면 전체 타일 레이어 스캔
    collidesProp?: string;     // 타일 속성명 (기본 "collides")
    layerFlagProp?: string;    // 레이어 속성 플래그명 (예: "collidesLayer")
  };

  // 오브젝트 레이어 충돌(박스) — 여러 개 가능
  objectCollisionLayers?: string[];

  // 맵 전용 타일셋 필요 시 override
  tilesets?: TilesetDef[];
};

const MAPS: Record<string, MapConfig> = {
  [key.tilemap.town]: {
    objectGroups: ["object"],
    spawnName: "main_character",
    portalNameList: ["to_main_map"],
    tileCollision: {
      layerNames: [],           // 비워두면 전체 스캔
      collidesProp: "collides",
      layerFlagProp: "collidesLayer",
    },
    objectCollisionLayers: ["block"],
  },
  [key.tilemap.subway]: {
      objectGroups: ["object"],
      spawnName: "main_character",
      portalNameList: ["to_main_map"],   // JSON과 동일
      tileCollision: {
        layerNames: [],                  // 존재하지 않는 "Collision" 제거
        collidesProp: "collides",
      },
      objectCollisionLayers: ["block"],  // JSON에 맞춤
    }
};

export default class Main extends Phaser.Scene {
  private player!: Player;
  private npcs: Npc[] = [];
  private evidences: Evidence[] = [];
  private isTransitioning = false;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private quest1!: { zone: Phaser.GameObjects.Zone; text: Phaser.GameObjects.Text; questId: number };
  private quest2!: { zone: Phaser.GameObjects.Zone; text: Phaser.GameObjects.Text; questId: number };
  private quest3!: { zone: Phaser.GameObjects.Zone; text: Phaser.GameObjects.Text; questId: number };
  private activeQuestZone: number | null = null;
  private questStarted: boolean = false;




  constructor() {
    super(key.scene.main);
  }

  create(data: { mapKey?: string; spawnName?: string } = {}) {
    const startMapKey = data.mapKey ?? key.tilemap.subway;
    const cfg = MAPS[startMapKey];
    if (!cfg) throw new Error(`MAPS config missing for mapKey=${startMapKey}`);

    const { map, collisionGroup, collisionTileLayers } = this.createMap(startMapKey);

    // 스폰 찾기
    const spawnName = data.spawnName ?? cfg.spawnName;
    let spawnPoint: any | undefined;
    for (const group of cfg.objectGroups) {
      spawnPoint = map.findObject(group, (o) => o.name === spawnName);
      if (spawnPoint) break;
    }
    if (!spawnPoint) throw new Error(`Spawn object "${spawnName}" not found`);

    this.player = new Player(this, spawnPoint.x!, spawnPoint.y!);

    // 충돌 연결
    for (const tl of collisionTileLayers) {
      this.physics.add.collider(this.player, tl);
    }

    this.createInteractables(map, collisionGroup, cfg);
    this.player.setUpSensingNpcs(this.npcs);
    this.player.setUpSensingEvidence(this.evidences);
    // this.player.setUpEvents(map);

    this.setupPubSub();
    this.renderDebug();

    // ===============================
    // 여기서부터 Quest 관련 추가 (Quest1~3)

    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    const createQuestZone = (
      x: number,
      y: number,
      label: string,
      questId: number
    ) => {
      const zone = this.add.zone(x, y, 200, 160).setOrigin(0.5);
      this.physics.add.existing(zone, true);

      const text = this.add
        .text(
          x,
          y - 80,
          label,
          {
            fontSize: "13px",
            color: "#ffffff",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: { left: 10, right: 10, top: 6, bottom: 6 },
            align: "center",
          }
        )
        .setOrigin(0.5)
        .setDepth(2000)
        .setScrollFactor(1)
        .setVisible(true);

      // 디버그 박스
      /*this.add.graphics()
        .lineStyle(2, 0xff0000)
        .strokeRectShape(zone.getBounds());*/

      // 살짝 깜빡이는 효과 (선택사항)
      this.tweens.add({
        targets: text,
        alpha: { from: 1, to: 0.6 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
      });

      return { zone, text, questId };
    };
    this.quest1 = createQuestZone(
      650,
      708,
      "🚇 이곳은 퀘스트 1 구역입니다.\n[SPACE]를 눌러 퀘스트를 시작하세요.",
      1
    );
    this.quest2 = createQuestZone(
      -212,
      -82,
      "🏠 이곳은 퀘스트 2 구역입니다.\n[SPACE]를 눌러 퀘스트를 시작하세요.",
      2
    );
    this.quest3 = createQuestZone(
       150,
      -82,
      "🏢 이곳은 퀘스트 3 구역입니다.\n[SPACE]를 눌러 퀘스트를 시작하세요.",
      3
    );
    this.activeQuestZone = null;
    this.questStarted = false;

    [this.quest1, this.quest2, this.quest3].forEach(({ zone, questId }) => {
      this.physics.add.overlap(this.player, zone, () => {
        if (!this.questStarted) this.activeQuestZone = questId;
      });
    });



    
  }


  private createMap(mapKey: string): {
    map: Phaser.Tilemaps.Tilemap;
    collisionGroup: Phaser.Physics.Arcade.StaticGroup;
    collisionTileLayers: Phaser.Tilemaps.TilemapLayer[];
  } {
    const map = this.make.tilemap({ key: mapKey });
    const cfg = MAPS[mapKey];
    if (!cfg) throw new Error(`MAPS config missing for mapKey=${mapKey}`);

    // 타일셋 설치
    const tilesetDefs: TilesetDef[] = cfg.tilesets ?? (Object.values(key.tileset) as any);
    const tilesets: Phaser.Tilemaps.Tileset[] = [];
    for (const ts of map.tilesets) {
      const name = ts.name; // Tiled 타일셋 이름 (예: "subway", "Terrains_and_Fences")
      // 프리로드에서 this.load.image(name, ...)로 같은 키로 올라가 있다고 가정
      const tset = map.addTilesetImage(
        name,
        name,
        ts.tileWidth,
        ts.tileHeight,
        (ts as any).margin ?? 0,
        (ts as any).spacing ?? 0
      );
      if (!tset) {
        console.error(`addTilesetImage failed for tileset "${name}"`);
      } else {
        tilesets.push(tset);
      }
    }

    // 모든 타일 레이어를 Tiled 순서대로 생성
    const createdTileLayers: Record<string, Phaser.Tilemaps.TilemapLayer> = {};
    for (const layer of map.layers) {
      // Phaser 타입 정의상 LayerData에 type 필드가 없으므로 체크 없이 생성
      if (layer.tilemapLayer) continue; // 이미 만들어졌으면 skip
      createdTileLayers[layer.name] = map.createLayer(layer.name, tilesets)!;
    }

    const layersArr = Object.values(createdTileLayers);
    if (layersArr.length > 0) {
      const minX = Math.min(...layersArr.map(l => l.x));
      const minY = Math.min(...layersArr.map(l => l.y));
      const maxX = Math.max(...layersArr.map(l => l.x + l.width));
      const maxY = Math.max(...layersArr.map(l => l.y + l.height));

      const worldW = maxX - minX;
      const worldH = maxY - minY;

      // Arcade Physics와 카메라 모두 음수 시작 좌표 허용
      this.physics.world.setBounds(minX, minY, worldW, worldH);
      this.cameras.main.setBounds(minX, minY, worldW, worldH);
    } else {
      // 레이어가 하나도 없을 경우의 폴백
      const w = map.widthInPixels || 4096;
      const h = map.heightInPixels || 4096;
      this.physics.world.setBounds(0, 0, w, h);
      this.cameras.main.setBounds(0, 0, w, h);
    }

    // 타일 충돌 레이어 결정
    const collisionTileLayers: Phaser.Tilemaps.TilemapLayer[] = [];
    const collidesProp = cfg.tileCollision.collidesProp ?? "collides";
    const layerFlagProp = cfg.tileCollision.layerFlagProp;

    if (cfg.tileCollision.layerNames && cfg.tileCollision.layerNames.length > 0) {
      for (const ln of cfg.tileCollision.layerNames) {
        const tl = createdTileLayers[ln] ?? map.getLayer(ln)?.tilemapLayer;
        if (tl) {
          tl.setCollisionByProperty({ [collidesProp]: true });
          collisionTileLayers.push(tl);
        }
      }
    } else {
      // 전체 타일 레이어 스캔
      // 전체 타일 레이어 스캔 (tl.layer 접근하지 않음)
      for (const [name, tl] of Object.entries(createdTileLayers)) {
        if (!tl) continue;

        let useThis = false;

        // 레이어 속성은 Tilemap에서 안전하게 얻기
        const layerData = map.getLayer(name); // LayerData | null
        const layerProps: Record<string, any> =
          (layerData && (layerData.properties as any)) || {};

        if (layerFlagProp && layerProps[layerFlagProp]) {
          useThis = true;
        }

        // 타일 속성 충돌 설정
        tl.setCollisionByProperty({ [collidesProp]: true });

        // 실제 충돌 타일 존재 여부 확인
        let hasColliders = false;
        tl.forEachTile((tile) => {
          if (!tile) return;
          // tile.collides는 setCollisionBy* 이후 설정됨. properties도 함께 확인.
          if (tile.collides || (tile.properties as any)?.[collidesProp]) {
            hasColliders = true;
            // forEachTile은 조기 종료가 없으므로 플래그만 세움
          }
        });

        if (hasColliders || useThis) {
          collisionTileLayers.push(tl);
        } else {
          // 충돌 대상 아니면 원복
          tl.setCollisionByProperty({ [collidesProp]: false });
        }
      }
    }

    // 오브젝트 레이어 충돌(박스) — 여러 개 가능
    const collisionGroup = this.physics.add.staticGroup();
    const objectCollisionLayers = cfg.objectCollisionLayers ?? [];
    for (const layerName of objectCollisionLayers) {
      const objs = map.getObjectLayer(layerName)?.objects ?? [];
      objs.forEach((obj) => {
        collisionGroup
          .create(
            obj.x! + (obj.width || 0) / 2,
            obj.y! + (obj.height || 0) / 2,
            undefined,
          )
          .setSize(obj.width || 0, obj.height || 0)
          .setVisible(false)
          .setActive(true)
          .setImmovable(true);
      });
    }

    // // 월드/카메라 바운드
    // this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    return { map, collisionGroup, collisionTileLayers };
  }

  private createInteractables(
    map: Phaser.Tilemaps.Tilemap,
    collisionGroup: Phaser.Physics.Arcade.StaticGroup,
    cfg: MapConfig,
  ) {
    // NPC / 증거물 (필요 시 복구)
    for (const [characterName, characterDef] of Object.entries(characters)) {
      if (characterName === "main_girl") continue;
      if (getGameState().goneNpcs.has(characterName)) continue;

      // objectGroups를 돌며 이름으로 위치 찾기
      let characterSpawnPoint: any | undefined;
      for (const group of cfg.objectGroups) {
        characterSpawnPoint = map.findObject(group, (o) => o.name === characterName);
        if (characterSpawnPoint) break;
      }
      if (!characterSpawnPoint) continue;

      // 필요 시 생성 로직 복구
      // const npc = new Npc(characterDef, this, characterSpawnPoint.x!, characterSpawnPoint.y!);
      // if (getGameState().nonInteractableNpcs.has(characterName)) npc.canInteract = false;
      // this.npcs.push(npc);
      // collisionGroup.add(npc);
      // this.physics.add.collider(this.player, npc);
    }

    // 오브젝트 충돌 방식이면 플레이어 ↔ 충돌 그룹 연결
    if ((cfg.objectCollisionLayers?.length ?? 0) > 0) {
      this.physics.add.collider(this.player, collisionGroup);
    }

    // ===== 포털 여러 개 자동 스캔 =====
    const portals: Array<{ obj: any; props: any[] }> = [];
    for (const group of cfg.objectGroups) {
      const layer = map.getObjectLayer(group);
      if (!layer) continue;

      for (const obj of layer.objects) {
        const name = obj.name ?? "";
        const props: any[] = (obj as any).properties ?? [];

        const byList   = cfg.portalNameList?.includes(name);
        const byPrefix = cfg.portalNamePrefix && name.startsWith(cfg.portalNamePrefix);
        const byFlag   = cfg.portalFlagProperty && !!props.find((p: any) => p.name === cfg.portalFlagProperty && p.value);

        if (byList || byPrefix || byFlag) {
          portals.push({ obj, props });
        }
      }
    }

    for (const { obj, props } of portals) {
      const targetMapKey: string =
        (props.find((p: any) => p.name === "targetMapKey")?.value as string) ??
        key.tilemap.town; // 기본값은 존재하는 키
      const nextSpawnName: string =
        (props.find((p: any) => p.name === "spawnName")?.value as string) ??
        MAPS[targetMapKey]?.spawnName ??
        "main_character";

      const isPoint = (obj as any).point === true || (!obj.width && !obj.height);
      let zone: Phaser.GameObjects.Zone;

      if (isPoint) {
        const SIZE = 64;
        zone = this.add.zone(obj.x!, obj.y!, SIZE, SIZE).setOrigin(0.5);
      } else {
        zone = this.add
          .zone(
            obj.x! + (obj.width! / 2),
            obj.y! + (obj.height! / 2),
            obj.width!,
            obj.height!,
          )
          .setOrigin(0.5);
      }

      this.physics.add.existing(zone, true);
      this.physics.add.overlap(this.player, zone, () => {
        this.handlePortal(targetMapKey, nextSpawnName);
      });
    }
  }

  private handlePortal(targetMapKey: string, spawnName: string) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.input.keyboard?.resetKeys();

    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.restart({ mapKey: targetMapKey, spawnName });
      },
    );
  }

  private setupPubSub() {
    PubSub.subscribe(Topics.giveKeysToDom, () => {
      if (this.input.keyboard && this.input.keyboard.enabled) {
        try {
          if ((this.input.keyboard as any)._capture) {
            this.input.keyboard.disableGlobalCapture();
          }
        } catch (err) {
          console.warn("[Phaser] disableGlobalCapture skipped:", err);
        }
        this.input.keyboard.enabled = false;
      }
    });

    PubSub.subscribe(Topics.giveKeysToGame, () => {
      if (this.input.keyboard && !this.input.keyboard.enabled) {
        this.input.keyboard.enabled = true;
        try {
          if ((this.input.keyboard as any)._capture) {
            this.input.keyboard.enableGlobalCapture();
          }
        } catch (error) {
          console.warn("[Phaser] enableGlobalCapture skipped:", error);
        }
      }
  });
}

  private renderDebug() {
    if (isProduction) return;
    this.physics.world.debugGraphic.visible = false;
    this.input.keyboard!.on("keydown-G", () => {
      this.physics.world.debugGraphic.visible =
        !this.physics.world.debugGraphic.visible;
    });
  }

  update() {
    this.player.update();

    if (this.activeQuestZone && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.questStarted = true;
      const questId = this.activeQuestZone;
      console.log(`Quest ${questId} 시작`);
      PubSub.publish(Topics[`startQuest${questId}` as keyof typeof Topics]);
    }

    if (this.activeQuestZone) {
      const activeQuest = [this.quest1, this.quest2, this.quest3].find(
        (q) => q.questId === this.activeQuestZone
      );
      if (
        activeQuest &&
        !Phaser.Geom.Intersects.RectangleToRectangle(
          this.player.getBounds(),
          activeQuest.zone.getBounds()
        )
      ) {
        this.activeQuestZone = null;
      }
    }
  }


}
