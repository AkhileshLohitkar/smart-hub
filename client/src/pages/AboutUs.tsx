import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src={logoImage} alt="Qik Worksheet" className="w-20 h-20 rounded-lg object-contain drop-shadow-md logo-vibrant" />
            <span className="text-lg font-display font-bold text-gradient-primary">Qik Worksheets</span>
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <h1 className="text-3xl sm:text-4xl font-display font-bold mb-8" data-testid="heading-about">About Us</h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-foreground/90">
          <p className="text-lg leading-relaxed">
            Qik Worksheets is an AI-powered educational platform built to help parents, teachers, and tutors create high-quality, curriculum-aligned worksheets in seconds.
          </p>

          <h2 className="text-xl font-display font-bold mt-8">Our Mission</h2>
          <p>
            We believe every child deserves access to quality practice materials. Our mission is to make worksheet creation effortless so educators can focus on what matters most — teaching and nurturing young minds.
          </p>

          <h2 className="text-xl font-display font-bold mt-8">What We Offer</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>AI-generated worksheets aligned with CBSE, ICSE, IGCSE, and State Board curricula</li>
            <li>Support for Nursery through Grade 10 with age-appropriate content</li>
            <li>Multiple question types including MCQ, fill-in-the-blanks, short answer, long answer, and matching</li>
            <li>NCERT chapter-specific content for CBSE students</li>
            <li>Print-ready A4 format with PDF download</li>
            <li>Test paper generation with structured marks schemes</li>
            <li>Child profile management for families with multiple children</li>
          </ul>

          <h2 className="text-xl font-display font-bold mt-8">Why Qik Worksheets?</h2>
          <p>
            Traditional worksheet creation takes hours of effort. Qik Worksheets uses advanced AI to generate perfectly formatted, syllabus-aligned practice materials in under a minute. Whether you are a parent preparing your child for exams or a teacher managing multiple classes, our tool saves you valuable time.
          </p>

          <h2 className="text-xl font-display font-bold mt-8">Built for Indian Education</h2>
          <p>
            We understand the Indian education system deeply. Our worksheets are tailored to match the exact syllabus, terminology, and question patterns used in Indian schools. From NCERT textbook alignment to board-specific formatting, every detail is designed for Indian classrooms.
          </p>

          <h2 className="text-xl font-display font-bold mt-8">Contact Us</h2>
          <p>
            Have questions or feedback? We would love to hear from you. Reach out to us at <a href="mailto:hi@qikworksheet.in" className="text-primary hover:underline">hi@qikworksheet.in</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
