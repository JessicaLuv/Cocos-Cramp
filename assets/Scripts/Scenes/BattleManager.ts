import { _decorator, Component, director, Node } from 'cc'
import { TileMapManager } from '../Tile/TileMapManager'
import { createUINode } from '../../Utils'
import levels, { ILevel } from '../../Levels'
import DataManager, { IRecord } from '../../Runtime/DataManager'
import { TILE_HEIGHT, TILE_WIDTH } from '../Tile/TileManager'
import EventManager from '../../Runtime/EventManager'
import { DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM } from '../../Enums'
import { PlayerManager } from '../Player/PlayerManager'
import { WoodenSkeletonManager } from '../WoodenSkeleton/WoodenSkeletonManager'
import { DoorManager } from '../Door/DoorManager'
import { IronSkeletonManager } from '../IronSkeleton/IronSkeletonManager'
import { BurstManager } from '../Burst/BurstManager'
import { SpikesManager } from '../Spikes/SpikesManager'
import { SmokeManager } from '../Smoke/SmokeManager'
import FaderManager from '../../Runtime/FaderManager'
import { ShakeManager } from '../UI/ShakeManager'
const { ccclass } = _decorator

@ccclass('BattleManager')
export class BattleManager extends Component {
  level: ILevel
  stage: Node
  private smokeLayer: Node
  private inited = false

