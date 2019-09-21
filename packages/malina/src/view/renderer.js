import { isElementNode, isViewNode, isTextNode } from '../vdom';
import { toOnEventName, normalizeEventName } from './event';
import { assert } from '../env';
import { isTemplateElement } from './util';

const isRoot = path => path.length === 0;

const isSameViewNode = (a, b) => a.tag.id === b.tag.id;

const requireKeysSet = (node, options) => {
  const { children } = node;
  if (node.attrs.ignoreKeys || options.noWarnKeys)
    return;

  if (!children.every((node, i) =>
    i === 0 ||
    !isViewNode(node) ||
    !isViewNode(children[i - 1]) ||
    node.attrs.key ||
    !isSameViewNode(node, children[i - 1])
  ))
    throw new Error("Every view node in an array must have a 'key' attribute");
};

const requireUniqueKeys = (node, options) => {
  const { children } = node;

  if (node.attrs.ignoreKeys || options.noWarnKeys)
    return;

  let index = {};
  for (const node of children) {
    if (isViewNode(node) && node.attrs.key) {
      if (!(node.tag.id in index))
        index[node.tag.id] = {};

      if (node.attrs.key in index[node.tag.id])
        throw new Error("Every view node in an array must have an unique 'key' attribute");

      index[node.tag.id][node.attrs.key] = true;
    }
  }
};

const requireNoInnerHtmlOverlap = node => {
  const { attrs, children } = node;
  if ('innerHtml' in attrs && attrs.innerHtml != null && children != null && children.length > 0)
    throw new Error('Nodes with "innerHtml" attribute must not have children');
};

const requireValidChildren = (node, options = {}) => {
  requireKeysSet(node, options);
  requireUniqueKeys(node, options);
  requireNoInnerHtmlOverlap(node);

  return node;
};

const insertElement = (container, index, element) => {
  const fragment = isTemplateElement(container) ? container.content : container;
  const before = fragment.childNodes[index];
  fragment.insertBefore(element, before);
};

const removeElement = (container, element) => {
  const fragment = isTemplateElement(container) ? container.content : container;
  fragment.removeChild(element);
};

const customElementNameRe = /^[a-z][a-z0-9.-_]*-[a-z0-9.-_]*$/;

const forbiddenCustomElementNames = [
  'annotation-xml',
  'color-profile',
  'font-face',
  'font-face-src',
  'font-face-uri',
  'font-face-format',
  'font-face-name',
  'missing-glyph'
];

const isNodeCustomElement = node =>
  isElementNode(node) &&
  (!forbiddenCustomElementNames.includes(node.tag) &&
    (customElementNameRe.test(node.tag) ||
      ('is' in node.attrs && customElementNameRe.test(node.attrs.is))));

const isDomElement = (renderingContext, node) =>
  node instanceof renderingContext.getDocument().defaultView.Element ||
  node instanceof renderingContext.getDocument().defaultView.Text;

class Renderer {
  constructor(view, renderingContext) {
    this.view = view;
    this.renderingContext = renderingContext;
    this.element = null;
    this.eventListeners = new Map();
    this.eventListenerDelegates = new Map();
    this.attachQueue = [];
    this.isDeferElementAttach = false;
  }

  // Renders vDOM and returns rendered element
  render(node) {
    return this.createNode(node, [], this.renderingContext);
  }

  // Hydrates a pre-rendered element, attaches to it,
  // adding event listeners and instantiating and attaching views
  hydrate(element, node) {
    if (this.element !== null)
      throw new Error('Already attached');

    this.hydrateNode(element, node, [], this.renderingContext);
    this.attach(element);
  }

  // Attaches to the element, focusing elements, attaches inner views to the element
  attach(element, node) {
    if (this.element !== null)
      throw new Error('Already attached');

    this.element = element;
    this.attachNode(element, node, [], this.renderingContext);
  }

  mount(element, container, index) {
    insertElement(container, index, element);
  }

  move(container, index) {
    insertElement(container, index, this.element);
  }

  // Updates DOM tree
  update(prev, next) {
    this.renderingContext = this.renderingContext.setUpdating(true);
    this.patch(this.element, prev, next, [], this.renderingContext);
    this.renderingContext.setUpdating(false);
  }

