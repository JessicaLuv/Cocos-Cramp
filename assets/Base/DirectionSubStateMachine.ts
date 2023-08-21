import { DIRECTION_ORDER_ENUM, PARAMS_NAME_ENUM } from '../Enums'
import { SubStateMachine } from './SubStateMachine'

export default class DirectionSubStateMachine extends SubStateMachine {
  run(): void {
    //根据当前的方向参数，决定采用哪个子状态机
    const value = this.fsm.getParams(PARAMS_NAME_ENUM.DIRECTION)
    //当前的状态等于取到对应的子状态机
    this.currentState = this.stateMachines.get(DIRECTION_ORDER_ENUM[value as number])
  }
}
