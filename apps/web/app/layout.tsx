import type { Metadata } from 'next';
import { Space_Grotesk, DM_Sans } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-space-grotesk',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Outfit Now — Porte mieux. Achète mieux.',
  description:
    "Scan ton dressing, reçois des tenues IA sur-mesure avec Karl et visualise-les sur ton propre mannequin. Rejoins la liste d'attente.",
  openGraph: {
    title: 'Outfit Now — Porte mieux. Achète mieux.',
    description: 'Styliste IA, dressing intelligent, mannequin personnalisé.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