  // Removes event listeners
  detach(node) {
    if (this.element === null)
      throw new Error('Already detached');

    this.detachNode(this.element, node, [], this.renderingContext);

    assert(this.eventListeners.size === 0, 'Event listeners map is empty after detach');
    assert(this.eventListenerDelegates.size === 0, 'Event listener delegates map is empty after detach');

    this.element = null;
  }

  deferElementAttach() {
    this.isDeferElementAttach = true;
  }

  flushAttachQueue() {
    const queue = this.attachQueue;
    this.attachQueue = [];
    for (const { element, name, value, path, renderingContext } of queue)
      this.attachAttribute(element, name, value, path, renderingContext);
  }

  /** @private */
  static getAttrKey(path, name) {
    return `${name}.${path.join('.')}`;
  }

  /** @private */
  patch(element, prev, next, path, renderingContext) {
    if (prev === next)
      return;

    if (isElementNode(prev)) {
      if (next == null) this.patchFromNodeToNone(element, prev, path, renderingContext);
      else if (isElementNode(next)) this.patchFromNodeToNode(element, prev, next, path, renderingContext);
      else if (isViewNode(next)) this.patchFromNodeToView(element, prev, next, path, renderingContext);
      else if (isTextNode(next)) this.patchFromNodeToText(element, prev, next, path);
      else if (isDomElement(renderingContext, next)) this.patchFromElementNodeToDom(element, next, path);
      else throw new Error('Invalid template type');
    } else if (isViewNode(prev)) {
      if (next == null) this.patchFromViewToNone(element, prev, path);
      else if (isElementNode(next)) this.patchFromViewToNode(element, prev, next, path, renderingContext);
      else if (isViewNode(next)) this.patchFromViewToView(element, prev, next, path, renderingContext);
      else if (isTextNode(next)) this.patchFromViewToText(element, prev, next, path);
      else if (isDomElement(renderingContext, next)) this.patchFromViewToDom(element, next, path);
      else throw new Error('Invalid template type');
    } else if (isDomElement(renderingContext, prev)) {
      if (next == null) this.patchFromDomToNone(element, path);
      else if (isElementNode(next)) this.patchFromDomToNode(element, next, path, renderingContext);
      else if (isViewNode(next)) this.patchFromDomToView(element, next, path, renderingContext);
      else if (isTextNode(next)) this.patchFromDomToText(element, next, path);
      else if (isDomElement(renderingContext, next)) this.patchFromDomToDom(element, next, path);
      else throw new Error('Invalid template type');
    } else {
      if (next == null) this.patchFromTextToNone(element, path);
      else if (isElementNode(next)) this.patchFromTextToNode(element, next, path, renderingContext);
      else if (isViewNode(next)) this.patchFromTextToView(element, next, path, renderingContext);
      else if (isTextNode(next)) this.patchTextNodes(element, prev, next, path);
      else if (isDomElement(renderingContext, next)) this.patchFromTextToDom(element, next, path);
      else throw new Error('Invalid template type');
    }
  }

  /** @private */
  patchFromElementNodeToDom(element, next, path) {
    if (element !== next) {
      this.view.destroyInnerViews(path, false);
      element.replaceWith(next);

      if (isRoot(path))
        this.element = next;
    }
  }

  /** @private */
  patchFromViewToDom(element, next, path) {
    this.view.destroyInnerView(path, false);
    element.replaceWith(next);

    if (isRoot(path))
      this.element = next;
  }

  /** @private */
  patchFromDomToNone(element, path) {
    if (isRoot(path))
      throw new Error('Root element deleted during patch');

    removeElement(element.parentNode, element);
  }

  /** @private */
  patchFromDomToNode(element, next, path, renderingContext) {
    const newElement = this.createElementNode(next, path, renderingContext.setUpdating(false));
    element.replaceWith(newElement);

    if (renderingContext.isUpdating())
      this.attachElementNode(element, next, path, renderingContext);

    if (isRoot(path))
      this.element = newElement;
  }

  /** @private */
  patchFromDomToView(element, next, path, renderingContext) {
    const view = this.view.instantiateInnerView(next, path, renderingContext.setUpdating(false));

    let index;
    if (path.length > 0) index = path[path.length - 1];
    else index = Array.from(element.parentNode.childNodes).findIndex(n => n === element);

    const parent = element.parentNode;
    element.remove();

    if (renderingContext.isUpdating()) {
      const newElement = view.render();
      insertElement(parent, index, newElement);
      view.attach(newElement);
    } else throw new Error('Unreachable');

    if (isRoot(path))
      this.element = view.element;
  }

