import { Header } from "@/app/components/Header";
import { Hero } from "@/app/components/Hero";
import { Features } from "@/app/components/Features";
import { Pricing } from "@/app/components/Pricing";
import { Footer } from "@/app/components/Footer";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}
