
function render(reactElement, container) {
  const dom = reactElement.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(reactElement.type);

  Object.keys(reactElement.props)
    .filter(key => key !== 'children')
    .forEach(prop => dom[prop] = reactElement.props[prop])

  reactElement.props.children.forEach(child => {
    render(child, dom);
  })

  container.appendChild(dom);
}

export default render;