  /** @private */
  patchFromDomToText(element, next, path) {
    const newElement = this.renderingContext.getDocument().createTextNode(`${next}`);
    element.replaceWith(newElement);

    if (isRoot(path))
      this.element = newElement;
  }

  /** @private */
  patchFromDomToDom(element, next, path) {
    if (element !== next) {
      element.replaceWith(next);

      if (isRoot(path))
        this.element = next;
    }
  }

  /** @private */
  patchFromTextToDom(element, next, path) {
    element.replaceWith(next);

    if (isRoot(path))
      this.element = next;
  }

  /** @private */
  patchFromTextToNone(element, path) {
    if (isRoot(path))
      throw new Error('Root element deleted during patch');

    removeElement(element.parentNode, element);
  }

  /** @private */
  patchTextNodes(element, prev, next, path) {
    if (prev !== next) {
      const newElement = this.createTextNode(next);
      element.replaceWith(newElement);

      if (isRoot(path))
        this.element = newElement;
    }
  }

  /** @private */
  patchFromTextToNode(element, next, path, renderingContext) {
    const newElement = this.createElementNode(next, path, renderingContext.setUpdating(false));

    element.replaceWith(newElement);
    if (renderingContext.isUpdating())
      this.attachElementNode(element, next, path, renderingContext);

    if (isRoot(path))
      this.element = newElement;
  }

  /** @private */
  patchFromTextToView(element, next, path, renderingContext) {
    const view = this.view.instantiateInnerView(next, path, renderingContext.setUpdating(false));
    let index;
    if (path.length > 0) index = path[path.length - 1];
    else index = Array.from(element.parentNode.childNodes).findIndex(n => n === element);
    const parent = element.parentNode;

    element.remove();
    if (renderingContext.isUpdating()) {
      const newElement = view.render();
      insertElement(parent, index, newElement);
      view.attach(newElement);
    } else throw new Error('Unreachable');

    if (isRoot(path))
      this.element = view.element;
  }

  /** @private */
  patchFromNodeToNone(element, prev, path, renderingContext) {
    if (isRoot(path))
      throw new Error('Root element deleted during patch');

    this.detachElementNode(element, prev, path, renderingContext);
    this.view.destroyInnerViews(path, false);
    element.remove();
  }

  /** @private */
  patchFromNodeToText(element, prev, next, path) {
    this.view.destroyInnerViews(path, false);

    const newElement = this.renderingContext.getDocument().createTextNode(`${next}`);
    element.replaceWith(newElement);

    if (isRoot(path))
      this.element = newElement;
  }

  /** @private */
  patchFromNodeToNode(element, prev, next, path, renderingContext) {
    if (prev === next)
      return;

    const prevCustom = isNodeCustomElement(prev);
    const nextCustom = isNodeCustomElement(next);

    if (prev.tag === next.tag) {
      if (prevCustom && nextCustom) {
        this.updateAttributes(element, prev, next, path, renderingContext);
        element.innerHTML = '';
        this.createChildren(element, next, path, renderingContext);
      } else if (prevCustom || nextCustom) {
        this.view.destroyInnerViews(path, false);

        const newElement = this.createElementNode(next, path, renderingContext.setUpdating(false));

        element.replaceWith(newElement);
        if (renderingContext.isUpdating())
          this.attachElementNode(element, next, path, renderingContext);

        if (isRoot(path))
          this.element = newElement;
      } else {
        this.updateAttributes(element, prev, next, path, renderingContext);
        this.updateChildren(element, prev, next, path, renderingContext);
      }
    } else {
      this.view.destroyInnerViews(path, false);

      const newElement = this.createElementNode(next, path, renderingContext.setUpdating(false));
      element.replaceWith(newElement);
      if (renderingContext.isUpdating())
        this.attachElementNode(element, next, path, renderingContext);

      if (isRoot(path))
        this.element = newElement;
    }
  }

