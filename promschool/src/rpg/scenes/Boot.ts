import { key } from "../data";
import characters from "rpg/data/characters";
import evidence from "rpg/data/evidence";

export default class Boot extends Phaser.Scene {
  constructor() {
    super(key.scene.boot);
  }

  preload() {
    this.load.spritesheet(
      characters.main_girl.sprite,
      "assets/sprites/main_girl.png",
      {
        frameWidth: 64,
        frameHeight: 64,
        startFrame: 72,
        endFrame: 107,
      },
    );
    this.load.spritesheet(
      characters.main_boy.sprite,
      "assets/sprites/main_boy_walk.png",
      {
        frameWidth: 64,
        frameHeight: 64,
        startFrame: 72,
        endFrame: 107,
      },
    );

    for (const [character, value] of Object.entries(characters)) {
      if (character !== "main_girl" && character !== "main_boy") {
        this.load.spritesheet(
          value.sprite,
          `assets/sprites/${value.sprite}.png`,
          {
            frameWidth: 64,
            frameHeight: 64,
          },
        );
      }
    }

    for (const [, value] of Object.entries(evidence)) {
      this.load.image(value.sprite, `assets/sprites/${value.sprite}.png`);
    }

    for (const [, value] of Object.entries(key.tileset)) {
      this.load.image(value.image, `assets/tilesets/${value.image}.png`);
    }

    this.load.tilemapTiledJSON(
      key.tilemap.town,
      "assets/tilemaps/prologue_map.json",
    );
    this.load.tilemapTiledJSON(
      key.tilemap.subway,
      "assets/tilemaps/subway.json",
    );
  }

  create() {
    const id = window.localStorage.getItem("characterId");

    // 캐릭터 id가 없으면 일단 기본 female로 시작
    if (!id) {
      console.warn("characterId 없음, 기본 female로 시작");
      this.scene.start(key.scene.main, { gender: "female" });
      return;
    }

    // ✅ DB에서 캐릭터 다시 조회
    fetch(`/character/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("캐릭터 조회 실패");
        return res.json();
      })
      .then((data) => {
        // 백엔드에서 gender를 "male" | "female" 으로 내려준다고 가정
        const gender =
          data.gender === "male" || data.gender === "female"
            ? data.gender
            : "female";

        this.scene.start(key.scene.main, {
          gender,
          characterId: id,
        });
      })
      .catch((err) => {
        console.error("캐릭터 불러오기 오류:", err);
        // 문제 생기면 기본 female로라도 시작
        this.scene.start(key.scene.main, { gender: "female" });
      });
  }
}