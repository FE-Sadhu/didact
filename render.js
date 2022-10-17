import { createFiber, HOST_ROOT, OTHER_TAG } from "./fiber.js";

function render(reactElement, container) {
  // 设置下一个工作单元
  const props = {
    children: [reactElement]
  }
  nextUnitOfWork = createFiber({
    type: HOST_ROOT, 
    dom: container, 
    props
  });
}

function createDomFromFiber(fiber) {
  const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(reactElement.type);

  Object.keys(fiber.props)
  .filter(key => key !== 'children')
  .forEach(prop => dom[prop] = fiber.props[prop])

  return dom;
}

// Concurrent Mode
// 若是递归操作，一旦开始，就只能等处理完整棵 element tree 才能结束，无法中断。
// 如果耗时太长超过 16.6ms 就会掉帧，造成卡顿。
// 由于递归无法控制计算时长，所以我们可以把所有工作分解成一个一个 unit，
// 在执行完每个 unit 后，如果有其他需要完成的事情，则中断浏览器渲染

// workLoop 将在浏览器空闲时被调用
requestIdleCallback(workLoop)

let nextUnitOfWork = null // 每个 element 对应一个 fiber ，每个 fiber 就是一个工作单元

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    // timeRemaining() 拿到浏览器闲置的剩余毫秒数
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}

// 执行当前 unit 并返回下一个 unit
function performUnitOfWork(fiber) {
  // 1. 为当前 fiber 节点创建 DOM 节点
  if (!fiber.dom) {
    fiber.dom = createDomFromFiber(fiber);
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(dom);
  }

  // 2. 为当前 fiber 节点的子 element 创建 fiber ，并连接起来
  const childElements = fiber.props.children;
  let index = 0;
  let prevSibling = null;

  while(index < childElements.length) {
    const element = childElements[index];

    const NewFiber = createFiber({
      type: element.type,
      props: element.props,
      parent: fiber,
    })

    if (index === 0) {
      // 第一个子节点才是父节点的 child
      fiber.child = NewFiber;
    } else {
      // 之后的兄弟节点靠 sibling 连接
      prevSibling.sibling = NewFiber;
    }
    prevSibling = NewFiber;
    index++;
  }

  // 3. 找出下一个工作单元并返回
  if (fiber.child) {
    return fiber.child;
  }

  while(fiber) {
    if (fiber.sibling) {
      return fiber.sibling;
    }
    fiber = fiber.sibling;
  }
}


export default render;
