import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sushi: {
					50: '#FBF7F4',
					100: '#F5EFE8',
					200: '#EAE0D4',
					300: '#D4BFA6',
					400: '#C4AB8A', 
					500: '#9C7F58',
					600: '#8A6D42',
					700: '#735A35',
					800: '#5C482A',
					900: '#483A24',
					950: '#2A2318',
				},
				wasabi: {
					50: '#F4FBF7',
					100: '#E8F5EF', 
					200: '#D4EAE0',
					300: '#A6D4BF',
					400: '#8AC4AB',
					500: '#589C7F',
					600: '#428A6D',
					700: '#35735A',
					800: '#2A5C48',
					900: '#24483A',
					950: '#182A23',
				},
				akane: {
					50: '#FCF2F3',
					100: '#F9E6E7',
					200: '#F5CED0',
					300: '#ECA5A9',
					400: '#E37C82',
					500: '#D65058',
					600: '#C43942',
					700: '#A52C37',
					800: '#882836',
					900: '#6A2129',
					950: '#41141B',
				},
				gold: {
					50: '#FFFAEB',
					100: '#FFF1C5',
					200: '#FFE17A',
					300: '#FFD13D',
					400: '#FABE00',
					500: '#E6AB00',
					600: '#C48A00',
					700: '#9C6A00',
					800: '#7A5500',
					900: '#624400',
					950: '#3D2900',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: ['Noto Sans', 'sans-serif'],
				serif: ['Playfair Display', 'serif'],
				display: ['Montserrat', 'sans-serif'],
				japanese: ['"Noto Sans JP"', 'sans-serif'],
				'better-times': ['"Better Times"', 'serif'],
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				'fade-up': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-down': {
					'0%': { opacity: '0', transform: 'translateY(-10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'slide-out-left': {
					'0%': { transform: 'translateX(0)', opacity: '1' },
					'100%': { transform: 'translateX(-100%)', opacity: '0' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'scale-out': {
					'0%': { transform: 'scale(1)', opacity: '1' },
					'100%': { transform: 'scale(0.95)', opacity: '0' }
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.5s ease-out',
				'fade-up': 'fade-up 0.5s ease-out',
				'fade-down': 'fade-down 0.5s ease-out',
				'float': 'float 3s ease-in-out infinite',
				'slide-in-right': 'slide-in-right 0.5s ease-out',
				'slide-out-left': 'slide-out-left 0.5s ease-out',
				'scale-in': 'scale-in 0.3s ease-out',
				'scale-out': 'scale-out 0.3s ease-out',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'texture-paper': "url('/public/lovable-uploads/b86e2eb2-fc3f-446a-9f46-d6abb91e54cd.png')",
				'texture-wood': "url('/public/lovable-uploads/c30dd633-dfec-4589-afdf-9cf0abf72049.png')",
				'sushi-logo': "url('/public/lovable-uploads/80663134-a018-4c55-8a81-5ee048c700e3.png')",
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
