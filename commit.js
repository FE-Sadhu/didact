import { wipRoot } from "./render.js";


export const commitRoot = () => {
  commitWork(wipRoot.child);
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}