  /** @private */
  patchFromNodeToView(element, prev, next, path, renderingContext) {
    this.view.destroyInnerViews(path, false);
    const view = this.view.instantiateInnerView(next, path, renderingContext.setUpdating(false));

    let index;
    if (path.length > 0) index = path[path.length - 1];
    else index = Array.from(element.parentNode.childNodes).findIndex(n => n === element);

    const parent = element.parentNode;
    element.remove();
    if (renderingContext.isUpdating()) {
      const newElement = view.render();
      insertElement(parent, index, newElement);
      view.attach(newElement);
    } else throw new Error('Unreachable');

    if (isRoot(path))
      this.element = view.element;
  }

  /** @private */
  patchFromViewToNone(element, prev, path) {
    if (isRoot(path))
      throw new Error('Root element deleted during patch');

    this.view.destroyInnerView(path);
  }

  /** @private */
  patchFromViewToText(element, prev, next, path) {
    this.view.destroyInnerView(path, false);

    const newElement = this.renderingContext.getDocument().createTextNode(`${next}`);
    element.replaceWith(newElement);

    if (isRoot(path))
      this.element = newElement;
  }

  /** @private */
  patchFromViewToNode(element, prev, next, path, renderingContext) {
    this.view.destroyInnerView(path, false);

    const newElement = this.createElementNode(next, path, renderingContext.setUpdating(false));
    element.replaceWith(newElement);
    if (renderingContext.isUpdating())
      this.attachElementNode(element, next, path, renderingContext);

    if (isRoot(path))
      this.element = newElement;
  }

  /** @private */
  patchFromViewToView(element, prev, next, path, renderingContext) {
    if (prev === next)
      return;

    if (isSameViewNode(prev, next) && prev.attrs.key === next.attrs.key) {
      const view = this.view.getInstantiatedInnerView(path);
      view.update(next.attrs, next.children);
    } else {
      const parent = element.parentNode;

      let index;
      if (path.length > 0) index = path[path.length - 1];
      else index = Array.from(parent.childNodes).findIndex(n => n === element);

      this.view.destroyInnerView(path);
      const view = this.view.instantiateInnerView(next, path, renderingContext.setUpdating(false));

      element.remove();
      if (renderingContext.isUpdating()) {
        const newElement = view.render();
        insertElement(parent, index, newElement);
        view.attach(newElement);
      } else throw new Error('Unreachable');

      if (isRoot(path))
        this.element = view.element;
    }
  }

  /** @private */
  createNode(node, path, renderingContext) {
    if (isElementNode(node)) return this.createElementNode(node, path, renderingContext);
    else if (isViewNode(node)) return this.createViewNode(node, path, renderingContext);
    else if (isDomElement(renderingContext, node)) return node;
    else if (node === null || isTextNode(node)) return this.createTextNode(node);
  }

  /** @private */
  hydrateNode(element, node, path, renderingContext) {
    if (isElementNode(node)) return this.hydrateElementNode(element, node, path, renderingContext);
    else if (isViewNode(node)) return this.hydrateViewNode(element, node, path, renderingContext);
  }

  /** @private */
  attachNode(element, node, path, renderingContext) {
    if (isElementNode(node)) return this.attachElementNode(element, node, path, renderingContext);
    else if (isViewNode(node)) return this.attachViewNode(element, path);
  }

  /** @private */
  detachNode(element, node, path, renderingContext) {
    if (isElementNode(node)) return this.detachElementNode(element, node, path, renderingContext);
    else if (isViewNode(node)) return this.detachViewNode(element, path);
  }

  /** @private */
  createElementNode(node, path, renderingContext) {
    let isSvg = renderingContext.isSvg();
    let element;
    if (!isSvg && node.tag === 'svg') {
      renderingContext = renderingContext.setSvg(true);
      isSvg = true;
    }

    if (isSvg) element = renderingContext.getDocument().createElementNS('http://www.w3.org/2000/svg', node.tag);
    else element = renderingContext.getDocument().createElement(node.tag);

    this.addAttributes(element, node, path, renderingContext);
    this.createChildren(element, node, path, renderingContext);
    return element;
  }

  /** @private */
  hydrateElementNode(element, node, path, renderingContext) {
    let isSvg = renderingContext.isSvg();
    if (!isSvg && node.tag === 'svg') {
      renderingContext = renderingContext.setSvg(true);
      isSvg = true;
    }

    this.hydrateAttributes(element, node, path, renderingContext);
    this.hydrateChildren(element, node, path, renderingContext);
  }

