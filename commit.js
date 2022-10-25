import { deletions, wipRoot } from "./render.js";


export const commitRoot = () => {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom
  ) {
    domParent.appendChild(fiber.dom)
  }  else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    )
  }  else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent)
  }
  
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}

const isEvent = key => key.startsWith("on")
const isProperty = key =>
  key !== "children" && !isEvent(key)
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

function updateDom (dom, prevProps, nextProps) {
   //Remove old or changed event listeners
   Object.keys(prevProps)
   .filter(isEvent)
   .filter(
     key =>
       !(key in nextProps) ||
       isNew(prevProps, nextProps)(key)
   )
   .forEach(name => {
     const eventType = name
       .toLowerCase()
       .substring(2)
     dom.removeEventListener(
       eventType,
       prevProps[name]
     )
   })

  // Remove old properties
  Object.keys(prevProps)
  .filter(isProperty)
  .filter(isGone(prevProps, nextProps))
  .forEach(name => {
    dom[name] = ""
  })
  
  // Set new or changed properties
  Object.keys(nextProps)
  .filter(isProperty)
  .filter(isNew(prevProps, nextProps))
  .forEach(name => {
    dom[name] = nextProps[name]
  })

   // Add event listeners
   Object.keys(nextProps)
   .filter(isEvent)
   .filter(isNew(prevProps, nextProps))
   .forEach(name => {
     const eventType = name
       .toLowerCase()
       .substring(2)
     dom.addEventListener(
       eventType,
       nextProps[name]
     )
   })
};
