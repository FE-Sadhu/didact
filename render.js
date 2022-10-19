import { commitRoot } from "./commit.js";
import { createFiber, HOST_ROOT } from "./fiber.js";

function render(reactElement, container) {
  // 设置下一个工作单元
  const props = {
    children: [reactElement]
  }
  wipRoot = createFiber({
    type: HOST_ROOT, 
    dom: container, 
    props,
    alternate: currentRoot,
  });
  nextUnitOfWork = wipRoot;
}

function createDomFromFiber(fiber) {
  const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);

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
export let wipRoot = null; // Work In Progress 树，目的是等到所有 Fiber 节点处理完再 commit 挂载，还有 update 时 diff
let currentRoot = null; // 挂载完后的 WIP 树赋给 currentRoot


function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    // timeRemaining() 拿到浏览器闲置的剩余毫秒数
    shouldYield = deadline.timeRemaining() < 1
  }

  // 当没有下一个工作单元时，就可提交到 DOM 上了
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
    currentRoot = wipRoot
    wipRoot = null;
  }

  requestIdleCallback(workLoop)
}

// 执行当前 unit 并返回下一个 unit
function performUnitOfWork(fiber) {
  // 1. 为当前 fiber 节点创建 DOM 节点
  if (!fiber.dom) {
    fiber.dom = createDomFromFiber(fiber);
  }

  // 2. 为当前 fiber 节点的子 element 创建 fiber ，并连接起来
  const childElements = fiber.props.children;
  reconcileChildren(fiber, childElements);
 

  // 3. 找出下一个工作单元并返回
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while(nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while(index < elements.length || oldFiber !== null) {
    const childElement = elements[index];
    let NewFiber = null;
    // 这里的实现其实是按着遍历顺序去对比 旧 Fiber 和 新 element 的，
    // 其实真正实现得按照旧 fiber 的 key 去找新 element ，找到了再对比 type，找不到直接删
  
    const sameType =
      oldFiber && // 旧 fiber 存在
      childElement && // 子元素也存在
      childElement.type == oldFiber.type // 类型一样

      // 可以复用 DOM ，只需要改 props 就行
      if (sameType) {
        newFib/
      }

      // 子元素存在，但没有对应旧 fiber 或 对应旧 fiber 的 type 不一样，需要新增一个 fiber 节点
      if (childElement && !sameType) {
        
      }

      // 旧 fiber 存在，但没有对应的新子元素 或 对应子元素的 type 变了，需要删除旧 fiber 节点
      if (oldFiber && !sameType) {

      }
    const NewFiber = createFiber({
      type: child.type,
      props: child.props,
      parent: wipFiber,
    }) 

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (index === 0) {
      // 第一个子节点才是父节点的 child
      wipFiber.child = NewFiber;
    } else {
      // 之后的兄弟节点靠 sibling 连接
      prevSibling.sibling = NewFiber;
    }
    prevSibling = NewFiber;
    index++;
  }
}
export default render;