  /** @private */
  attachElementNode(element, node, path, renderingContext) {
    let isSvg = renderingContext.isSvg();
    if (!isSvg && node.tag === 'svg') {
      renderingContext = renderingContext.setSvg(true);
      isSvg = true;
    }

    this.attachAttributes(element, node, path, renderingContext);
    this.attachChildren(element, node, path, renderingContext);
  }

  /** @private */
  detachElementNode(element, node, path, renderingContext) {
    let isSvg = renderingContext.isSvg();
    if (!isSvg && node.tag === 'svg') {
      renderingContext = renderingContext.setSvg(true);
      isSvg = true;
    }

    this.detachAttributes(element, node, path, renderingContext);
    this.detachChildren(element, node, path, renderingContext);
  }

  /** @private */
  createViewNode(node, path, renderingContext) {
    const view = this.view.instantiateInnerView(node, path, renderingContext.setUpdating(false));

    let element;
    if (renderingContext.isUpdating()) {
      element = view.render(this.document);
      view.attach(element);
    } else element = view.render(this.document);

    return element;
  }

  /** @private */
  hydrateViewNode(element, node, path, renderingContext) {
    const view = this.view.getOrInstantiateInnerView(node, path, renderingContext);
    return view.hydrate(element);
  }

  /** @private */
  attachViewNode(element, path) {
    const view = this.view.getInstantiatedInnerView(path);
    return view.attach(element);
  }

  /** @private */
  detachViewNode(element, path) {
    const view = this.view.getInstantiatedInnerView(path);
    view.unmount();
  }

  /** @private */
  createTextNode(node) {
    return this.renderingContext.getDocument().createTextNode(`${node != null ? node : ''}`);
  }

  /** @private */
  createChildren(element, node, path, renderingContext) {
    requireValidChildren(node);

    const nodesToAttach = [];
    if ('innerHtml' in node.attrs)
      element.innerHTML = node.attrs.innerHtml;
    else {
      // first create an entire child-tree and then append it to the container element
      const fragment = renderingContext.getDocument().createDocumentFragment();
      for (const ndx in node.children) {
        const child = node.children[ndx];
        if (child === null || (renderingContext.isInProduction() && child.isDevOnly))
          continue;

        const nextPath = path.concat([ndx]);
        const childElement = this.createNode(child, nextPath, renderingContext.setUpdating(false));
        fragment.appendChild(childElement);
        if (renderingContext.isUpdating())
          nodesToAttach.push({ element: childElement, node: child, path: nextPath });
      }

      if (node.children.length > 0) {
        const container = isTemplateElement(element) ? element.content : element;
        container.appendChild(fragment);

        for (const { element, node, path } of nodesToAttach) {
          if (isElementNode(node)) this.attachElementNode(element, node, path, renderingContext);
          else if (isViewNode(node)) this.attachViewNode(element, path);
        }
      }
    }
  }

  /** @private */
  hydrateChildren(element, node, path, renderingContext) {
    requireValidChildren(node, { noWarnKeys: true });

    if (isNodeCustomElement(node))
      return;

    const fragment = isTemplateElement(element) ? element.content : element;
    let shift = 0;
    if (!('innerHtml' in node.attrs)) {
      for (const ndx in node.children) {
        const child = node.children[ndx];
        if (child === null || (renderingContext.isInProduction() && child.isDevOnly)) {
          shift += 1;
          continue;
        }

        if (isNodeCustomElement(child))
          continue;

        const nextPath = path.concat([ndx]);
        const childNode = fragment.childNodes[ndx - shift];
        this.hydrateNode(childNode, child, nextPath, renderingContext);
      }
    }
  }

  /** @private */
  attachChildren(element, node, path, renderingContext) {
    requireValidChildren(node, { noWarnKeys: true });

    if (isNodeCustomElement(node))
      return;

    const fragment = isTemplateElement(element) ? element.content : element;
    let shift = 0;
    if (!('innerHtml' in node.attrs)) {
      for (const ndx in node.children) {
        const child = node.children[ndx];
        if (child === null || (renderingContext.isInProduction() && child.isDevOnly)) {
          shift += 1;
          continue;
        }

        if (isNodeCustomElement(child))
          continue;

        const nextPath = path.concat([ndx]);
        const childNode = fragment.childNodes[ndx - shift];
        this.attachNode(childNode, child, nextPath, renderingContext);
      }
    }
  }

