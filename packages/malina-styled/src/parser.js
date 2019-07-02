class Rule {
  constructor(selector) {
    this.selector = selector
    this.rules = []
    this.style = null
  }

  getStyle() {
    if (this.style !== null) return this.style
    else return this.rules.map(rule => `${rule.selector}{${rule.style}}`).join('')
  }

  setStyle(style) {
    this.style = style
    return this
  }
}

const START_BLOCK = '{'
const END_BLOCK = '}'

export default css => {
  const sheet = []
  let start = 0
  let currentRule = null
  let selector = null
  for (let i = 0; i < css.length; i++) {
    const token = css[i]
    if (token === START_BLOCK) {
      if (selector === null) selector = css.slice(start, i).trim()
      else {
        const rule = new Rule(selector)
        sheet.push(rule)
        currentRule = rule
        selector = css.slice(start, i).trim()
      }

      start = i + 1
    } else if (token === END_BLOCK) {
      if (selector !== null) {
        const style = css.slice(start, i).trim()
        const rule = new Rule(selector).setStyle(style)

        if (currentRule !== null)
          currentRule.rules.push(rule)
        else sheet.push(rule)

        selector = null
      } else currentRule = null

      start = i + 1
    }
  }
  return sheet
}
