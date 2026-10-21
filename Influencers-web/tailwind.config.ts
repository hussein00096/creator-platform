import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: {} },
  // `.ring` is the dashed portrait ring in the reference design (site.css); never emit Tailwind's ring utility.
  blocklist: ['ring'],
  plugins: [],
};

export default config;
