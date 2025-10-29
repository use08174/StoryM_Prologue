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

    for (const [character, value] of Object.entries(characters)) {
      if (character !== "main_girl") {
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
    this.scene.start(key.scene.main);
  }
}
