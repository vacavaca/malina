import hljs from 'highlight.js/lib/highlight'

export const handleElement = element => state => {
  state.element = element
}

export const highlight = () => state => {
  if (state.element != null) {
    const blocks = state.element.querySelectorAll('pre')
    for (const block of blocks)
      hljs.highlightBlock(block)
  }
}
