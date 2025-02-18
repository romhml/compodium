export default defineAppConfig({
  ui: {
    colors: {
      primary: 'neutral',
      neutral: 'zinc'
    }
  },

  compodium: {
    defaultProps: {
      components: {
        baseButton: {
          label: 'Click me!'
        }
      }
    }
  }
})
