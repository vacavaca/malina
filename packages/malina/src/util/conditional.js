import { Declaration } from '../vdom'

/**
 * Returns "left" if "test" condition is true, returns "right" overwise
 *
 * @example
 * template(({ state }) =>
 *   <div>
 *     {branch(state.sayHello, "Hello", "Goodbye")}
 *   </div>
 * )
 *
 * @param {*} test condition
 * @param {*} left left-hand side
 * @param {*} right right-hand side
 */
export const branch = (test, left, right = null) => test ? left : right

/**
 * Shows children when "when" prop is true
 *
 * @example
 * template(({ state }) =>
 *   <div>
 *     <Show when={state.sayHello}>Hello</Show>
 *     <Show when={!state.sayHello}>Goodbye</Show>
 *   </div>
 * )
 */
export const Show = new Declaration(({ state: { when = false }, children }) => branch(when, children, null))

/**
 * Hides children when "when" prop is true
 *
 * @example
 * template(({ state }) =>
 *   <div>
 *     <Hide when={!state.sayHello}>Hello</Hide>
 *     <Hide when={state.sayHello}>Goodbye</Hide>
 *   </div>
 * )
 */
export const Hide = new Declaration(({ state: { when = true }, children }) => branch(when, null, children))