  onLoad() {
    DataManager.Instance.levelIndex = 1
    EventManager.Instance.on(EVENT_ENUM.NEXT_LEVEL, this.nextLevel, this)
    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.checkArrived, this)
    EventManager.Instance.on(EVENT_ENUM.SHOW_SMOKE, this.generateSmoke, this)
    EventManager.Instance.on(EVENT_ENUM.RECOED_STEP, this.record, this)
    EventManager.Instance.on(EVENT_ENUM.REVOKE_STEP, this.revoke, this)
  }

  onDestroy() {
    EventManager.Instance.off(EVENT_ENUM.NEXT_LEVEL, this.nextLevel)
    EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.checkArrived)
    EventManager.Instance.off(EVENT_ENUM.SHOW_SMOKE, this.generateSmoke)
    EventManager.Instance.off(EVENT_ENUM.RECOED_STEP, this.record)
    EventManager.Instance.off(EVENT_ENUM.REVOKE_STEP, this.revoke)
  }

  start() {
    this.generateStage()
    this.initLevel()
  }

  async initLevel() {
    const level = levels[`level${DataManager.Instance.levelIndex}`]
    if (level) {
      await FaderManager.Instance.fadeIn()

      this.clearLevel()

      this.level = level

      DataManager.Instance.mapInfo = this.level.mapInfo
      DataManager.Instance.mapRowCount = this.level.mapInfo.length || 0
      DataManager.Instance.mapColumnCount = this.level.mapInfo[0].length || 0

      await Promise.all([
        this.generateTileMap(),
        this.generateDoor(),
        this.generateBurst(),
        this.generateSpikes(),
        this.generateSmokeLayer(),
        this.generateEnemies(),
        this.generatePlayer(),
      ])

      await FaderManager.Instance.fadeOut()
    }
  }

  nextLevel() {
    DataManager.Instance.levelIndex++
    this.initLevel()
  }

  clearLevel() {
    this.stage.destroyAllChildren()
    DataManager.Instance.reset()
  }

  generateStage() {
    this.stage = createUINode()
    this.stage.setParent(this.node)
    this.stage.addComponent(ShakeManager)
  }

  async generateTileMap() {
    const tileMap = createUINode()
    await tileMap.setParent(this.stage)
    const tileMapMAnager = tileMap.addComponent(TileMapManager)
    tileMapMAnager.init()
    //适配屏幕
    this.adaptPos()
  }

  async generateSmokeLayer() {
    this.smokeLayer = createUINode()
    this.smokeLayer.setParent(this.stage)
  }

  async generatePlayer() {
    const player = createUINode()
    player.setParent(this.stage)
    const playerManager = player.addComponent(PlayerManager)
    await playerManager.init(this.level.player)
    DataManager.Instance.player = playerManager
    EventManager.Instance.emit(EVENT_ENUM.PLAYER_BORN, true)
  }

  async generateEnemies() {
    const promise = []
    for (let i = 0; i < this.level.enemies.length; i++) {
      const enemy = this.level.enemies[i]
      const node = createUINode()
      node.setParent(this.stage)
      const Manager = enemy.type === ENTITY_TYPE_ENUM.SKELETON_WOODEN ? WoodenSkeletonManager : IronSkeletonManager
      const manager = node.addComponent(Manager)
      promise.push(manager.init(enemy))
      DataManager.Instance.enemies.push(manager)
    }
    await Promise.all(promise)
  }

  async generateDoor() {
    const door = createUINode()
    door.setParent(this.stage)
    const doorManager = door.addComponent(DoorManager)
    await doorManager.init(this.level.door)
    DataManager.Instance.door = doorManager
  }

  async generateBurst() {
    const promise = []
    for (let i = 0; i < this.level.bursts.length; i++) {
      const burst = this.level.bursts[i]
      const node = createUINode()
      node.setParent(this.stage)
      const burstManager = node.addComponent(BurstManager)
      promise.push(burstManager.init(burst))
      DataManager.Instance.brusts.push(burstManager)
    }
    await Promise.all(promise)
  }

  async generateSpikes() {
    const promise = []
    for (let i = 0; i < this.level.spikes.length; i++) {
      const spike = this.level.spikes[i]
      const node = createUINode()
      node.setParent(this.stage)
      const spikeManager = node.addComponent(SpikesManager)
      promise.push(spikeManager.init(spike))
      DataManager.Instance.spikes.push(spikeManager)
    }
    await Promise.all(promise)
  }

  async generateSmoke(x: number, y: number, direction: DIRECTION_ENUM) {
    const smoke = createUINode()
    smoke.setParent(this.stage)
    const smokeManager = smoke.addComponent(SmokeManager)
    await smokeManager.init({
      x,
      y,
      direction,
      state: ENTITY_STATE_ENUM.IDLE,
      type: ENTITY_TYPE_ENUM.SMOKE,
    })
    DataManager.Instance.smokes.push(smokeManager)
  }

  //到达门口，跳到下一关
  checkArrived() {
    const { x: playerX, y: playerY } = DataManager.Instance.player
    const { x: doorX, y: doorY, state: doorState } = DataManager.Instance.door
    if (playerX === doorX && playerY === doorY && doorState === ENTITY_STATE_ENUM.DEATH) {
      EventManager.Instance.emit(EVENT_ENUM.NEXT_LEVEL)
    }
  }

  adaptPos() {
    const { mapRowCount, mapColumnCount } = DataManager.Instance
    const disX = (TILE_WIDTH * mapRowCount) / 2
    const disY = (TILE_HEIGHT * mapColumnCount) / 2 + 120
    this.stage.getComponent(ShakeManager).stop()
    this.stage.setPosition(-disX, disY)
  }

  /**数据的存储 */
  record() {
    const item: IRecord = {
      player: {
        x: DataManager.Instance.player.x,
        y: DataManager.Instance.player.y,
        direction: DataManager.Instance.player.direction,
        state:
          DataManager.Instance.player.state === ENTITY_STATE_ENUM.IDLE ||
          DataManager.Instance.player.state === ENTITY_STATE_ENUM.DEATH ||
          DataManager.Instance.player.state === ENTITY_STATE_ENUM.AIRDEATH
            ? DataManager.Instance.player.state
            : ENTITY_STATE_ENUM.IDLE,
        type: DataManager.Instance.player.type,
      },
      door: {
        x: DataManager.Instance.door.x,
        y: DataManager.Instance.door.y,
        direction: DataManager.Instance.player.direction,
        state: DataManager.Instance.player.state,
        type: DataManager.Instance.player.type,
      },
      enemies: DataManager.Instance.enemies.map(({ x, y, direction, state, type }) => ({
        x,
        y,
        direction,
        state,
        type,
      })),
      bursts: DataManager.Instance.brusts.map(({ x, y, direction, state, type }) => ({
        x,
        y,
        direction,
        state,
        type,
      })),
      spikes: DataManager.Instance.spikes.map(({ x, y, count, type }) => ({
        x,
        y,
        count,
        type,
      })),
    }
    DataManager.Instance.records.push(item)
  }

  /**数据的撤回 */
  revoke() {
    const item = DataManager.Instance.records.pop()
    if (item) {
      DataManager.Instance.player.x = DataManager.Instance.player.targetX = item.player.x
      DataManager.Instance.player.y = DataManager.Instance.player.targetY = item.player.y
      DataManager.Instance.player.direction = DataManager.Instance.player.direction = item.player.direction
      DataManager.Instance.player.state = DataManager.Instance.player.state = item.player.state

      DataManager.Instance.door.x = item.door.x
      DataManager.Instance.door.y = item.door.y
      DataManager.Instance.door.direction = item.door.direction
      DataManager.Instance.door.state = item.door.state

      for (let i = 0; i < DataManager.Instance.enemies.length; i++) {
        const enemy = item.enemies[i]
        DataManager.Instance.enemies[i].x = enemy.x
        DataManager.Instance.enemies[i].y = enemy.y
        DataManager.Instance.enemies[i].direction = enemy.direction
        DataManager.Instance.enemies[i].state = enemy.state
      }

      for (let i = 0; i < DataManager.Instance.brusts.length; i++) {
        const brust = item.bursts[i]
        DataManager.Instance.brusts[i].x = brust.x
        DataManager.Instance.brusts[i].y = brust.y
        DataManager.Instance.brusts[i].state = brust.state
      }

      for (let i = 0; i < DataManager.Instance.spikes.length; i++) {
        const spike = item.spikes[i]
        DataManager.Instance.spikes[i].x = spike.x
        DataManager.Instance.spikes[i].y = spike.y
        DataManager.Instance.spikes[i].count = spike.count
        DataManager.Instance.spikes[i].type = spike.type
      }
    }
  }
}
