const delimiter = '-'

const getElementName = (block, element) => {
  if (element != null) return `${block}${delimiter}${element}`
  else return block
}

const getModifiers = modifiers => {
  if (Array.isArray(modifiers))
    return modifiers.reduce((a, modifier) => ({ [modifier]: true }), {})
  else if (typeof modifiers === 'string')
    return getModifiers(modifiers.split(' '))
  else return modifiers
}

const classNames = (name, modifiers) =>
  [name, ...Object.keys(modifiers)
    .filter(k => !!modifiers[k])
    .map(k => `${name}${delimiter.repeat(2)}${k}`)]
    .filter(c => !!c).join(' ')

const elementStep = (block, ...args) => {
  if (args.length === 1) {
    const [arg] = args
    if (typeof arg === 'string')
      return getElementName(block, arg)
    else return classNames(block, getModifiers(arg))
  } else if (args.length === 2) {
    const [element, modifiers] = args
    return classNames(getElementName(block, element), getModifiers(modifiers))
  } else throw new Error('Unrecognized arguments')
}

export default (...args) => {
  if (args.length === 1) {
    const [block] = args
    return (...args) => elementStep(block, ...args)
  } else
    return elementStep(...args)
}
