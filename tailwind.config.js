/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                slate: {
                    850: '#151b2e',
                    // 900 and 950 already exist in Tailwind defaults
                }
            }
        },
    },
    plugins: [],
}
