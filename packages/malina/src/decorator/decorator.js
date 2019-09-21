import { Declaration, Node, h } from '../vdom';
import { genGlobalUniqId } from '../env';

const isValidToWrapView = value =>
  value === null ||
  Node.isNode(value) ||
  (typeof value !== 'object' && Object.getPrototypeOf(value) === Function.prototype);

const updateDecoratorsHistory = (key, next) =>
  Declaration.isViewDeclaration(next) && next.decorateWith(key);

/**
 * Create new view decorator
 *
 * View decorator is a simple function that accepts view declrations
 * and returns a new view declaration, this method provides more
 * convinient interface and some optimisations for creating decorator
 * functions.
 *
 * ### Notes:
 *   * Decorators created with this function must be idempotent i.e. applying
 * the same decorator twice leads to the same result as if it was applied
 * only once.
 *   * It's usually easier to create new decorators using a composition of
 * other decorators provided in this package.
 *
 * @example
 * const mapState = mapper => decorator(View =>
 *   template(({ state, children }) => h(View, mapper(state), children))
 * )
 *
 * @method
 * @name decorator
 * @param {Object} fn decorator function
 * @returns {Function} decorator function
 */
export default fn => {
  const key = genGlobalUniqId('decorator', 8);

  return Inner => {
    let innerView;
    if (Declaration.isViewDeclaration(Inner)) innerView = Inner;
    else if (typeof Inner === 'string') innerView = new Declaration(({ state, children }) => h(Inner, state, children));
    else if (isValidToWrapView(Inner)) innerView = new Declaration(Inner);
    else throw new Error('Nothing to decorate');

    if (innerView.decorators[key])
      return innerView;

    let decorated = fn(innerView);
    if (!Declaration.isViewDeclaration(decorated)) {
      if (isValidToWrapView(decorated))
        decorated = new Declaration(decorated);
      else return updateDecoratorsHistory(key, decorated);
    }

    if (innerView.originalId != null)
      decorated.originalId = innerView.originalId;
    else
      decorated.originalId = innerView.id;

    return updateDecoratorsHistory(key, decorated);
  };
};
