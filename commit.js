import { deletions, wipRoot } from "./render.js";


export const commitRoot = () => {
  deletions.forEach(commitWork);
  commitWork(wipRoot.child);
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom

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
    domParent.removeChild(fiber.dom)
  }
  
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}