import { useParams, Link } from "wouter";
import { useWorksheet } from "@/hooks/use-worksheets";
import { WorksheetRender } from "@/components/WorksheetRender";
import { ArrowLeft, Printer, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function WorksheetView() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : null;
  const { data: worksheet, isLoading, isError } = useWorksheet(id);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-display font-semibold">Retrieving Worksheet...</h2>
        <p className="text-muted-foreground mt-2">Loading your generated content</p>
      </div>
    );
  }

  if (isError || !worksheet) {
    return (
      <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 rounded-2xl shadow-xl max-w-md text-center border border-border">
          <h2 className="text-2xl font-display font-bold text-destructive mb-3">Worksheet Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't locate the worksheet you're looking for. It may have expired or the ID is invalid.</p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50 flex flex-col">
      
      {/* Top Navigation / Toolbar (Hidden on Print) */}
      <div className="bg-card border-b border-border shadow-sm sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              title="Back to Generator"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="font-display font-bold text-lg hidden sm:block">
                {worksheet.subject} Worksheet
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-wider hidden sm:block">
                {worksheet.topic} • {worksheet.difficulty}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="hidden sm:flex rounded-xl font-semibold border-2"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // Optionally show a toast here
              }}
            >
              <FileDown className="w-4 h-4 mr-2" /> Share Link
            </Button>
            
            <Button 
              onClick={handlePrint}
              className="rounded-xl px-6 font-semibold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
            >
              <Printer className="w-4 h-4 mr-2" /> Print Document
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 py-12 px-4 sm:px-8 overflow-y-auto print:p-0 print:overflow-visible">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="print:shadow-none"
        >
          <WorksheetRender worksheet={worksheet} />
        </motion.div>
      </main>

    </div>
  );
}
