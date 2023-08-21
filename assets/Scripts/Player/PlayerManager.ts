import EventManager from '../../Runtime/EventManager'
import { _decorator } from 'cc'
import {
  CONTROLLER_ENUM,
  DIRECTION_ENUM,
  DIRECTION_ORDER_ENUM,
  ENTITY_STATE_ENUM,
  EVENT_ENUM,
  SHAKE_TYPE_ENUM,
} from '../../Enums'
import { PlayerStateMachine } from './PlayerStateMachine'
import { EntityManager } from '../../Base/EntityManager'
import DataManager from '../../Runtime/DataManager'
import { IEntity } from '../../Levels'
import { EnemyManager } from '../../Base/EnemyManager'
import { BurstManager } from '../Burst/BurstManager'
const { ccclass } = _decorator

@ccclass('PlayerManager')
export class PlayerManager extends EntityManager {
  targetX: number = 0
  targetY: number = 0
  isMoving = false
  private readonly speed = 1 / 10

  async init(params: IEntity) {
    this.fsm = this.addComponent(PlayerStateMachine)
    await this.fsm.init()
    super.init(params)
    this.targetX = this.x
    this.targetY = this.y

    //绑定人物移动的事件,按下按钮，触发move方法
    EventManager.Instance.on(EVENT_ENUM.PLAYER_CTRL, this.inputHandle, this)
    EventManager.Instance.on(EVENT_ENUM.ATTACK_PLAYER, this.onDead, this)
  }

  onDestroy(): void {
    super.onDestroy()
    EventManager.Instance.off(EVENT_ENUM.PLAYER_CTRL, this.inputHandle)
    EventManager.Instance.off(EVENT_ENUM.ATTACK_PLAYER, this.onDead)
  }

  update() {
    this.updateXY()
    super.update()
  }

