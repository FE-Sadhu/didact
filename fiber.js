export const HOST_ROOT = 3; // Fiber 根节点

export const createFiber = ({type, dom, props, parent, child, sibling}) => {
  return {
    type,
    dom,
    props,
    parent,
    child,
    sibling,
  }
}
