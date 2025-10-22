import { Card, CardContent } from "./ui/card";
import { Quote } from "lucide-react";

export function About() {
  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl mb-4">
              About DocuFree
            </h2>
            <p className="text-xl text-muted-foreground">
              Breaking down information barriers for a more accessible world
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg leading-relaxed">
                DocuFree was founded on the belief that information should be accessible to everyone, regardless of their background, education level, or language. Our AI-driven platform transforms complex documents into clear, understandable content that empowers users to make informed decisions.
              </p>
              
              <p className="text-lg leading-relaxed">
                Whether you're navigating government forms, medical documents, legal contracts, or educational materials, DocuFree reduces information barriers and promotes inclusivity across sectors like healthcare, education, and public services.
              </p>

              <div className="grid sm:grid-cols-3 gap-4 pt-6">
                <div className="text-center">
                  <div className="text-2xl mb-1">1M+</div>
                  <div className="text-sm text-muted-foreground">Documents Simplified</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">50+</div>
                  <div className="text-sm text-muted-foreground">Languages Supported</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">99.9%</div>
                  <div className="text-sm text-muted-foreground">Accuracy Rate</div>
                </div>
              </div>
            </div>
            
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <Quote className="h-8 w-8 text-primary mb-4" />
                <blockquote className="text-lg italic mb-6">
                  "Our mission is to democratize access to information by making complex documents simple, clear, and accessible to everyone, everywhere."
                </blockquote>
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Team DocuFree</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}