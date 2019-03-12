export const handleScroll = () => () => ({
  offset: Math.max(0, (window.pageYOffset || document.scrollTop) - (document.clientTop || 0) - 100 + 24) || 0
})
