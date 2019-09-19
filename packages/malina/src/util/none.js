import { Declaration } from '../vdom'

/**
 * View with empty text node
 *
 * @example
 * <None />
 *
 * @example
 * const mount = () => {
 *   // ...
 * }
 *
 * withLifecycle({ mount })(None)
 */
export default new Declaration(null)
