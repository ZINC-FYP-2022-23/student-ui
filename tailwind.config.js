const colors = require('tailwindcss/colors')
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    './components/**/*.tsx',
    './layout/**/*.tsx',
    './pages/**/*.tsx',
  ],
  theme: {
    typography: (theme) => ({
      default: {
        css: {
          a: {
            color: '#1B3663',
            fontWeight: 600,
            textDecoration: 'none'
          }
        }
      }
    }),
    extend: {
      colors: {
        // https://tailwindcss.com/docs/upgrade-guide#removed-color-aliases
        green: colors.emerald,
        yellow: colors.amber,
        purple: colors.violet,
        "cool-gray": colors.slate,
        current: 'currentColor',
        cse: {
          '100': '#8FADE0',
          '200': '#6F95D8',
          '300': '#4F7ECF',
          '400': '#3560C0',
          '500': '#2C56A0',
          '600': '#234580',
          '700': '#1B3663',
          '800': '#162B50',
          '900': '#122340'
        }
      },
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
        mono: ['Fira Code',...defaultTheme.fontFamily.mono]
      }
    },
  },
  plugins: [],
}
