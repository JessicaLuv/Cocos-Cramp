import { EnemyManager } from '../Base/EnemyManager'
import Singleton from '../Base/Singleton'
import { ILevel, ITILE } from '../Levels'
import { BurstManager } from '../Scripts/Burst/BurstManager'
import { DoorManager } from '../Scripts/Door/DoorManager'
import { PlayerManager } from '../Scripts/Player/PlayerManager'
import { SmokeManager } from '../Scripts/Smoke/SmokeManager'
import { SpikesManager } from '../Scripts/Spikes/SpikesManager'
import { TileManager } from '../Scripts/Tile/TileManager'

export type IRecord = Omit<ILevel, 'mapInfo'>

export default class DataManager extends Singleton {
  static get Instance() {
    return super.GetInstance<DataManager>()
  }

  mapInfo: Array<Array<ITILE>>
  tileInfo: Array<Array<TileManager>>
  mapRowCount: number = 0
  mapColumnCount: number = 0
  levelIndex: number = 1
  player: PlayerManager
  door: DoorManager
  smokes: SmokeManager[]
  enemies: EnemyManager[]
  brusts: BurstManager[]
  spikes: SpikesManager[]
  records: IRecord[]

  reset() {
    this.mapInfo = []
    this.tileInfo = []
    this.enemies = []
    this.brusts = []
    this.spikes = []
    this.smokes = []
    this.records = []
    this.player = null
    this.door = null
    this.mapRowCount = 0
    this.mapColumnCount = 0
  }
}