  //使人物更靠近（趋向）目标
  updateXY() {
    if (this.targetX < this.x) {
      this.x -= this.speed
    } else if (this.targetX > this.x) {
      this.x += this.speed
    }

    if (this.targetY < this.y) {
      this.y -= this.speed
    } else if (this.targetY > this.y) {
      this.y += this.speed
    }

    //判断人物和目标已经足够接近，判断相等
    if (Math.abs(this.targetX - this.x) <= 0.1 && Math.abs(this.targetY - this.y) <= 0.1 && this.isMoving) {
      this.isMoving = false
      this.x = this.targetX
      this.y = this.targetY
      EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END)
    }
  }

  //玩家死亡
  onDead(type: ENTITY_STATE_ENUM) {
    this.state = type
  }

  onAttackShake(type: ENTITY_STATE_ENUM) {
    EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, type)
  }

  //处理地图数据
  inputHandle(inputDirection: CONTROLLER_ENUM) {
    //人物正在移动，不执行
    if (this.isMoving) {
      return
    }
    //人物如果死亡，不移动
    if (
      this.state === ENTITY_STATE_ENUM.DEATH ||
      this.state === ENTITY_STATE_ENUM.AIRDEATH ||
      this.state === ENTITY_STATE_ENUM.ATTACK
    ) {
      return
    }
    //是否会攻击别人
    const id = this.willAttack(inputDirection)
    if (id) {
      EventManager.Instance.emit(EVENT_ENUM.RECOED_STEP)
      this.state = ENTITY_STATE_ENUM.ATTACK
      //攻击敌人，敌人去死
      EventManager.Instance.emit(EVENT_ENUM.ATTACK_ENEMY, id)
      EventManager.Instance.emit(EVENT_ENUM.DOOR_OPEN)
      EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END)
      return
    }
    //是否会碰撞地图
    if (this.willBlock(inputDirection)) {
      if (inputDirection === CONTROLLER_ENUM.TOP) {
        EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.TOP)
      } else if (inputDirection === CONTROLLER_ENUM.BOTTOM) {
        EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.BOTTOM)
      } else if (inputDirection === CONTROLLER_ENUM.LEFT) {
        EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.LEFT)
      } else if (inputDirection === CONTROLLER_ENUM.RIGHT) {
        EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.RIGHT)
      } else if (inputDirection === CONTROLLER_ENUM.TURNLEFT) {
        if (this.direction === DIRECTION_ENUM.TOP) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.LEFT)
        } else if (this.direction === DIRECTION_ENUM.BOTTOM) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.RIGHT)
        } else if (this.direction === DIRECTION_ENUM.LEFT) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.BOTTOM)
        } else if (this.direction === DIRECTION_ENUM.RIGHT) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.TOP)
        }
      } else if (inputDirection === CONTROLLER_ENUM.TURNRIGHT) {
        if (this.direction === DIRECTION_ENUM.TOP) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.RIGHT)
        } else if (this.direction === DIRECTION_ENUM.BOTTOM) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.LEFT)
        } else if (this.direction === DIRECTION_ENUM.LEFT) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.TOP)
        } else if (this.direction === DIRECTION_ENUM.RIGHT) {
          EventManager.Instance.emit(EVENT_ENUM.SCREEN_SHAKE, SHAKE_TYPE_ENUM.BOTTOM)
        }
      }
      return
    }
    this.move(inputDirection)
  }

  //控制人物移动
  move(inputDirection: CONTROLLER_ENUM) {
    EventManager.Instance.emit(EVENT_ENUM.RECOED_STEP)
    if (inputDirection === CONTROLLER_ENUM.TOP) {
      this.targetY -= 1
      this.isMoving = true
      this.showSmoke(DIRECTION_ENUM.TOP)
    } else if (inputDirection === CONTROLLER_ENUM.BOTTOM) {
      this.targetY += 1
      this.isMoving = true
      this.showSmoke(DIRECTION_ENUM.BOTTOM)
    } else if (inputDirection === CONTROLLER_ENUM.LEFT) {
      this.targetX -= 1
      this.isMoving = true
      this.showSmoke(DIRECTION_ENUM.LEFT)
    } else if (inputDirection === CONTROLLER_ENUM.RIGHT) {
      this.targetX += 1
      this.isMoving = true
      this.showSmoke(DIRECTION_ENUM.RIGHT)
    } else if (inputDirection === CONTROLLER_ENUM.TURNLEFT) {
      //判断当前方向
      if (this.direction === DIRECTION_ENUM.TOP) {
        this.direction = DIRECTION_ENUM.LEFT
      } else if (this.direction === DIRECTION_ENUM.LEFT) {
        this.direction = DIRECTION_ENUM.BOTTOM
      } else if (this.direction === DIRECTION_ENUM.BOTTOM) {
        this.direction = DIRECTION_ENUM.RIGHT
      } else if (this.direction === DIRECTION_ENUM.RIGHT) {
        this.direction = DIRECTION_ENUM.TOP
      }
      //如果按下TURNLEFT按钮，先改变状态
      this.state = ENTITY_STATE_ENUM.TURNLEFT
      EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END)
    } else if (inputDirection === CONTROLLER_ENUM.TURNRIGHT) {
      //判断当前方向
      if (this.direction === DIRECTION_ENUM.TOP) {
        this.direction = DIRECTION_ENUM.RIGHT
      } else if (this.direction === DIRECTION_ENUM.LEFT) {
        this.direction = DIRECTION_ENUM.TOP
      } else if (this.direction === DIRECTION_ENUM.BOTTOM) {
        this.direction = DIRECTION_ENUM.LEFT
      } else if (this.direction === DIRECTION_ENUM.RIGHT) {
        this.direction = DIRECTION_ENUM.BOTTOM
      }
      //如果按下TURNLEFT按钮，先改变状态
      this.state = ENTITY_STATE_ENUM.TURNRIGHT
      EventManager.Instance.emit(EVENT_ENUM.PLAYER_MOVE_END)
    }
  }

  showSmoke(inputDirection: DIRECTION_ENUM) {
    EventManager.Instance.emit(EVENT_ENUM.SHOW_SMOKE, this.x, this.y, inputDirection)
  }

  //判断是否攻击
  willAttack(inputDirection: CONTROLLER_ENUM) {
    const enemies = DataManager.Instance.enemies.filter(enemy => enemy.state !== ENTITY_STATE_ENUM.DEATH)
    for (let i = 0; i < enemies.length; i++) {
      const { x: enemyX, y: enemyY, id: enemyId } = enemies[i]
      //输入的方向朝上且人朝上
      if (
        //敌人在玩家面前能攻击到的位置
        inputDirection === CONTROLLER_ENUM.TOP &&
        this.direction === DIRECTION_ENUM.TOP &&
        enemyX === this.x &&
        enemyY === this.targetY - 2
      ) {
        //攻击
        this.state = ENTITY_STATE_ENUM.ATTACK
        return enemyId
      }
      //输入的方向朝左且人朝左
      else if (
        //敌人在玩家面前能攻击到的位置
        inputDirection === CONTROLLER_ENUM.LEFT &&
        this.direction === DIRECTION_ENUM.LEFT &&
        enemyX === this.x - 2 &&
        enemyY === this.targetY
      ) {
        //攻击
        this.state = ENTITY_STATE_ENUM.ATTACK
        return enemyId
      }
      //输入的方向朝下且人朝下
      else if (
        //敌人在玩家面前能攻击到的位置
        inputDirection === CONTROLLER_ENUM.BOTTOM &&
        this.direction === DIRECTION_ENUM.BOTTOM &&
        enemyX === this.x &&
        enemyY === this.targetY + 2
      ) {
        //攻击
        this.state = ENTITY_STATE_ENUM.ATTACK
        return enemyId
      }
      //输入的方向朝右且人朝右
      else if (
        //敌人在玩家面前能攻击到的位置
        inputDirection === CONTROLLER_ENUM.RIGHT &&
        this.direction === DIRECTION_ENUM.RIGHT &&
        enemyX === this.x + 2 &&
        enemyY === this.targetY
      ) {
        //攻击
        this.state = ENTITY_STATE_ENUM.ATTACK
        return enemyId
      }
    }
    return ''
  }

  //判断是否会碰撞
  willBlock(inputDirection: CONTROLLER_ENUM) {
    const { targetX: x, targetY: y, direction } = this
    const { tileInfo } = DataManager.Instance
    const { mapRowCount: row, mapColumnCount: column } = DataManager.Instance
    const { x: doorX, y: doorY, state: doorState } = DataManager.Instance.door
    const enemies: EnemyManager[] = DataManager.Instance.enemies.filter(
      (enemy: EnemyManager) => enemy.state !== ENTITY_STATE_ENUM.DEATH,
    )
    const bursts: BurstManager[] = DataManager.Instance.brusts.filter(
      (burst: BurstManager) => burst.state !== ENTITY_STATE_ENUM.DEATH,
    )

    //按钮方向--向上
    if (inputDirection === CONTROLLER_ENUM.TOP) {
      const playerNextY = y - 1
      //玩家方向--向上
      if (direction === DIRECTION_ENUM.TOP) {
        //判断是否走出地图
        if (playerNextY < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }
        const weaponNextY = y - 2
        const playerTile = tileInfo[x]?.[playerNextY] //人物的下一个瓦片
        const weaponTile = tileInfo[x]?.[weaponNextY] //枪的下一个瓦片

        //判断有门
        if (
          ((x === doorX && playerNextY === doorY) || (x === doorX && weaponNextY === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if ((x === enemyX && playerNextY === enemyY) || (x === enemyX && weaponNextY === enemyY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKFRONT
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (x === burstX && playerNextY === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true //撞了
        }
      } //玩家方向--向下
      else if (direction === DIRECTION_ENUM.BOTTOM) {
        //判断是否走出地图
        if (playerNextY < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }
        const weaponNextY = y
        const playerTile = tileInfo[x]?.[playerNextY] //人物的下一个瓦片
        const weaponTile = tileInfo[x]?.[weaponNextY] //枪的下一个瓦片

        //判断有门
        if (
          ((x === doorX && playerNextY === doorY) || (x === doorX && weaponNextY === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if (x === enemyX && playerNextY === enemyY) {
            this.state = ENTITY_STATE_ENUM.BLOCKBACK
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (x === burstX && playerNextY === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true //撞了
        }
      } //玩家方向--向左
      else if (direction === DIRECTION_ENUM.LEFT) {
        //判断是否走出地图
        if (playerNextY < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }
        const weaponNextX = x - 1
        const weaponNextY = y - 1
        const playerTile = tileInfo[x]?.[playerNextY] //人物的下一个瓦片
        const weaponTile = tileInfo[weaponNextX]?.[weaponNextY] //枪的下一个瓦片

        //判断有门
        if (
          ((x === doorX && playerNextY === doorY) || (x === doorX && weaponNextY === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if ((x === enemyX && playerNextY === enemyY) || (weaponNextX === enemyX && weaponNextY === enemyY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (x === burstX && playerNextY === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true //撞了
        }
      } //玩家方向--向右
      else if (direction === DIRECTION_ENUM.RIGHT) {
        //判断是否走出地图
        if (playerNextY < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }
        const weaponNextX = x + 1
        const weaponNextY = y - 1
        const playerTile = tileInfo[x]?.[playerNextY] //人物的下一个瓦片
        const weaponTile = tileInfo[weaponNextX]?.[weaponNextY] //枪的下一个瓦片

        //判断有门
        if (
          ((x === doorX && playerNextY === doorY) || (x === doorX && weaponNextY === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if ((x === enemyX && playerNextY === enemyY) || (weaponNextX === enemyX && weaponNextY === enemyY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKLEFT
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (x === burstX && playerNextY === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true //撞了
        }
      }
    }
    //按钮方向--向下
    else if (inputDirection === CONTROLLER_ENUM.BOTTOM) {
      const playerNextY = y + 1
      //玩家方向--向上
      if (direction === DIRECTION_ENUM.TOP) {
        //判断是否走出地图
        if (playerNextY > column - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }
        const weaponNextY = y
        const playerTile = tileInfo[x]?.[playerNextY] //人物的下一个瓦片
        const weaponTile = tileInfo[x]?.[weaponNextY] //枪的下一个瓦片

        //判断有门
        if (
          ((x === doorX && playerNextY === doorY) || (x === doorX && weaponNextY === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if (x === enemyX && playerNextY === enemyY) {
            this.state = ENTITY_STATE_ENUM.BLOCKBACK
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (x === burstX && playerNextY === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true //撞了
        }
      } //玩家方向--向下
      else if (direction === DIRECTION_ENUM.BOTTOM) {
        //判断是否走出地图
        if (playerNextY > column - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }
        const weaponNextY = y + 2
        const playerTile = tileInfo[x]?.[playerNextY] //人物的下一个瓦片
        const weaponTile = tileInfo[x]?.[weaponNextY] //枪的下一个瓦片

        //判断有门
        if (
          ((x === doorX && playerNextY === doorY) || (x === doorX && weaponNextY === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if ((x === enemyX && playerNextY === enemyY) || (x === enemyX && weaponNextY === enemyY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKFRONT
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (x === burstX && playerNextY === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true //撞了
        }
      } //玩家方向--向左
      else if (direction === DIRECTION_ENUM.LEFT) {
        //判断是否走出地图
        if (playerNextY > column - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }
        const weaponNextX = x - 1
        const weaponNextY = y + 1
        const playerTile = tileInfo[x]?.[playerNextY] //人物的下一个瓦片
        const weaponTile = tileInfo[weaponNextX]?.[weaponNextY] //枪的下一个瓦片

        //判断有门
        if (
          ((x === doorX && playerNextY === doorY) || (weaponNextX === doorX && weaponNextY === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if ((x === enemyX && playerNextY === enemyY) || (weaponNextX === enemyX && weaponNextY === enemyY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKLEFT
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (x === burstX && playerNextY === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true //撞了
        }
      } //玩家方向--向右
      else if (direction === DIRECTION_ENUM.RIGHT) {
        //判断是否走出地图
        if (playerNextY > column - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }
        const weaponNextX = x + 1
        const weaponNextY = y + 1
        const playerTile = tileInfo[x]?.[playerNextY] //人物的下一个瓦片
        const weaponTile = tileInfo[weaponNextX]?.[weaponNextY] //枪的下一个瓦片

        //判断有门
        if (
          ((x === doorX && playerNextY === doorY) || (x === weaponNextX && weaponNextY === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if ((x === enemyX && playerNextY === enemyY) || (weaponNextX === enemyX && weaponNextY === enemyY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (x === burstX && playerNextY === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true //撞了
        }
      }
    }
    //按钮方向--向左
    else if (inputDirection === CONTROLLER_ENUM.LEFT) {
      const playerNextX = x - 1
      //玩家方向--向上
      if (direction === DIRECTION_ENUM.TOP) {
        //判断是否走出地图
        if (playerNextX < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }
        const weaponNextX = x - 1
        const weaponNextY = y - 1
        const playerTile = tileInfo[playerNextX]?.[y] //人物的下一个瓦片
        const weaponTile = tileInfo[weaponNextX]?.[weaponNextY] //枪的下一个瓦片

        //判断有门
        if (
          ((playerNextX === doorX && y === doorY) || (weaponNextX === doorX && weaponNextY === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if ((playerNextX === enemyX && y === enemyY) || (weaponNextX === enemyX && weaponNextY === enemyY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKLEFT
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (playerNextX === burstX && y === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true //撞了
        }
      } //玩家方向--向下
      else if (direction === DIRECTION_ENUM.BOTTOM) {
        //判断是否走出地图
        if (playerNextX < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }
        const weaponNextX = x - 1
        const weaponNextY = y + 1
        const playerTile = tileInfo[playerNextX]?.[y] //人物的下一个瓦片
        const weaponTile = tileInfo[weaponNextX]?.[weaponNextY] //枪的下一个瓦片

        //判断有门
        if (
          ((playerNextX === doorX && y === doorY) || (weaponNextX === doorX && weaponNextY === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if ((playerNextX === enemyX && y === enemyY) || (weaponNextX === enemyX && weaponNextY === enemyY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (playerNextX === burstX && y === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true //撞了
        }
      } //玩家方向--向左
      else if (direction === DIRECTION_ENUM.LEFT) {
        //判断是否走出地图
        if (playerNextX < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }
        const weaponNextX = x - 2
        const playerTile = tileInfo[playerNextX]?.[y] //人物的下一个瓦片
        const weaponTile = tileInfo[weaponNextX]?.[y] //枪的下一个瓦片

        //判断有门
        if (
          ((playerNextX === doorX && y === doorY) || (weaponNextX === doorX && y === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if ((playerNextX === enemyX && y === enemyY) || (weaponNextX === enemyX && y === enemyY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (playerNextX === burstX && y === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true //撞了
        }
      } //玩家方向--向右
      else if (direction === DIRECTION_ENUM.RIGHT) {
        //判断是否走出地图
        if (playerNextX < 0) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }
        const weaponNextX = x
        const playerTile = tileInfo[playerNextX]?.[y] //人物的下一个瓦片
        const weaponTile = tileInfo[weaponNextX]?.[y] //枪的下一个瓦片

        //判断有门
        if (
          ((playerNextX === doorX && y === doorY) || (weaponNextX === doorX && y === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if (playerNextX === enemyX && y === enemyY) {
            this.state = ENTITY_STATE_ENUM.BLOCKBACK
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (playerNextX === burstX && y === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true //撞了
        }
      }
    }
    //按钮方向--向右
    else if (inputDirection === CONTROLLER_ENUM.RIGHT) {
      const playerNextX = x + 1
      //玩家方向--向上
      if (direction === DIRECTION_ENUM.TOP) {
        //判断是否走出地图
        if (playerNextX > row - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }
        const weaponNextX = x + 1
        const weaponNextY = y - 1
        const playerTile = tileInfo[playerNextX]?.[y] //人物的下一个瓦片
        const weaponTile = tileInfo[weaponNextX]?.[weaponNextY] //枪的下一个瓦片

        //判断有门
        if (
          ((playerNextX === doorX && y === doorY) || (weaponNextX === doorX && weaponNextY === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if ((playerNextX === enemyX && y === enemyY) || (weaponNextX === enemyX && weaponNextY === enemyY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (playerNextX === burstX && y === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKRIGHT
          return true //撞了
        }
      } //玩家方向--向下
      else if (direction === DIRECTION_ENUM.BOTTOM) {
        //判断是否走出地图
        if (playerNextX > row - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }
        const weaponNextX = x + 1
        const weaponNextY = y + 1
        const playerTile = tileInfo[playerNextX]?.[y] //人物的下一个瓦片
        const weaponTile = tileInfo[weaponNextX]?.[weaponNextY] //枪的下一个瓦片

        //判断有门
        if (
          ((playerNextX === doorX && y === doorY) || (weaponNextX === doorX && weaponNextY === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if ((playerNextX === enemyX && y === enemyY) || (weaponNextX === enemyX && weaponNextY === enemyY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKLEFT
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (playerNextX === burstX && y === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKLEFT
          return true //撞了
        }
      } //玩家方向--向左
      else if (direction === DIRECTION_ENUM.LEFT) {
        //判断是否走出地图
        if (playerNextX > row - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }
        const weaponNextX = x
        const playerTile = tileInfo[playerNextX]?.[y] //人物的下一个瓦片
        const weaponTile = tileInfo[weaponNextX]?.[y] //枪的下一个瓦片

        //判断有门
        if (
          ((playerNextX === doorX && y === doorY) || (weaponNextX === doorX && y === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if (playerNextX === enemyX && y === enemyY) {
            this.state = ENTITY_STATE_ENUM.BLOCKBACK
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (playerNextX === burstX && y === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKBACK
          return true //撞了
        }
      } //玩家方向--向右
      else if (direction === DIRECTION_ENUM.RIGHT) {
        //判断是否走出地图
        if (playerNextX > row - 1) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }
        const weaponNextX = x + 2
        const playerTile = tileInfo[playerNextX]?.[y] //人物的下一个瓦片
        const weaponTile = tileInfo[weaponNextX]?.[y] //枪的下一个瓦片

        //判断有门
        if (
          ((playerNextX === doorX && y === doorY) || (weaponNextX === doorX && y === doorY)) &&
          doorState !== ENTITY_STATE_ENUM.DEATH
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true
        }

        //判断敌人
        for (let i = 0; i < enemies.length; i++) {
          const { x: enemyX, y: enemyY } = enemies[i]
          if ((playerNextX === enemyX && y === enemyY) || (weaponNextX === enemyX && y === enemyY)) {
            this.state = ENTITY_STATE_ENUM.BLOCKFRONT
            return true
          }
        }

        //判断地裂
        for (let i = 0; i < bursts.length; i++) {
          const { x: burstX, y: burstY } = bursts[i]
          //人能走，枪能走
          if (playerNextX === burstX && y === burstY && (!weaponTile || weaponTile.turnable)) {
            console.log('地裂')
            return false
          }
        }

        //人可以走，枪可以转，不发生碰撞
        if (playerTile && playerTile.moveable && (!weaponTile || weaponTile.turnable)) {
          //正常
        } else {
          this.state = ENTITY_STATE_ENUM.BLOCKFRONT
          return true //撞了
        }
      }
    }
    //按钮方向--左转
    else if (inputDirection === CONTROLLER_ENUM.TURNLEFT) {
      let nextX
      let nextY
      //更新下一个方向的值
      if (direction === DIRECTION_ENUM.TOP) {
        nextX = x - 1
        nextY = y - 1
      } else if (direction === DIRECTION_ENUM.BOTTOM) {
        nextX = x + 1
        nextY = y + 1
      } else if (direction === DIRECTION_ENUM.LEFT) {
        nextX = x - 1
        nextY = y + 1
      } else if (direction === DIRECTION_ENUM.RIGHT) {
        nextX = x + 1
        nextY = y - 1
      }

      //判断有门
      if (
        ((x === doorX && nextY === doorY) ||
          (nextX === doorX && y === doorY) ||
          (nextX === doorX && nextY === doorY)) &&
        doorState !== ENTITY_STATE_ENUM.DEATH
      ) {
        this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT
        return true
      }

      //判断敌人
      for (let i = 0; i < enemies.length; i++) {
        const { x: enemyX, y: enemyY } = enemies[i]
        if (
          (x === enemyX && nextY === enemyY) ||
          (nextX === enemyX && y === enemyY) ||
          (nextX === enemyX && nextY === enemyY)
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT
          return true
        }
      }

      if (
        //人可以转，枪也可以转
        (!tileInfo[x][nextY] || tileInfo[x][nextY].turnable) &&
        (!tileInfo[nextX][y] || tileInfo[nextX][y].turnable) &&
        (!tileInfo[nextX][nextY] || tileInfo[nextX][nextY].turnable)
      ) {
        //
      } else {
        this.state = ENTITY_STATE_ENUM.BLOCKTURNLEFT
        return true //撞了
      }
    }
    //按钮方向--右转
    else if (inputDirection === CONTROLLER_ENUM.TURNRIGHT) {
      let nextX
      let nextY
      //更新下一个方向的值，右上角三个tile必须turnable为true
      if (direction === DIRECTION_ENUM.TOP) {
        nextX = x + 1
        nextY = y - 1
      } else if (direction === DIRECTION_ENUM.BOTTOM) {
        nextX = x - 1
        nextY = y + 1
      } else if (direction === DIRECTION_ENUM.LEFT) {
        nextX = x - 1
        nextY = y - 1
      } else if (direction === DIRECTION_ENUM.RIGHT) {
        nextX = x + 1
        nextY = y + 1
      }

      //判断有门
      if (
        ((x === doorX && nextY === doorY) ||
          (nextX === doorX && y === doorY) ||
          (nextX === doorX && nextY === doorY)) &&
        doorState !== ENTITY_STATE_ENUM.DEATH
      ) {
        this.state = ENTITY_STATE_ENUM.BLOCKTURNRIGHT
        return true
      }

      //判断敌人
      for (let i = 0; i < enemies.length; i++) {
        const { x: enemyX, y: enemyY } = enemies[i]
        if (
          (x === enemyX && nextY === enemyY) ||
          (nextX === enemyX && y === enemyY) ||
          (nextX === enemyX && nextY === enemyY)
        ) {
          this.state = ENTITY_STATE_ENUM.BLOCKTURNRIGHT
          return true
        }
      }

      if (
        //人可以转，枪也可以转
        (!tileInfo[x]?.[nextY] || tileInfo[x]?.[nextY].turnable) &&
        (!tileInfo[nextX]?.[y] || tileInfo[nextX]?.[y].turnable) &&
        (!tileInfo[nextX]?.[nextY] || tileInfo[nextX]?.[nextY].turnable)
      ) {
        //
      } else {
        this.state = ENTITY_STATE_ENUM.BLOCKTURNRIGHT
        return true //撞了
      }
    }

    return false
  }
}
