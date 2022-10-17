export const HOST_ROOT = 3; // Fiber 根节点

export const createFiber = ({
  type, 
  dom, 
  props,
  parent,
  child, 
  sibling,
  alternate
  }) => {
  return {
    type,
    dom,
    props,
    parent,
    child,
    sibling,
    alternate
  }
}