  /** @private */
  detachChildren(element, node, path, renderingContext) {
    if (isNodeCustomElement(node))
      return;

    const fragment = isTemplateElement(element) ? element.content : element;
    let shift = 0;
    if (!('innerHtml' in node.attrs)) {
      for (const ndx in node.children) {
        const child = node.children[ndx];
        if (child === null || (renderingContext.isInProduction() && child.isDevOnly)) {
          shift += 1;
          continue;
        }

        if (isNodeCustomElement(child))
          continue;

        const nextPath = path.concat([ndx]);
        const childNode = fragment.childNodes[ndx - shift];
        this.detachNode(childNode, child, nextPath, renderingContext);
      }
    }
  }

  /** @private */
  updateChildren(element, prev, next, path, renderingContext) {
    if (prev === next)
      return;

    requireValidChildren(next);

    if ('innerHtml' in next.attrs)
      element.innerHTML = next.attrs.innerHtml;
    else {
      if (next.tag === 'svg' && !renderingContext.isSvg())
        renderingContext = renderingContext.setSvg(true);

      const len = Math.max(prev.children.length, next.children.length);
      let nodeIndexShift = 0;
      for (let ndx = 0; ndx < len; ndx++) {
        let prevChild = prev.children[ndx];
        let nextChild = ndx in next.children ? next.children[ndx] : null;
        if (renderingContext.isInProduction()) {
          if (prevChild != null && nextChild != null && prevChild.isDevOnly && nextChild.isDevOnly)
            continue;
          else if (prevChild != null && prevChild.isDevOnly)
            prevChild = null;
          else if (nextChild != null && nextChild.isDevOnly)
            nextChild = null;
        }

        const nextPath = path.concat([ndx]);
        if (prevChild != null) {
          const childNode = element.childNodes[ndx - nodeIndexShift];
          this.patch(childNode, prevChild, nextChild, nextPath, renderingContext);
          if (nextChild == null)
            nodeIndexShift += 1;
        } else {
          if (nextChild != null) {
            const childElement = this.createNode(nextChild, nextPath, renderingContext.setUpdating(false));
            const fragment = isTemplateElement(element) ? element.content : element;
            const before = fragment.childNodes[ndx];
            fragment.insertBefore(childElement, before);
            if (renderingContext.isUpdating()) {
              if (isElementNode(nextChild)) this.attachElementNode(childElement, nextChild, nextPath, renderingContext);
              else if (isViewNode(nextChild)) this.attachViewNode(childElement, nextPath);
            }
          } else nodeIndexShift += 1;
        }
      }
    }
  }

  /** @private */
  addAttributes(element, node, path, renderingContext) {
    for (const name in node.attrs) {
      if (name === 'innerHtml' || name === 'ignoreKeys')
        continue;

      const value = node.attrs[name];
      this.addAttribute(element, name, value, path, renderingContext);
    }
  }

  /** @private */
  hydrateAttributes(element, node, path, renderingContext) {
    if (!('style' in node.attrs))
      element.removeAttribute('style');

    for (const name in node.attrs) {
      if (name === 'innerHtml' || name === 'ignoreKeys')
        continue;

      const value = node.attrs[name];
      this.hydrateAttribute(element, name, value, path, renderingContext);
    }
  }

  /** @private */
  attachAttributes(element, node, path, renderingContext) {
    for (const name in node.attrs) {
      if (name === 'innerHtml' || name === 'ignoreKeys')
        continue;

      const value = node.attrs[name];
      if (!this.isDeferElementAttach) this.attachAttribute(element, name, value, path, renderingContext);
      else this.attachQueue.push({ element, name, value, path, renderingContext });
    }
  }

  /** @private */
  detachAttributes(element, node, path, renderingContext) {
    for (const name in node.attrs) {
      if (name === 'innerHtml' || name === 'ignoreKeys')
        continue;

      const value = node.attrs[name];
      this.detachAttribute(element, name, value, path, renderingContext);
    }
  }

