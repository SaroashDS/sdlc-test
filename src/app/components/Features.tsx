import { Zap, Shield, Globe, BarChart3, Users, Sparkles } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning fast",
    description: "Optimized performance ensures your application runs smoothly at scale."
  },
  {
    icon: Shield,
    title: "Secure by default",
    description: "Enterprise-grade security with encryption and compliance built-in."
  },
  {
    icon: Globe,
    title: "Global reach",
    description: "Deploy worldwide with CDN support and multi-region infrastructure."
  },
  {
    icon: BarChart3,
    title: "Advanced analytics",
    description: "Deep insights into your metrics with real-time dashboard and reports."
  },
  {
    icon: Users,
    title: "Team collaboration",
    description: "Work together seamlessly with powerful collaboration tools."
  },
  {
    icon: Sparkles,
    title: "AI-powered",
    description: "Leverage artificial intelligence to automate and optimize workflows."
  }
];

export function Features() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl tracking-tight mb-4">
          Everything you need
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Powerful features to help you build, launch, and grow your business faster.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="p-6 rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
