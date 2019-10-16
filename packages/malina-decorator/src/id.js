import { isElementNode, h, isDevelopment, getGlobal, mapTemplate, withContext, getContext, isViewNode, withState } from 'malina';
import { compose, Random } from 'malina-util';

const ctxKey = Symbol.for('__malina_ids.ctx');
const stateKey = Symbol.for('__malina_ids.state');
const randomKey = Symbol.for('__malina-decorator.id.random');

const global_ = getGlobal();
let random;
if (global_ != null && randomKey in global_) random = global_[randomKey];
else {
  random = new Random('malina-decorator.id-seed');
  if (global_ != null)
    global_[randomKey] = random;
}

const mapIdTemplate = (options, ctx) => node => {
  if (ctx == null)
    return node;

  if (Array.isArray(node))
    return node.map(mapIdTemplate(options, ctx.ids));
  else if (isElementNode(node) || (options.views && isViewNode(node))) {
    let nextAttrs = node.attrs;
    const realIdName = `${options.realPrefix}Id`;
    const realForName = `${options.realPrefix}For`;

    const replaceAttributes = [];
    if (realIdName in node.attrs) {
      const id = node.attrs[realIdName];
      nextAttrs = { ...node.attrs, id };
      delete nextAttrs[realIdName];
    } else if ('id' in node.attrs)
      replaceAttributes.push('id');

    if (realForName in node.attrs) {
      const fr = node.attrs[realForName];
      nextAttrs = { ...node.attrs, for: fr };
      delete nextAttrs[realForName];
    } else if ('for' in node.attrs)
      replaceAttributes.push('for');

    for (const replace of replaceAttributes) {
      const passed = node.attrs[replace];
      nextAttrs = { ...node.attrs };
      if (passed in ctx.ids)
        nextAttrs[replace] = ctx.ids[passed];
      else {
        let randomId;
        if (isDevelopment) {
          let id = ++ctx.ref.id;
          randomId = `${id}`;
          while (randomId.length < options.length)
            randomId = `0${randomId}`;
        } else randomId = random.id(options.length);

        const generated = `${passed}_${randomId}`;
        ctx.ids[passed] = generated;
        nextAttrs[replace] = generated;
      }
    }

    return h(node.tag, nextAttrs, node.children.map(mapIdTemplate(options, ctx)));
  } else return node;
};

const getOptions = (options = {}) => ({
  length: options.length || 4,
  realPrefix: options.realPrefix || 'html',
  views: options.views || false
});

export const withUniqIds = options =>
  compose(
    getContext(ctx => ctxKey in ctx ? { [ctxKey]: ctx[ctxKey] } : {}),
    withContext(({ state }) => {
      if (!(ctxKey in state)) {
        const context = { id: 0 };
        state[ctxKey] = context;
        return { [ctxKey]: context };
      } else return {};
    }),
    withState(() => ({
      [stateKey]: {
        ids: {}
      }
    })),
    mapTemplate(original => view =>
      mapIdTemplate(getOptions(options), { ref: view.state[ctxKey], ids: view.state[stateKey].ids })(original())
    )
  );