  /** @private */
  addAttribute(element, name, value, path, renderingContext) {
    if (name === 'style') {
      for (const prop in value)
        this.setStyleProp(element, prop, value[prop] || '');
    } else if (value instanceof Function)
      this.addEventListener(element, path, normalizeEventName(name), value);
    else if (name === 'data' && value != null && typeof value === 'object') {
      for (const key in value)
        element.dataset[key] = value[key];
    } else if (name !== 'focus' && name in element && !renderingContext.isSvg() && value != null)
      element[name] = value;
    else if (typeof value === 'boolean') {
      if (name !== 'focus') element.setAttribute(name, name);
    } else if (value != null) element.setAttribute(name !== 'htmlFor' ? name : 'for', value);
  }

  /** @private */
  hydrateAttribute(element, name, value, path, renderingContext) {
    if (name === 'style') {
      element.removeAttribute('style');
      for (const prop in value)
        this.setStyleProp(element, prop, value[prop] || '');
    } else if (value instanceof Function)
      this.addEventListener(element, path, normalizeEventName(name), value);
    else if (name === 'data' && value != null && typeof value === 'object') {
      for (const key in value)
        element.dataset[key] = value[key];
    }
  }

  /** @private */
  attachAttribute(element, name, value, path, renderingContext) {
    if (name === 'focus' && element.focus && element.blur) {
      if (value) element.focus();
      else element.blur();
    }
  }

  /** @private */
  detachAttribute(element, name, value, path, renderingContext) {
    if (value instanceof Function) {
      const event = normalizeEventName(name);
      this.removeEventListener(element, path, event);
    }
  }

  /** @private */
  updateAttributes(element, prev, next, path, renderingContext) {
    if (prev === next)
      return;

    for (const name in next.attrs) {
      if (name === 'innerHtml' || name === 'ignoreKeys')
        continue;

      const nextValue = next.attrs[name];
      if (name in prev.attrs) {
        const prevValue = prev.attrs[name];
        this.updateAttribute(element, name, prevValue, nextValue, path, renderingContext);
      } else this.addAttribute(element, name, nextValue, path, renderingContext);
    }

    for (const name in prev.attrs) {
      if (name === 'innerHtml' || name === 'ignoreKeys')
        continue;

      if (!(name in next.attrs))
        this.removeAttribute(element, name, prev.attrs[name], path, renderingContext);
    }
  }

  /** @private */
  updateAttribute(element, name, prev, next, path, renderingContext) {
    if (prev === next)
      return;

    const nextFunction = next instanceof Function;
    const prevFunction = prev instanceof Function;
    if (name === 'style') {
      for (const prop in prev) {
        if (!(prop in next))
          this.removeStyleProp(element, prop);
      }

      for (const prop in next) {
        const style = next[prop] || '';
        this.setStyleProp(element, prop, style);
      }
    } else if (nextFunction || prevFunction) {
      if (nextFunction && prevFunction) {
        if (next !== prev)
          this.updateEventListener(path, normalizeEventName(name), next);
      } else if (nextFunction) {
        this.removeAttribute(element, name, prev, path, renderingContext);
        this.addEventListener(element, path, normalizeEventName(name), next);
      } else if (prevFunction) {
        this.removeEventListener(element, path, normalizeEventName(name));
        this.addAttribute(element, name, next, path, renderingContext);
      }
    } else if (name === 'data') {
      const prevObject = prev != null && typeof prev === 'object';
      const nextObject = next != null && typeof next === 'object';
      if (prevObject && nextObject) {
        for (const key in prev) {
          if (!(key in next))
            delete element.dataset[key];
        }

        for (const key in next)
          element.dataset[key] = next[key];
      } else if (prevObject && !nextObject) {
        for (const key in element.dataset)
          delete element.dataset[key];
      } else if (!prevObject && nextObject) {
        for (const key in next)
          element.dataset[key] = next[key];
      }
    } else if (name !== 'focus' && name in element && !renderingContext.isSvg())
      element[name] = next;
    else if (typeof prev === 'boolean') {
      if (name === 'focus') {
        if (element.focus && element.blur) {
          if (next) element.focus();
          else element.blur();
        }
      } else {
        if (next) element.setAttribute(name, name);
        else element.removeAttribute(name);
      }
    } else {
      if (next != null) element.setAttribute(name !== 'htmlFor' ? name : 'for', next);
      else if (prev != null) element.removeAttribute(name !== 'hmtlFor' ? name : 'for');
    }
  }

