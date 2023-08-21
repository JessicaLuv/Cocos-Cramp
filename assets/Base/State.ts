/**
 * 1.需要知道自己的animationClip
 * 2.需要播放动画的能力animation
 */

import { AnimationClip, Sprite, SpriteFrame, animation } from 'cc'
import ResourceManager from '../Runtime/ResourceManager'
import { StateMachine } from './StateMachine'
import { sortSpriteFrame } from '../Utils'

//播放动画的速度是一秒八帧
export const ANIMATION_SPEED = 1 / 8

export default class State {
  animationClip: AnimationClip
  constructor(
    private fsm: StateMachine,
    private path: string,
    private wrapMpode: AnimationClip.WrapMode = AnimationClip.WrapMode.Normal,
    private speed: number = ANIMATION_SPEED,
    private events: any[] = [],
  ) {
    this.init()
  }

  async init() {
    const promise = ResourceManager.Instance.loadDir(this.path)
    this.fsm.waitingList.push(promise)
    const spriteFrame = await promise

    this.animationClip = new AnimationClip()

    const track = new animation.ObjectTrack()
    track.path = new animation.TrackPath().toComponent(Sprite).toProperty('spriteFrame') // 指定轨道路径，即指定目标对象为 "Foo" 子节点的 "position" 属性
    //关键帧列表
    const frames: Array<[number, SpriteFrame]> = sortSpriteFrame(spriteFrame).map((item, index) => [
      this.speed * index,
      item,
    ])
    track.channel.curve.assignSorted(frames)

    // 最后将轨道添加到动画剪辑以应用
    this.animationClip.addTrack(track)
    this.animationClip.name = this.path
    this.animationClip.duration = frames.length * this.speed // 整个动画剪辑的周期
    this.animationClip.wrapMode = this.wrapMpode

    for (const event of this.events) {
      this.animationClip.events.push(event)
    }

    this.animationClip.updateEventDatas()
  }

  run() {
    //如果当前的动画等于将要播放的动画，则不播放动画
    if (this.fsm.animationComponent?.defaultClip?.name === this.animationClip.name) {
      return
    }
    this.fsm.animationComponent.defaultClip = this.animationClip
    this.fsm.animationComponent.play()
  }
}
