import { Layers, Node, SpriteFrame, UITransform } from 'cc'

export const createUINode = (name: string = '') => {
  const node = new Node(name)
  const transform = node.addComponent(UITransform)
  transform.setAnchorPoint(0, 1)
  node.layer = 1 << Layers.nameToLayer('UI_2D')
  return node
}

export const randomByRange = (start: number, end: number) => Math.floor(start + (end - start) * Math.random())

//随机生成一个唯一的字符串
export const randomByLen = (len: number) =>
  Array.from({ length: len }).reduce<string>((total, item) => total + Math.floor(Math.random() * 10), '')

//正则函数匹配括号里的数据
const reg = /\((\d+)\)/

const getNumberWithinString = (str: string) => parseInt(str.match(reg)[1] || '0')

export const sortSpriteFrame = (sprireFrame: SpriteFrame[]) =>
  sprireFrame.sort((a, b) => getNumberWithinString(a.name) - getNumberWithinString(b.name))