  /** @private */
  removeAttribute(element, name, prev, path, renderingContext) {
    if (name === 'style')
      element.removeAttribute('style');
    else if (prev instanceof Function) {
      const event = normalizeEventName(name);
      this.removeEventListener(element, path, event);
    } else if (name === 'data' && prev != null && typeof prev === 'object') {
      for (const key in element.dataset)
        delete element.dataset[key];
    } else if (name !== 'focus' && name in element && !renderingContext.isSvg())
      element[name] = undefined;
    else if (typeof prev === 'boolean') {
      if (name === 'focus' && element.blur)
        element.blur();
      else element.removeAttribute(name);
    } else if (prev != null) element.removeAttribute(name !== 'hmtlFor' ? name : 'for');
  }

  /** @private */
  setStyleProp(element, prop, style) {
    if (prop[0] === '-') {
      const importantNdx = style.indexOf('!important');
      let clearedStyle = style;
      if (importantNdx !== -1)
        clearedStyle = importantNdx !== style.slice(0, importantNdx) + style.slice(importantNdx + 10);

      clearedStyle = clearedStyle.trim().replace(/;$/, '');
      element.style.setProperty(prop, clearedStyle);
    } else element.style[prop] = style;
  }

  /** @private */
  removeStyleProp(element, prop) {
    if (prop[0] === '-') element.style.removeProperty(prop);
    else
      delete element.style[prop];
  }

  /** @private */
  addEventListener(element, path, event, listener) {
    const delegate = this.createEventListenerDelegate(listener, path, event);

    if (element.addEventListener)
      element.addEventListener(event, delegate);
    else if (element.attachEvent)
      element.attachEvent(toOnEventName(event), delegate);
    else {
      const listeners = (element[event] && element[event].listeners) || [];

      if (element[event] != null)
        element[event].listeners = listeners.concat([delegate]);
      else {
        const handler = (...args) =>
          element[event].listeners.map(f => f(...args));
        handler.listeners = listeners.concat([delegate]);
        element[event] = handler;
      }
    }
  }

  /** @private */
  updateEventListener(path, event, listener) {
    this.updateEventListenerDelegate(listener, path, event);
  }

  /** @private */
  removeEventListener(element, path, event) {
    const delegate = this.getEventListenerDelegate(path, event);
    this.removeEventListenerDelegate(path, event);

    if (element.removeEventListener)
      element.removeEventListener(event, delegate);
    else if (element.detachEvent)
      element.detachEvent(toOnEventName(event), delegate);
    else {
      if (element[event] != null && element[event].listeners != null)
        element[event].listeners = element[event].listener.filter(l => l !== delegate);
    }
  }

  /** @private */
  getEventListenerDelegate(path, name) {
    const key = Renderer.getAttrKey(path, name);
    return this.eventListenerDelegates.get(key);
  }

  /** @private */
  hasEventListenerDelegate(path, name) {
    const key = Renderer.getAttrKey(path, name);
    return this.eventListenerDelegates.has(key);
  }

  /** @private */
  createEventListenerDelegate(action, path, name) {
    const key = Renderer.getAttrKey(path, name);
    this.eventListeners.set(key, action);

    const delegate = (...args) => {
      const listener = this.eventListeners.get(key);
      if (listener == null)
        throw new Error('Event listener not found');

      listener(...args);
    };
    this.eventListenerDelegates.set(key, delegate);
    return delegate;
  }

  /** @private */
  updateEventListenerDelegate(action, path, name) {
    const key = Renderer.getAttrKey(path, name);
    this.eventListeners.set(key, action);
  }

  /** @private */
  removeEventListenerDelegate(path, name) {
    const key = Renderer.getAttrKey(path, name);
    this.eventListenerDelegates.delete(key);
    this.eventListeners.delete(key);
  }
}

// for debuging renderer calls
// for (const k of Object.getOwnPropertyNames(Renderer.prototype)) {
//   const buff = Renderer.prototype[k]
//   Renderer.prototype[k] = function (...args) {
//     console.log(k, args)
//     return buff.apply(this, args)
//   }
// }

export default Renderer;
