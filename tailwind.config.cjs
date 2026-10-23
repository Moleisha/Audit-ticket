/** Tailwind 配置：关闭 preflight，避免与 Ant Design 的基础样式互相覆盖 */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js}'],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#DCE4FF',
          500: '#2E5BFF',
          600: '#1E47E0'
        },
        ink: {
          900: '#0F1B2D',
          700: '#334155',
          500: '#64748B',
          400: '#94A3B8'
        },
        line: '#E6EAF2',
        canvas: '#F4F6FB'
      },
      fontFamily: {
        display: ['Manrope', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'sans-serif']
      },
      borderRadius: {
        xl2: '16px'
      }
    }
  },
  plugins: []
}
