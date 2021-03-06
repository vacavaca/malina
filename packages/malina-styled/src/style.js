import Stylis from 'stylis';
import parse from './parser';

const numToStrPad = (max, n) => {
  let str = '';
  for (let i = 0; i < `${max}`.length - `${n}`.length; i++) str += '0';
  str += `${n}`;
  return str;
};

export class Style {
  constructor(parentSelector, selector, rules, parsedRule, order) {
    this.parentSelector = parentSelector;
    this.selector = selector.trim();
    this.rules = rules.trim();
    this.parsedRule = parsedRule;
    this.atRuleIdentifier = null;
    this.atRule = null;

    if (this.selector.startsWith('@')) {
      const atRuleRegex = /@(\S*)\s+(.*)\s*(;|{|$)/g;

      const match = atRuleRegex.exec(this.selector);
      this.atRuleIdentifier = match[1];
      this.atRule = match[2];
    }

    this.id = `${order}${this.isAtRule() ? `${this.parentSelector}${this.selector}` : `${this.selector}`}`;
  }

  static parse(className, css) {
    const stylis = new Stylis({
      global: true,
      cascade: true,
      keyframe: true,
      prefix: true,
      compress: true,
      preserve: false
    });
    const preprocessed = stylis(`.${className}`, css);
    const rules = parse(preprocessed);

    return rules
      .map((rule, i) => new Style(className, rule.selector, rule.getStyle(), rule, numToStrPad(rules.length, i)));
  }

  isAtRule() {
    return this.atRuleIdentifier != null;
  }

  isMedia() {
    return this.atRuleIdentifier === 'media';
  }

  toString() {
    return `${this.selector}{${this.rules}}`;
  }
}

export class StyleList {
  constructor() {
    this.list = [];
    this.selectors = {};
  }

  add(style) {
    this.list.push(style);
    if (!(style.selector in this.selectors))
      this.selectors[style.selector] = [];
    this.selectors[style.selector].push(style);
  }

  addAll(list) {
    for (const style of list)
      this.add(style);
  }

  has(selector) {
    return selector in this.selectors;
  }

  [Symbol.iterator]() {
    return this.list[Symbol.iterator]();
  }
}
