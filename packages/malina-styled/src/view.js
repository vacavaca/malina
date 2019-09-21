import { h, view } from 'malina';
import { memoize } from 'malina-util';
import withStyledTemplate from './decorator';
import { Style } from './style';

const PARSE_MEM_LENGTH = 1000;

const styledView = (tag, factory) => {
  let innerNode = null;
  const declaration = view(
    withStyledTemplate(({ state, children }) => {
      if (innerNode == null)
        innerNode = styledView(tag, factory);

      return h(innerNode, state, children);
    })
  );

  declaration.isStyled = true;
  declaration.tag = tag;
  declaration.factory = factory;
  declaration.parse = memoize(Style.parse, PARSE_MEM_LENGTH);
  return declaration;
};

export default styledView;
