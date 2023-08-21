import { _decorator, Component, Animation, SpriteFrame } from 'cc'

import State from './State'
import { FSM_PARAMS_TYPE_ENUM } from '../Enums'
import { StateMachine } from './StateMachine'

const { ccclass } = _decorator

export abstract class SubStateMachine {
  private _currentState: State = null
  stateMachines: Map<string, State> = new Map()

  constructor(public fsm: StateMachine) {}
  //加载资源的等待数组
  waitingList: Array<Promise<SpriteFrame[]>> = []

  get currentState() {
    return this._currentState
  }

  set currentState(newState: State) {
    this._currentState = newState
    this._currentState.run()
  }

  //定义抽象方法，PlayerStateMachine必须实现该方法
  abstract run(): void
}
