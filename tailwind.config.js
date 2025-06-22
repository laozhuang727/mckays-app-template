/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        'brand-primary': 'oklch(0.522 0.223 262.881)',
        'brand-secondary': 'oklch(0.531 0.255 286.623)',
        'brand-accent': 'oklch(0.661 0.238 351.367)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}