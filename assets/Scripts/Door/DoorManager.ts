import EventManager from '../../Runtime/EventManager'
import { _decorator } from 'cc'
import { DIRECTION_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, EVENT_ENUM } from '../../Enums'
import { TILE_HEIGHT, TILE_WIDTH } from '../Tile/TileManager'
import { EntityManager } from '../../Base/EntityManager'
import DataManager from '../../Runtime/DataManager'
import { PlayerStateMachine } from '../Player/PlayerStateMachine'
import { DoorStateMachine } from './DoorStateMachine'
import { IEntity } from '../../Levels'
const { ccclass } = _decorator

@ccclass('DoorManager')
export class DoorManager extends EntityManager {
  async init(params: IEntity) {
    this.fsm = this.addComponent(DoorStateMachine)
    await this.fsm.init()
    super.init(params)

    EventManager.Instance.on(EVENT_ENUM.DOOR_OPEN, this.onOpen, this)
  }

  onDestroy() {
    super.onDestroy()
    EventManager.Instance.off(EVENT_ENUM.DOOR_OPEN, this.onOpen)
  }

  onOpen() {
    if (
      //如果所有的敌人都死光了且门没开，则门开
      DataManager.Instance.enemies.every(enemy => enemy.state === ENTITY_STATE_ENUM.DEATH) &&
      this.state !== ENTITY_STATE_ENUM.DEATH
    ) {
      this.state = ENTITY_STATE_ENUM.DEATH
    }
  }
}
