import { _decorator, Component, Sprite, UITransform } from 'cc'
import { randomByLen } from '../../Utils'
import { StateMachine } from '../../Base/StateMachine'
import {
  ENTITY_STATE_ENUM,
  ENTITY_TYPE_ENUM,
  EVENT_ENUM,
  PARAMS_NAME_ENUM,
  SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM,
} from '../../Enums'
import { IEntity, ISpikes } from '../../Levels'
import { TILE_WIDTH, TILE_HEIGHT } from '../Tile/TileManager'
import { SpikesStateMachine } from './SpikesStateMachine'
import EventManager from '../../Runtime/EventManager'
import DataManager from '../../Runtime/DataManager'

const { ccclass } = _decorator

@ccclass('SpikesManager')
export class SpikesManager extends Component {
  id: string = randomByLen(12)
  x: number = 0
  y: number = 0
  fsm: StateMachine
  type: ENTITY_TYPE_ENUM
  //私有字段实现数据与UI分离
  private _count: number //当前的点数
  private _totalCount: number //总点数

  get count() {
    return this._count
  }

  set count(newCount: number) {
    this._count = newCount
    this.fsm.setParams(PARAMS_NAME_ENUM.SPIKES_CUR_COUNT, newCount)
  }

  get totalcount() {
    return this._totalCount
  }

  set totalcount(newCount: number) {
    this._totalCount = newCount
    //改变状态触发状态机执行
    this.fsm.setParams(PARAMS_NAME_ENUM.SPIKES_TOTAL_COUNT, newCount)
  }

  async init(params: ISpikes) {
    const sprite = this.addComponent(Sprite)
    //CUSTOM可以自定义更改元素的大小
    sprite.sizeMode = Sprite.SizeMode.CUSTOM
    //人物大小是瓦片的四倍
    const transform = this.getComponent(UITransform)
    transform.setContentSize(TILE_WIDTH * 4, TILE_HEIGHT * 4)

    this.fsm = this.addComponent(SpikesStateMachine)
    await this.fsm.init()

    this.x = params.x
    this.y = params.y
    this.type = params.type
    this.totalcount = SPIKES_TYPE_MAP_TOTAL_COUNT_ENUM[this.type]
    this.count = params.count

    //监听玩家的移动事件
    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onLoop, this)
  }

  onDestroy(): void {
    EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.onLoop)
  }

  update() {
    //将虚拟坐标转换成瓦片坐标
    this.node.setPosition(this.x * TILE_WIDTH - 1.5 * TILE_WIDTH, -this.y * TILE_HEIGHT + 1.5 * TILE_HEIGHT)
  }

  onLoop() {
    //当前点数等于总点数的时候，回到一点
    if (this.count === this.totalcount) {
      this.count = 1
    } else {
      this.count++
    }

    this.onAttack()
  }

  backZero() {
    this.count = 0
  }

  onAttack() {
    //如果人物不存在，就返回
    if (!DataManager.Instance.player) {
      return
    }
    const { x: playerX, y: playerY } = DataManager.Instance.player
    if (this.x === playerX && this.y === playerY && this.count === this.totalcount) {
      EventManager.Instance.emit(EVENT_ENUM.ATTACK_PLAYER, ENTITY_STATE_ENUM.DEATH)
    }
  }
}
