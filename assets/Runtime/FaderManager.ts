import { RenderRoot2D, game } from 'cc'
import Singleton from '../Base/Singleton'
import { DEFAULT_DURATION, DrawManager } from '../Scripts/UI/DrawManager'
import { createUINode } from '../Utils'

interface IITem {
  func: Function
  ctx: unknown
}

export default class FaderManager extends Singleton {
  static get Instance() {
    return super.GetInstance<FaderManager>()
  }

  private _fader: DrawManager = null

  get fader() {
    if (this._fader !== null) {
      return this._fader
    }

    const root = createUINode()
    root.addComponent(RenderRoot2D)

    const fadeNode = createUINode()
    fadeNode.setParent(root)
    this._fader = fadeNode.addComponent(DrawManager)
    this._fader.init()

    game.addPersistRootNode(root)

    return this._fader
  }

  fadeIn(duration = DEFAULT_DURATION) {
    return this.fader.fadeIn(duration)
  }

  fadeOut(duration = DEFAULT_DURATION) {
    return this.fader.fadeOut(duration)
  }
}
