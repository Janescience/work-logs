const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class', 
    theme: {
      extend: {
        spacing: {
          '9/16': '56.25%',
        },
        lineHeight: {
          11: '2.75rem',
          12: '3rem',
          13: '3.25rem',
          14: '3.5rem',
        },
        fontFamily: {
          sans: 'Mitr, sans-serif',
        },
        fontSize:{
                 'xs': '.75rem',
         'sm': '.875rem',
          'base': '1.1rem',
          'lg': '1.125rem',
          'xl': '1.25rem',
          '2xl': '1.5rem',
         '3xl': '1.875rem',
         '4xl': '2.25rem',
          '5xl': '3rem',
          '6xl': '4rem',
         '7xl': '5rem',
        },
        colors: {
          primary: colors.teal,
          gray: colors.neutral,
        },
        typography: (theme) => ({
          DEFAULT: {
            css: {
              ul:{
                fontSize : '20px'
              },
              ol:{
                fontSize : '20px'
              },
              p:{
                fontSize : '20px',
                fontWeight: '100',
              },
              color: theme('colors.gray.700'),
              a: {
                color: theme('colors.lime.500'),
                '&:hover': {
                  color: `${theme('colors.lime.600')} !important`,
                },
                code: { color: theme('colors.lime.400') },
              },
              h1: {
                fontWeight: '700',
                letterSpacing: theme('letterSpacing.tight'),
                color: theme('colors.gray.900'),
              },
              h2: {
                fontWeight: '700',
                letterSpacing: theme('letterSpacing.tight'),
                color: theme('colors.gray.900'),
              },
              h3: {
                fontWeight: '600',
                color: theme('colors.gray.900'),
              },
              'h4,h5,h6': {
                color: theme('colors.gray.900'),
              },
              pre: {
                backgroundColor: theme('colors.gray.800'),
              },
              code: {
                color: theme('colors.pink.500'),
                backgroundColor: theme('colors.gray.100'),
                paddingLeft: '4px',
                paddingRight: '4px',
                paddingTop: '2px',
                paddingBottom: '2px',
                borderRadius: '0.25rem',
              },
              'code::before': {
                content: 'none',
              },
              'code::after': {
                content: 'none',
              },
              details: {
                backgroundColor: theme('colors.gray.100'),
                paddingLeft: '4px',
                paddingRight: '4px',
                paddingTop: '2px',
                paddingBottom: '2px',
                borderRadius: '0.25rem',
              },
              hr: { borderColor: theme('colors.gray.200') },
              'ol li::marker': {
                fontWeight: '600',
                color: theme('colors.gray.500'),
              },
              'ul li::marker': {
                backgroundColor: theme('colors.gray.500'),
              },
              strong: { color: theme('colors.gray.600') },
              blockquote: {
                color: theme('colors.gray.900'),
                borderLeftColor: theme('colors.gray.200'),
              },
            },
          },
          dark: {
            css: {
              color: theme('colors.gray.300'),
              a: {
                color: theme('colors.lime.500'),
                '&:hover': {
                  color: `${theme('colors.lime.400')} !important`,
                },
                code: { color: theme('colors.lime.400') },
              },
              h1: {
                fontWeight: '700',
                letterSpacing: theme('letterSpacing.tight'),
                color: theme('colors.gray.100'),
              },
              h2: {
                fontWeight: '700',
                letterSpacing: theme('letterSpacing.tight'),
                color: theme('colors.gray.100'),
              },
              h3: {
                fontWeight: '600',
                color: theme('colors.gray.100'),
              },
              'h4,h5,h6': {
                color: theme('colors.gray.100'),
              },
              pre: {
                backgroundColor: theme('colors.gray.800'),
              },
              code: {
                backgroundColor: theme('colors.gray.800'),
              },
              details: {
                backgroundColor: theme('colors.gray.800'),
              },
              hr: { borderColor: theme('colors.gray.700') },
              'ol li::marker': {
                fontWeight: '600',
                color: theme('colors.gray.400'),
              },
              'ul li::marker': {
                backgroundColor: theme('colors.gray.400'),
              },
              strong: { color: theme('colors.gray.100') },
              thead: {
                th: {
                  color: theme('colors.gray.100'),
                },
              },
              tbody: {
                tr: {
                  borderBottomColor: theme('colors.gray.700'),
                },
              },
              blockquote: {
                color: theme('colors.gray.100'),
                borderLeftColor: theme('colors.gray.700'),
              },
            },
          },
        }),
      },
    },
    plugins: [
      require('@tailwindcss/typography'),
      require('@tailwindcss/forms')
    ],
  }