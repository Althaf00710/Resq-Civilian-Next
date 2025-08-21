import { Star } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Kumari Sharma",
      role: "Teacher & Mother",
      content: "When my daughter had an allergic reaction at school, ResQ helped me get an ambulance there in under 4 minutes. The peace of mind it gives parents is incredible.",
      rating: 5,
      image: "👩‍🏫"
    },
    {
      name: "Raguvaran VIP",
      role: "Construction Worker",
      content: "Had a workplace accident and requested ResQ through my phone. Emergency responders arrived before I could even call for help myself to manager.",
      rating: 5,
      image: "👷‍♂️"
    },
    {
      name: "Rajnikanth",
      role: "Senior Citizen",
      content: "As someone living alone, ResQ gives me confidence to stay independent. The emergency feature is so easy to use, even for someone my age.",
      rating: 5,
      image: "👵"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-700 mb-6">
            Real Stories from <span className="text-blue-800 font-medium">Real People</span>
          </h2>
          <p className="text-xl text-gray-500 max-w-3xl mx-auto">
            See how ResQ has made a difference in the lives of thousands of people 
            across our communities when they needed help most.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <blockquote className="text-gray-600 text-lg leading-relaxed mb-6">
                &quot;{testimonial.content}&quot;
              </blockquote>
              
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-300/30 flex items-center justify-center text-2xl mr-4">
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-semibold text-gray-600">
                    {testimonial.name}
                  </div>
                  <div className="text-orange-600 text-sm">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;