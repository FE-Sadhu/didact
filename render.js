import { commitRoot } from "./commit.js";
import { createFiber, HOST_ROOT } from "./fiber.js";

function render(reactElement, container) {
  // 设置下一个工作单元
  const props = {
    children: [reactElement],
  };
  wipRoot = createFiber({
    type: HOST_ROOT,
    dom: container,
    props,
    alternate: currentRoot,
  });
  deletions = [];
  nextUnitOfWork = wipRoot;
}

function createDomFromFiber(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  Object.keys(fiber.props)
    .filter((key) => key !== "children")
    .forEach((prop) => (dom[prop] = fiber.props[prop]));

  return dom;
}

// Concurrent Mode
// 若是递归操作，一旦开始，就只能等处理完整棵 element tree 才能结束，无法中断。
// 如果耗时太长超过 16.6ms 就会掉帧，造成卡顿。
// 由于递归无法控制计算时长，所以我们可以把所有工作分解成一个一个 unit，
// 在执行完每个 unit 后，如果有其他需要完成的事情，则中断浏览器渲染

// workLoop 将在浏览器空闲时被调用
requestIdleCallback(workLoop);

let nextUnitOfWork = null; // 每个 element 对应一个 fiber ，每个 fiber 就是一个工作单元
export let wipRoot = null; // Work In Progress 树，目的是等到所有 Fiber 节点处理完再 commit 挂载，还有 update 时 diff
let currentRoot = null; // 挂载完后的 WIP 树赋给 currentRoot
export let deletions = null; // 保存要删除的 旧 Fiber ，但是 commit 的是 wip tree，所以需要保存进这个数组

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // timeRemaining() 拿到浏览器闲置的剩余毫秒数
    shouldYield = deadline.timeRemaining() < 1;
  }

  // 当没有下一个工作单元时，就可提交到 DOM 上了
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
    currentRoot = wipRoot;
    wipRoot = null;
  }

  requestIdleCallback(workLoop);
}

// 执行当前 unit 并返回下一个 unit
function performUnitOfWork(fiber) {
  // 函数组件的 fiber 没有 dom 属性
  // 函数组件的 children 不是从 prop 取得，而是 execute 获得
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // 3. 找出下一个工作单元并返回
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  const children = [fiber.type(fiber.props)]
  reconcileChildren(fiber, children)
}

function updateHostComponent(fiber) {
   // 1. 为当前 fiber 节点创建 DOM 节点
   if (!fiber.dom) {
    fiber.dom = createDomFromFiber(fiber);
  }
  // 2. 为当前 fiber 节点的子 element 创建 fiber ，并连接在 WIP 树
  const childElements = fiber.props.children;
  reconcileChildren(fiber, childElements);
}

function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber !== null) {
    const childElement = elements[index];
    let NewFiber = null;
    // 这里的实现其实是按着遍历顺序去对比 旧 Fiber 和 新 element 的，
    // 其实真正实现得按照旧 fiber 的 key 去找新 element ，找到了再对比 type，找不到直接删

    const sameType =
      oldFiber && // 旧 fiber 存在
      childElement && // 子元素也存在
      childElement.type == oldFiber.type; // 类型一样

    // 可以复用 DOM ，只需要改 props 就行
    if (sameType) {
      NewFiber = createFiber({
        type: oldFiber.type,
        props: childElement.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      });
    }

    // 子元素存在，但没有对应旧 fiber 或 对应旧 fiber 的 type 不一样，需要新创建一个 DOM 节点
    if (childElement && !sameType) {
      NewFiber = createFiber({
        type: childElement.type,
        props: childElement.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      });
    }

    // 旧 fiber 存在，但没有对应的新子元素 或 对应子元素的 type 变了，需要删除旧 fiber 对应 DOM 节点
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (index === 0) {
      // 第一个子节点才是父节点的 child
      wipFiber.child = NewFiber;
    } else if (childElement) {
      // 之后的兄弟节点靠 sibling 连接
      prevSibling.sibling = NewFiber;
    }
    prevSibling = NewFiber;
    index++;
  }
}

let wipFiber = null
let hookIndex = null

export function useState(initial) {
  // 拿到上一次 Hook 的对象
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [] // 外部可能调用了多次
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)
  })

  const setState = action => {
    // 把 action 存储起来，不会立即更新
    hook.queue.push(action)
    // 赋值下一个工作单元，等到下一个 work loop 时再走 render - commit 流程更新页面
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot
    deletions = []
  }

  wipFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
}

export default render;
