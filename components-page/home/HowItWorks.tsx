import { AlertTriangle, Radio, Truck } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: AlertTriangle,
      number: "1",
      title: "Report Emergency",
      description: "Press the emergency button or call through the app. Your location is automatically shared with responders."
    },
    {
      icon: Radio,
      number: "2", 
      title: "Alert Sent",
      description: "Your emergency alert is instantly routed to the nearest available response team with all critical details."
    },
    {
      icon: Truck,
      number: "3",
      title: "Help Arrives",
      description: "Emergency responders are dispatched immediately. Track their arrival and receive real-time updates."
    }
  ];

  return (
    <section className="py-20 bg-blue-300/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-700 mb-6">
            How It <span className="text-orange-500/90 font-medium">Works</span>
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">
            Getting help is simple and fast. Our streamlined process ensures 
            emergency response in just three easy steps.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection lines for desktop */}
            <div className="hidden md:block absolute top-24 left-1/3 right-1/3 h-0.5 bg-blue-500/30">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-blue-500 to-orange-400 opacity-50"></div>
            </div>

            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="w-20 h-20 rounded-full bg-white border-4 border-blue-700 shadow-soft flex items-center justify-center mx-auto mb-6 relative z-10 hover:border-orange-500 transition-all duration-300 hover:shadow-2xl">
                  <step.icon className="w-8 h-8 text-blue-700" />
                </div>
                
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {step.number}
                </div>
                
                <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                  {step.title}
                </h3>
                
                <p className="text-gray-500 leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;