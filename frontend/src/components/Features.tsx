import { Brain, Languages, MessageCircleQuestion, Shield } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Summarization",
    description: "Advanced AI algorithms extract key information and create clear, concise summaries from complex documents."
  },
  {
    icon: Languages,
    title: "Multi-language Translation",
    description: "Break language barriers with instant translation capabilities supporting over 100 languages worldwide."
  },
  {
    icon: MessageCircleQuestion,
    title: "Interactive Q&A",
    description: "Ask questions about your documents and get instant, accurate answers powered by intelligent document analysis."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Enterprise-grade security ensures your sensitive documents remain protected with end-to-end encryption."
  }
];

export function Features() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl mb-4">
            Powerful Features for Document Simplification
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our AI-driven platform offers comprehensive tools to make any document more accessible and understandable.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}