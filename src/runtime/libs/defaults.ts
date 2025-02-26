export const defaultProps = {
  ui: {
    accordion: {
      items: [{
        label: 'Getting Started',
        icon: 'i-lucide-info',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed neque elit, tristique placerat feugiat ac, facilisis vitae arcu. Proin eget egestas augue. Praesent ut sem nec arcu pellentesque aliquet. Duis dapibus diam vel metus tempus vulputate.'
      }, {
        label: 'Installation',
        icon: 'i-lucide-download',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed neque elit, tristique placerat feugiat ac, facilisis vitae arcu. Proin eget egestas augue. Praesent ut sem nec arcu pellentesque aliquet. Duis dapibus diam vel metus tempus vulputate.'
      }, {
        label: 'Theming',
        icon: 'i-lucide-pipette',
        content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed neque elit, tristique placerat feugiat ac, facilisis vitae arcu. Proin eget egestas augue. Praesent ut sem nec arcu pellentesque aliquet. Duis dapibus diam vel metus tempus vulputate.'
      }]
    },
    alert: { title: 'Heads up!' },
    avatar: { src: 'https://avatars.githubusercontent.com/u/739984?v=4', alt: 'Benjamin Canac' },
    badge: { label: 'Badge' },
    button: { label: 'Click me!' },
    breadcrumb: {
      items: [
        { label: 'Home', to: '/' },
        {
          slot: 'dropdown',
          icon: 'i-lucide-ellipsis',
          children: [{
            label: 'Documentation'
          }, {
            label: 'Themes'
          }, {
            label: 'GitHub'
          }]
        }, {
          label: 'Components',
          disabled: true
        }, {
          label: 'Breadcrumb',
          to: '/components/breadcrumb'
        }
      ]
    },
    checkbox: { label: 'Check me!' },
    icon: { name: 'lucide:rocket' },
    formField: { label: 'Label' },
    inputMenu: { items: ['Option 1', 'Option 2', 'Option 3'] },
    kbd: { value: 'K' },
    navigationMenu: {
      items: [
        [{
          label: 'Documentation',
          icon: 'i-lucide-book-open',
          badge: 10,
          children: [{
            label: 'Introduction',
            description: 'Fully styled and customizable components for Nuxt.',
            icon: 'i-lucide-house'
          }, {
            label: 'Installation',
            description: 'Learn how to install and configure Nuxt UI in your application.',
            icon: 'i-lucide-cloud-download'
          }, {
            label: 'Theming',
            description: 'Learn how to customize the look and feel of the components.',
            icon: 'i-lucide-swatch-book'
          }, {
            label: 'Shortcuts',
            description: 'Learn how to display and define keyboard shortcuts in your app.',
            icon: 'i-lucide-monitor'
          }]
        }, {
          label: 'GitHub',
          icon: 'i-simple-icons-github',
          to: 'https://github.com/nuxt/ui',
          target: '_blank'
        }, {
          label: 'Help',
          icon: 'i-lucide-circle-help',
          disabled: true
        }]
      ]
    },
    select: { defaultValue: 'Option 1', items: ['Option 1', 'Option 2', 'Option 3'] },
    selectMenu: { items: ['Option 1', 'Option 2', 'Option 3'] },
    switch: { label: 'Switch me!' },
    pagination: { total: 50 },
    radioGroup: { items: ['Option 1', 'Option 2', 'Option 3'] },
    tabs: {
      items: [{
        label: 'Tab 1',
        avatar: { src: 'https://avatars.githubusercontent.com/u/739984?v=4' },
        content: 'This is the content shown for Tab 1'
      }, {
        label: 'Tab 2',
        icon: 'i-lucide-user',
        content: 'And, this is the content for Tab 2'
      }, {
        label: 'Tab 3',
        icon: 'i-lucide-bell',
        content: 'Finally, this is the content for Tab 3'
      }]
    },
    tooltip: { text: 'Tooltip' },
    tree: {
      items: [
        {
          label: 'app',
          icon: 'i-lucide-folder',
          defaultExpanded: true,
          children: [{
            label: 'composables',
            icon: 'i-lucide-folder',
            defaultExpanded: true,
            children: [
              { label: 'useAuth.ts', icon: 'vscode-icons:file-type-typescript' },
              { label: 'useUser.ts', icon: 'vscode-icons:file-type-typescript' }
            ]
          },
          {
            label: 'components',
            icon: 'i-lucide-folder',
            children: [
              {
                label: 'Home',
                icon: 'i-lucide-folder',
                children: [
                  { label: 'Card.vue', icon: 'vscode-icons:file-type-vue' },
                  { label: 'Button.vue', icon: 'vscode-icons:file-type-vue' }
                ]
              }
            ]
          }]
        },
        { label: 'app.vue', icon: 'vscode-icons:file-type-vue' },
        { label: 'nuxt.config.ts', icon: 'vscode-icons:file-type-nuxt' }
      ]
    }
  }
}
