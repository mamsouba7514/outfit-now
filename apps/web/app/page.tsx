import Community from '@/components/Community';
import CtaFinal from '@/components/CtaFinal';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import KarlSection from '@/components/KarlSection';
import Stats from '@/components/Stats';
import StylePass from '@/components/StylePass';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <KarlSection />
        <Features />
        <HowItWorks />
        <StylePass />
        <Community />
        <CtaFinal />
      </main>
      <Footer />
    </>
  );
}
