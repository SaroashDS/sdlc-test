import { Button } from "@/app/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl tracking-tight mb-6">
          Build your business with confidence
        </h1>
        
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Everything you need to launch, grow, and scale your SaaS business. 
          Simple, powerful, and designed for modern teams.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-base">
            Start free trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="text-base">
            Watch demo
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mt-6">
          No credit card required · 14-day free trial
        </p>
      </div>
    </section>
  );
}
