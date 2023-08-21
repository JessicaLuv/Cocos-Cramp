import { StateMachine } from '../../Base/StateMachine'
import { DIRECTION_ENUM, SHAKE_TYPE_ENUM } from '../../Enums'
import State, { ANIMATION_SPEED } from '../../Base/State'
import DirectionSubStateMachine from '../../Base/DirectionSubStateMachine'
import { AnimationClip, animation } from 'cc'

const BASE_URL = 'texture/player/attack/'

export default class AttackSubStateMachine extends DirectionSubStateMachine {
  constructor(fsm: StateMachine) {
    super(fsm) //构造函数要调用父类的构造函数
    this.stateMachines.set(
      DIRECTION_ENUM.TOP,
      new State(fsm, `${BASE_URL}top`, AnimationClip.WrapMode.Normal, ANIMATION_SPEED, [
        {
          frame: ANIMATION_SPEED * 4,
          func: 'onAttackShake',
          params: [SHAKE_TYPE_ENUM.TOP],
        },
      ]),
    )
    this.stateMachines.set(
      DIRECTION_ENUM.BOTTOM,
      new State(fsm, `${BASE_URL}bottom`, AnimationClip.WrapMode.Normal, ANIMATION_SPEED, [
        {
          frame: ANIMATION_SPEED * 4,
          func: 'onAttackShake',
          params: [SHAKE_TYPE_ENUM.BOTTOM],
        },
      ]),
    )
    this.stateMachines.set(
      DIRECTION_ENUM.LEFT,
      new State(fsm, `${BASE_URL}left`, AnimationClip.WrapMode.Normal, ANIMATION_SPEED, [
        {
          frame: ANIMATION_SPEED * 4,
          func: 'onAttackShake',
          params: [SHAKE_TYPE_ENUM.LEFT],
        },
      ]),
    )
    this.stateMachines.set(
      DIRECTION_ENUM.RIGHT,
      new State(fsm, `${BASE_URL}right`, AnimationClip.WrapMode.Normal, ANIMATION_SPEED, [
        {
          frame: ANIMATION_SPEED * 4,
          func: 'onAttackShake',
          params: [SHAKE_TYPE_ENUM.RIGHT],
        },
      ]),
    )
  }
}
