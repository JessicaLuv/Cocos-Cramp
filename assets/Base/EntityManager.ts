import { _decorator, Component, Sprite, UITransform } from 'cc'
import { PlayerStateMachine } from '../Scripts/Player/PlayerStateMachine'
import { DIRECTION_ENUM, DIRECTION_ORDER_ENUM, ENTITY_STATE_ENUM, ENTITY_TYPE_ENUM, PARAMS_NAME_ENUM } from '../Enums'
import { TILE_HEIGHT, TILE_WIDTH } from '../Scripts/Tile/TileManager'
import { IEntity } from '../Levels'
import { StateMachine } from './StateMachine'
import { randomByLen } from '../Utils'
const { ccclass } = _decorator

@ccclass('EntityManager')
export class EntityManager extends Component {
  id: string = randomByLen(12)
  x: number = 0
  y: number = 0
  fsm: StateMachine
  type: ENTITY_TYPE_ENUM
  //私有字段实现数据与UI分离
  private _direction: DIRECTION_ENUM //方向
  private _state: ENTITY_STATE_ENUM //状态

  get direction() {
    return this._direction
  }

  set direction(newDirection: DIRECTION_ENUM) {
    this._direction = newDirection
    this.fsm.setParams(PARAMS_NAME_ENUM.DIRECTION, DIRECTION_ORDER_ENUM[this._direction])
  }

  get state() {
    return this._state
  }

  set state(newState: ENTITY_STATE_ENUM) {
    this._state = newState
    //改变状态触发状态机执行
    this.fsm.setParams(this._state, true)
  }

  async init(params: IEntity) {
    const sprite = this.addComponent(Sprite)
    //CUSTOM可以自定义更改元素的大小
    sprite.sizeMode = Sprite.SizeMode.CUSTOM
    //人物大小是瓦片的四倍
    const transform = this.getComponent(UITransform)
    transform.setContentSize(TILE_WIDTH * 4, TILE_HEIGHT * 4)

    this.x = params.x
    this.y = params.y
    this.type = params.type
    //设置人物开始动画为空闲（退出初始化方法后再执行状态变换）
    this.direction = params.direction
    this.state = params.state
  }

  update() {
    //将虚拟坐标转换成瓦片坐标
    this.node.setPosition(this.x * TILE_WIDTH - 1.5 * TILE_WIDTH, -this.y * TILE_HEIGHT + 1.5 * TILE_HEIGHT)
  }

  onDestroy(): void {}
}
