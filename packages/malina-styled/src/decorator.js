import { h, isViewNode, isElementNode, compose, getContext, withContext, mapTemplate, withLifecycle, withState, withTemplate } from 'malina';
import Injector from './dom/injector';
import hash from './hash';
import { StyleList } from './style';

const injectorKey = Symbol.for('__malina_styled.injector');
const stylesKey = Symbol.for('__malina_styled.list');
const originalStylesKey = Symbol.for('__malina_styled.original');

const provideContext = compose(
  getContext(ctx => injectorKey in ctx ? { [injectorKey]: ctx[injectorKey] } : {}),
  withContext(({ state }) => {
    if (!(injectorKey in state)) {
      const injector = new Injector();
      state[injectorKey] = injector;
      return { [injectorKey]: injector };
    }

    return {};
  })
);

const noConflictClassName = (originalStyles, className, css) => {
  let resolved = className;
  let i = 1;
  while (resolved in originalStyles && originalStyles[resolved] !== css) {
    resolved = `${className}_${i}`;
    i += 1;
  }

  return resolved;
};

const attributesForFactory = attrs => {
  const next = {};
  for (const key in attrs)
    next[key[0] === '$' && key[1] !== '$' ? key.slice(1) : key] = attrs[key];
  return next;
};

const attributesForElement = attrs => {
  const next = {};
  for (const key in attrs) {
    if (key[0] === '$' && key[1] === '$') next[key.slice(1)] = attrs[key];
    else if (key[0] !== '$') next[key] = attrs[key];
  }
  return next;
};

const base58Alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

const base58 = num => {
  var encoded = '';
  while (num) {
    var remainder = num % 58;
    num = Math.floor(num / 58);
    encoded = base58Alphabet[remainder].toString() + encoded;
  }

  return encoded;
};

const mapNode = (styleList, originalStyles) => node => {
  if (isViewNode(node)) {
    if (node.tag.isStyled) {
      const css = node.tag.factory(attributesForFactory(node.attrs));
      if (css.length === 0) {
        const attrs = attributesForElement(node.attrs);
        return h(node.tag.tag, attrs, node.children.map(mapNode(styleList, originalStyles)));
      }

      const hashValue = hash(css);
      const className = noConflictClassName(originalStyles, `v${node.tag.id}_${base58(hashValue)}`, css);

      if (!(className in originalStyles)) {
        originalStyles[className] = css;
        const styles = node.tag.parse(className, css);
        styleList.addAll(styles);
      }

      const attrs = attributesForElement(node.attrs);
      attrs.class = [attrs.class || '', className].filter(c => c.length > 0).join(' ');
      return h(node.tag.tag, attrs, node.children.map(mapNode(styleList, originalStyles)));
    } else return h(node.tag, node.attrs, node.children.map(mapNode(styleList, originalStyles)));
  } else if (isElementNode(node))
    return h(node.tag, node.attrs, node.children.map(mapNode(styleList, originalStyles)));
  else return node;
};

const mapStyledTemplate = mapTemplate(original => ({ state }) => {
  const node = original();
  state[originalStylesKey] = {};
  state[stylesKey] = new StyleList();
  return mapNode(state[stylesKey], state[originalStylesKey])(node);
});

const initializeStyleMap = withState(props => ({ [stylesKey]: new StyleList(), [originalStylesKey]: {} }));

const initializeInjector = withLifecycle({
  mount: view => {
    const injector = view.state[injectorKey];
    injector.mount(view, view.element.ownerDocument);
    injector.update(view, view.state[stylesKey]);
  },

  update: view => {
    const injector = view.state[injectorKey];
    if (!injector.isMounted(view))
      return;
    injector.update(view, view.state[stylesKey]);
  },

  destroy: view => {
    const injector = view.state[injectorKey];
    if (!injector.isMounted(view))
      return;
    injector.destroy(view);
  }
});

export default template => compose(
  initializeStyleMap,
  withTemplate(template),
  mapStyledTemplate,
  provideContext,
  initializeInjector
);
