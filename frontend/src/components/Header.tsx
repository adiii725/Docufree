import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

export function Header() {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">D</span>
          </div>
          <span className="font-bold text-xl">DocuFree</span>
        </div>

        <nav className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => scrollToSection("about")}
            className="hidden sm:inline-flex"
          >
            About Us
          </Button>

          <Button variant="outline" onClick={() => navigate("/signup")}>
            Sign up
          </Button>

          <Button onClick={() => navigate("/login")}>Login</Button>
        </nav>
      </div>
    </header>
  );
}
