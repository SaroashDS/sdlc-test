import { Button } from "@/app/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "29",
    description: "Perfect for small teams getting started",
    features: [
      "Up to 5 team members",
      "10GB storage",
      "Basic analytics",
      "Email support",
      "Core features"
    ]
  },
  {
    name: "Professional",
    price: "79",
    description: "For growing businesses",
    features: [
      "Up to 20 team members",
      "100GB storage",
      "Advanced analytics",
      "Priority support",
      "All features",
      "Custom integrations"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    price: "199",
    description: "For large organizations",
    features: [
      "Unlimited team members",
      "Unlimited storage",
      "Custom analytics",
      "24/7 dedicated support",
      "All features",
      "Custom integrations",
      "SLA guarantee"
    ]
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 bg-gray-50">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl tracking-tight mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Choose the plan that's right for your business. All plans include a 14-day free trial.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div 
            key={plan.name} 
            className={`bg-white rounded-2xl p-8 ${
              plan.popular 
                ? 'border-2 border-black shadow-xl relative' 
                : 'border border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-black text-white px-4 py-1 rounded-full text-sm">
                  Most popular
                </span>
              </div>
            )}
            
            <h3 className="text-2xl mb-2">{plan.name}</h3>
            <p className="text-gray-600 mb-6">{plan.description}</p>
            
            <div className="mb-6">
              <span className="text-5xl">${plan.price}</span>
              <span className="text-gray-600 ml-2">/month</span>
            </div>
            
            <Button 
              className="w-full mb-6" 
              variant={plan.popular ? "default" : "outline"}
            >
              Get started
            </Button>
            
            <ul className="space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-black shrink-0 mt-0.5" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
