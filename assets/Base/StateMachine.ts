import { _decorator, Component, Animation, SpriteFrame } from 'cc'

import State from './State'
import { FSM_PARAMS_TYPE_ENUM } from '../Enums'
import { SubStateMachine } from './SubStateMachine'

const { ccclass } = _decorator

type ParamsValueType = boolean | number

export interface IParamsValue {
  type: FSM_PARAMS_TYPE_ENUM
  value: ParamsValueType
}

export const getInitParamsTrigger = () => {
  return {
    type: FSM_PARAMS_TYPE_ENUM.TRIGGER,
    value: false,
  }
}

export const getInitParamsNumber = () => {
  return {
    type: FSM_PARAMS_TYPE_ENUM.NUMBER,
    value: 0,
  }
}

@ccclass('StateMachine')
export abstract class StateMachine extends Component {
  private _currentState: State | SubStateMachine = null
  //参数列表
  params: Map<string, IParamsValue> = new Map()
  //状态机列表
  stateMachines: Map<string, State | SubStateMachine> = new Map()
  animationComponent: Animation
  //加载资源的等待数组
  waitingList: Array<Promise<SpriteFrame[]>> = []

  getParams(paramsName: string) {
    if (this.params.has(paramsName)) {
      return this.params.get(paramsName).value
    }
  }

  setParams(paramsName: string, value: ParamsValueType) {
    //改变参数列表中对应参数的值，执行run方法
    if (this.params.has(paramsName)) {
      this.params.get(paramsName).value = value
      this.run()
      this.resetTrigger()
    }
  }

  get currentState() {
    return this._currentState
  }

  set currentState(newState: State) {
    this._currentState = newState
    this._currentState.run()
  }

  //触发器是一次性的，每当触发过后，重置触发器
  resetTrigger() {
    for (const [_, value] of this.params) {
      if (value.type === FSM_PARAMS_TYPE_ENUM.TRIGGER) {
        value.value = false
      }
    }
  }

  //定义抽象方法，PlayerStateMachine必须实现该方法
  abstract init(): void
  abstract run(): void
}
