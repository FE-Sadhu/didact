
function render(reactElement, container) {
  const dom = reactElement.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(reactElement.type);

  Object.keys(reactElement.props)
    .filter(key => key !== 'children')
    .forEach(prop => dom[prop] = reactElement.props[prop])

  reactElement.props.children.forEach(child => {
    // 若是递归操作，一旦开始，就只能等处理完整棵 element tree 才能结束，无法中断。
    // 如果耗时太长超过 16.6ms 就会掉帧，造成卡顿。
    render(child, dom);
  })

  container.appendChild(dom);
}

// 由于递归无法控制计算时长，所以我们可以把所有工作分解成一个一个 unit，
// 在执行完每个 unit 后，如果有其他需要完成的事情，则中断浏览器渲染

// workLoop 将在浏览器空闲时被调用
requestIdleCallback(workLoop)

let nextUnitOfWork = null

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
function performUnitOfWork(nextUnitOfWork) {
  // TODO
}





export default render;
