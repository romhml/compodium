export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
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
