import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, BookOpen, LayoutList, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGenerateWorksheet } from "@/hooks/use-worksheets";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { insertWorksheetSchema } from "@shared/schema";

// Form schema based on the backend schema but forcing strings for selects
// We extend the insert schema and coerce length for numbers
const formSchema = insertWorksheetSchema.extend({
  length: z.coerce.number().min(1).max(50),
});

type FormValues = z.infer<typeof formSchema>;

export function WorksheetForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const generateMutation = useGenerateWorksheet();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      className: "",
      board: "",
      subject: "",
      topic: "",
      difficulty: "medium",
      length: 10,
      colorMode: "bw",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await generateMutation.mutateAsync(data);
      toast({
        title: "Success!",
        description: "Your worksheet has been generated successfully.",
      });
      setLocation(`/worksheet/${result.id}`);
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const isGenerating = generateMutation.isPending;

  return (
    <div className="bg-card rounded-2xl shadow-xl shadow-primary/5 border border-border/50 overflow-hidden">
      <div className="p-6 md:p-8 bg-gradient-to-b from-primary/5 to-transparent border-b border-border/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <Settings2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Configure Worksheet
          </h2>
        </div>
        <p className="text-muted-foreground ml-12">
          Define parameters and let our AI craft the perfect educational material.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grade / Class */}
            <FormField
              control={form.control}
              name="className"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary/70" /> Grade Level
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl">
                        <SelectValue placeholder="Select Grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Grade 1">Grade 1</SelectItem>
                      <SelectItem value="Grade 2">Grade 2</SelectItem>
                      <SelectItem value="Grade 3">Grade 3</SelectItem>
                      <SelectItem value="Grade 4">Grade 4</SelectItem>
                      <SelectItem value="Grade 5">Grade 5</SelectItem>
                      <SelectItem value="Grade 6">Grade 6</SelectItem>
                      <SelectItem value="Grade 7">Grade 7</SelectItem>
                      <SelectItem value="Grade 8">Grade 8</SelectItem>
                      <SelectItem value="Grade 9">Grade 9</SelectItem>
                      <SelectItem value="Grade 10">Grade 10</SelectItem>
                      <SelectItem value="High School">High School</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Curriculum / Board */}
            <FormField
              control={form.control}
              name="board"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground/80 flex items-center gap-2">
                    <LayoutList className="w-4 h-4 text-primary/70" /> Curriculum Board
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl">
                        <SelectValue placeholder="Select Board" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Common Core">Common Core</SelectItem>
                      <SelectItem value="CBSE">CBSE</SelectItem>
                      <SelectItem value="ICSE">ICSE</SelectItem>
                      <SelectItem value="IGCSE">IGCSE</SelectItem>
                      <SelectItem value="State Board">State Board</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="text-sm font-semibold text-foreground/80">
                    Subject
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Mathematics, General Science, English Grammar" 
                      className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl px-4"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Topic */}
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="text-sm font-semibold text-foreground/80">
                    Specific Topic
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Fractions, Photosynthesis, Present Tense" 
                      className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl px-4"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Be as specific as possible for better results.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Difficulty */}
            <FormField
              control={form.control}
              name="difficulty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground/80">
                    Difficulty Level
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl">
                        <SelectValue placeholder="Select Difficulty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="easy">Beginner / Easy</SelectItem>
                      <SelectItem value="medium">Intermediate / Medium</SelectItem>
                      <SelectItem value="hard">Advanced / Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Length */}
            <FormField
              control={form.control}
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-foreground/80">
                    Number of Questions
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min={1}
                      max={50}
                      className="h-12 bg-background border-2 focus:ring-primary/20 rounded-xl px-4"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color Mode */}
            <FormField
              control={form.control}
              name="colorMode"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel className="text-sm font-semibold text-foreground/80">
                    Print Mode
                  </FormLabel>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <label className={`
                      flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                      ${field.value === 'bw' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border hover:border-primary/30'}
                    `}>
                      <input 
                        type="radio" 
                        className="sr-only" 
                        {...field} 
                        value="bw" 
                        checked={field.value === 'bw'}
                      />
                      <span className="font-semibold text-foreground mb-1">Black & White</span>
                      <span className="text-xs text-muted-foreground text-center">Optimized for standard printers</span>
                    </label>
                    <label className={`
                      flex flex-col items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
                      ${field.value === 'color' ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-border hover:border-primary/30'}
                    `}>
                      <input 
                        type="radio" 
                        className="sr-only" 
                        {...field} 
                        value="color"
                        checked={field.value === 'color'} 
                      />
                      <span className="font-semibold text-foreground mb-1 text-primary">Color Accent</span>
                      <span className="text-xs text-muted-foreground text-center">For digital or color printing</span>
                    </label>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isGenerating}
              className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  Generating Worksheet...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-3" />
                  Generate Smart Worksheet
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
