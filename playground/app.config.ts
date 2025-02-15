export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
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
