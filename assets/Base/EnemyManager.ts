import { _decorator } from 'cc'
import { IEntity } from '../Levels'
import { EntityManager } from './EntityManager'
import { WoodenSkeletonStateMachine } from '../Scripts/WoodenSkeleton/WoodenSkeletonStateMachine'
import EventManager from '../Runtime/EventManager'
import { DIRECTION_ENUM, ENTITY_STATE_ENUM, EVENT_ENUM } from '../Enums'
import DataManager from '../Runtime/DataManager'
const { ccclass } = _decorator

@ccclass('EnemyManager')
export class EnemyManager extends EntityManager {
  async init(params: IEntity) {
    super.init(params)

    EventManager.Instance.on(EVENT_ENUM.PLAYER_BORN, this.onChangeDirection, this)
    EventManager.Instance.on(EVENT_ENUM.PLAYER_MOVE_END, this.onChangeDirection, this)
    EventManager.Instance.on(EVENT_ENUM.ATTACK_ENEMY, this.onDead, this)
    //保证无论玩家or敌人先生成，敌人生成时都面向玩家
    this.onChangeDirection(true)
  }

  onDestroy() {
    super.onDestroy()
    EventManager.Instance.off(EVENT_ENUM.PLAYER_BORN, this.onChangeDirection)
    EventManager.Instance.off(EVENT_ENUM.PLAYER_MOVE_END, this.onChangeDirection)
    EventManager.Instance.off(EVENT_ENUM.ATTACK_ENEMY, this.onDead)
  }

  onChangeDirection(isInit = false) {
    //如果已经死了或玩家不存在，不执行
    if (this.state === ENTITY_STATE_ENUM.DEATH || !DataManager.Instance.player) {
      return
    }
    //玩家的坐标
    const { x: playerX, y: playerY } = DataManager.Instance.player
    //距离的差值
    const disX = Math.abs(this.x - playerX)
    const disY = Math.abs(this.y - playerY)
    //玩家在敌人对角线上，不改变朝向(初始化不执行)
    if (disX === disY && !isInit) {
      return
    }
    //玩家在敌人的第一象限
    if (playerX >= this.x && playerY <= this.y) {
      //如果y方向差值大，则向上看；如果x方向差值大，则向右看
      this.direction = disY > disX ? DIRECTION_ENUM.TOP : DIRECTION_ENUM.RIGHT
    }
    //玩家在敌人的第二象限
    else if (playerX <= this.x && playerY <= this.y) {
      //如果y方向差值大，则向上看；如果x方向差值大，则向左看
      this.direction = disY > disX ? DIRECTION_ENUM.TOP : DIRECTION_ENUM.LEFT
    }
    //玩家在敌人的第三象限
    else if (playerX <= this.x && playerY >= this.y) {
      //如果y方向差值大，则向下看；如果x方向差值大，则向左看
      this.direction = disY > disX ? DIRECTION_ENUM.BOTTOM : DIRECTION_ENUM.LEFT
    }
    //玩家在敌人的第三象限
    else if (playerX >= this.x && playerY >= this.y) {
      //如果y方向差值大，则向下看；如果x方向差值大，则向右看
      this.direction = disY > disX ? DIRECTION_ENUM.BOTTOM : DIRECTION_ENUM.RIGHT
    }
  }

  onDead(id: string) {
    //如果已经死了，不执行
    if (this.state === ENTITY_STATE_ENUM.DEATH) {
      return
    }
    //攻击id对应的敌人，敌人死亡
    if (this.id === id) {
      this.state = ENTITY_STATE_ENUM.DEATH
    }
  }
}
