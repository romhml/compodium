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
        disabled: true,
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
    contextMenu: {
      items: [
        [{
          label: 'My account',
          avatar: {
            src: 'https://avatars.githubusercontent.com/u/739984?v=4'
          }
        }],
        [{
          label: 'Appearance',
          children: [{
            label: 'System',
            icon: 'i-lucide-monitor'
          }, {
            label: 'Light',
            icon: 'i-lucide-sun'
          }, {
            label: 'Dark',
            icon: 'i-lucide-moon'
          }]
        }],
        [{
          label: 'Show Sidebar',
          kbds: ['meta', 'S']
        }, {
          label: 'Show Toolbar',
          kbds: ['shift', 'meta', 'D']
        }, {
          label: 'Collapse Pinned Tabs',
          disabled: true
        }], [{
          label: 'Refresh the Page'
        }, {
          label: 'Clear Cookies and Refresh'
        }, {
          label: 'Clear Cache and Refresh'
        }, {
          type: 'separator'
        }, {
          label: 'Developer',
          children: [[{
            label: 'View Source',
            kbds: ['option', 'meta', 'U']
          }, {
            label: 'Developer Tools',
            kbds: ['option', 'meta', 'I']
          }], [{
            label: 'Inspect Elements',
            kbds: ['option', 'meta', 'C']
          }], [{
            label: 'JavaScript Console',
            kbds: ['option', 'meta', 'J']
          }]]
        }]
      ]
    },
    dropdownMenu: {
      items: [
        [{
          label: 'My account',
          avatar: {
            src: 'https://avatars.githubusercontent.com/u/739984?v=4'
          },
          type: 'label'
        }], [{
          label: 'Profile',
          icon: 'i-lucide-user',
          slot: 'custom'
        }, {
          label: 'Billing',
          icon: 'i-lucide-credit-card',
          kbds: ['meta', 'b']
        }, {
          label: 'Settings',
          icon: 'i-lucide-cog',
          kbds: ['?']
        }], [{
          label: 'Invite users',
          icon: 'i-lucide-user-plus',
          children: [[{
            label: 'Invite by email',
            icon: 'i-lucide-send-horizontal'
          }, {
            label: 'Invite by link',
            icon: 'i-lucide-link',
            kbds: ['meta', 'i']
          }]]
        }],
        [{
          label: 'GitHub',
          icon: 'i-simple-icons-github',
          to: 'https://github.com/nuxt/ui',
          target: '_blank'
        }, {
          label: 'Support',
          icon: 'i-lucide-life-buoy',
          to: '/components/dropdown-menu'
        }]
      ]
    },
    icons: { name: 'lucide:rocket' },
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
        label: 'Tab1',
        avatar: { src: 'https://avatars.githubusercontent.com/u/739984?v=4' },
        content: 'This is the content shown for Tab1'
      }, {
        label: 'Tab2',
        icon: 'i-lucide-user',
        content: 'And, this is the content for Tab2'
      }, {
        label: 'Tab3',
        icon: 'i-lucide-bell',
        content: 'Finally, this is the content for Tab3'
      }]
    },
    tooltip: { text: 'Hello world!' },
    tree: {
      items: [
        {
          label: 'app',
          icon: 'i-lucide-folder',
          defaultOpen: true,
          children: [{
            label: 'composables',
            icon: 'i-lucide-folder',
            defaultOpen: true,
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
