import { _decorator, Component, Event, game } from 'cc'
import EventManager from '../../Runtime/EventManager'
import { CONTROLLER_ENUM, EVENT_ENUM, SHAKE_TYPE_ENUM } from '../../Enums'
const { ccclass, property } = _decorator

@ccclass('ShakeManager')
export class ShakeManager extends Component {
  private isShaking = false
  private type: SHAKE_TYPE_ENUM
  private oldTime: number = 0
  private oldPos: { x: number; y: number } = { x: 0, y: 0 }

  onLoad() {
    EventManager.Instance.on(EVENT_ENUM.SCREEN_SHAKE, this.onShake, this)
  }

  onDestroy() {
    EventManager.Instance.off(EVENT_ENUM.SCREEN_SHAKE, this.onShake)
  }

  stop() {
    this.isShaking = false
  }

  onShake(type: SHAKE_TYPE_ENUM) {
    if (this.isShaking) {
      return
    }

    this.type = type
    this.oldTime = game.totalTime
    this.isShaking = true
    this.oldPos.x = this.node.position.x
    this.oldPos.y = this.node.position.y
  }

  update() {
    if (this.isShaking) {
      const duration = 200 // 持续时间
      const amount = 16 // 振幅
      const frequency = 12 // 频率
      const curSecond = (game.totalTime - this.oldTime) / 1000 // 当前时间
      const totalSecond = duration / 1000 // 总时间
      const offset = amount * Math.sin(frequency * Math.PI * curSecond)
      //震动
      if (this.type === SHAKE_TYPE_ENUM.TOP) {
        this.node.setPosition(this.oldPos.x, this.oldPos.y - offset)
      } else if (this.type === SHAKE_TYPE_ENUM.BOTTOM) {
        this.node.setPosition(this.oldPos.x, this.oldPos.y + offset)
      } else if (this.type === SHAKE_TYPE_ENUM.LEFT) {
        this.node.setPosition(this.oldPos.x - offset, this.oldPos.y)
      } else if (this.type === SHAKE_TYPE_ENUM.RIGHT) {
        this.node.setPosition(this.oldPos.x + offset, this.oldPos.y)
      }
      //结束偏移
      if (curSecond > totalSecond) {
        this.isShaking = false
        this.node.setPosition(this.oldPos.x, this.oldPos.y)
      }
    }
  }
}
