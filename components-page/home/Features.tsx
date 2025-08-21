import { Phone, MapPin, Bell, Users } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Phone,
      title: "Report Emergencies Instantly",
      description: "One-tap emergency reporting with automatic location sharing and priority routing to nearest responders."
    },
    {
      icon: MapPin,
      title: "Real-Time Ambulance Tracking",
      description: "Track ambulance location live, get accurate arrival times, and receive step-by-step updates on response status."
    },
    {
      icon: Bell,
      title: "Receive Critical Medical Alerts",
      description: "Get immediate notifications about nearby emergencies, weather warnings, and safety updates in your area."
    },
    {
      icon: Users,
      title: "Community Support Network",
      description: "Connect with trained volunteers and emergency contacts for additional support during crisis situations."
    }
  ];

  return (
    <section className="py-20 bg-gray-50 px-15">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-700 mb-6">
            How ResQ <span className="text-blue-800 font-medium">Protects</span> You
          </h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            Our comprehensive emergency response system ensures help is always within reach, 
            providing peace of mind for you and your loved ones.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group p-8 rounded-2xl bg-blue-100/90 border border-white border-border hover:shadow-lg transition-all hover:-translate-y-2"
            >
              <div className="w-16 h-16 rounded-full bg-orange-500/90 flex items-center justify-center mb-6 group-hover:bg-primary/20">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold text-blue-900 mb-4">
                {feature.title}
              </h3>
              
              <p className="font-extralight leading-relaxed text-gray-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;