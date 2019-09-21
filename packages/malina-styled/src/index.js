import { view } from 'malina';
import withStyledTemplate from './decorator';

export { default as withStyledTemplate } from './decorator';
export { default as styled } from './constructor';

export const styledTemplate = (...args) => view(
  withStyledTemplate(...args)
);

export const only = (...args) => state => {
  const test = args[0] instanceof Function ? args[0](state) : state[args[0]];
  if (args.length === 2) return test ? args[1] : '';
  else if (args.length === 3) return test === args[1] ? args[2] : '';
  else return '';
};
