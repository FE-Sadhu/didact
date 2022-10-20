export const HOST_ROOT = 3; // Fiber 根节点

export const createFiber = ({
  type, 
  dom, 
  props,
  parent,
  child, 
  sibling,
  alternate,
  effectTag
  }) => {
  return {
    type,
    dom,
    props,
    parent,
    child,
    sibling,
    alternate,
    effectTag // 表示 commit 阶段要做什么事
  }
}
