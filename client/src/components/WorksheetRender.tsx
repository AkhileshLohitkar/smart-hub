import { Worksheet } from "@shared/schema";
import { CheckSquare, Type, ListOrdered, Edit3, Link as LinkIcon } from "lucide-react";

interface WorksheetRenderProps {
  worksheet: Worksheet;
}

// Structure inferred from the backend JSON response spec
interface ContentSection {
  type: "mcq" | "fill_blanks" | "short_answer" | "long_answer" | "match";
  title: string;
  questions: {
    question: string;
    options?: string[];
    answerSpaceLines: number;
  }[];
}

interface WorksheetContent {
  title: string;
  instructions: string;
  sections: ContentSection[];
}

export function WorksheetRender({ worksheet }: WorksheetRenderProps) {
  const content = worksheet.content as unknown as WorksheetContent;
  const isColor = worksheet.colorMode === "color";

  // Section icons mapping
  const getSectionIcon = (type: string) => {
    const props = { className: "w-5 h-5 mr-2" };
    switch (type) {
      case "mcq": return <ListOrdered {...props} />;
      case "fill_blanks": return <Type {...props} />;
      case "short_answer": return <Edit3 {...props} />;
      case "long_answer": return <Edit3 {...props} />;
      case "match": return <LinkIcon {...props} />;
      default: return <CheckSquare {...props} />;
    }
  };

  return (
    <div className="bg-white text-black font-serif w-full max-w-4xl mx-auto min-h-[297mm] shadow-2xl p-8 md:p-16 rounded-sm print-a4 print:shadow-none print:m-0 print:p-8">
      
      {/* Header Info Block */}
      <div className={`flex justify-between items-end border-b-2 pb-6 mb-8 ${isColor ? 'border-primary/50' : 'border-black'}`}>
        <div>
          <h1 className={`text-3xl md:text-4xl font-bold font-display mb-2 ${isColor ? 'text-primary' : 'text-black'}`}>
            {content.title || `${worksheet.subject}: ${worksheet.topic}`}
          </h1>
          <p className="text-gray-600 font-sans text-sm md:text-base uppercase tracking-wider">
            {worksheet.board} • Grade: {worksheet.className} • {worksheet.difficulty}
          </p>
        </div>
        
        {/* Name / Date Fields for Students */}
        <div className="hidden sm:block space-y-4 font-sans text-sm w-64">
          <div className="flex items-end gap-2">
            <span className="font-semibold whitespace-nowrap">Name:</span>
            <div className="border-b border-gray-400 w-full"></div>
          </div>
          <div className="flex items-end gap-2">
            <span className="font-semibold whitespace-nowrap">Date:</span>
            <div className="border-b border-gray-400 w-full"></div>
          </div>
        </div>
      </div>

      <div className="sm:hidden space-y-4 font-sans text-sm mb-8">
        <div className="flex items-end gap-2">
          <span className="font-semibold whitespace-nowrap">Name:</span>
          <div className="border-b border-gray-400 w-full"></div>
        </div>
        <div className="flex items-end gap-2">
          <span className="font-semibold whitespace-nowrap">Date:</span>
          <div className="border-b border-gray-400 w-full"></div>
        </div>
      </div>

      {/* Instructions */}
      {content.instructions && (
        <div className={`p-4 mb-8 rounded-lg ${isColor ? 'bg-blue-50 text-blue-900' : 'bg-gray-100 text-black border border-gray-300'}`}>
          <h3 className="font-sans font-bold text-sm uppercase tracking-wide mb-1">Instructions</h3>
          <p className="italic text-sm">{content.instructions}</p>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-12">
        {content.sections?.map((section, sIndex) => (
          <div key={sIndex} className="page-break-inside-avoid">
            
            {/* Section Header */}
            <div className="flex items-center mb-6">
              {isColor && (
                <div className="text-primary opacity-80">
                  {getSectionIcon(section.type)}
                </div>
              )}
              <h2 className={`text-xl font-bold font-display ${isColor ? 'text-primary' : 'text-black border-b border-black pb-1 inline-block'}`}>
                Part {String.fromCharCode(65 + sIndex)}: {section.title}
              </h2>
            </div>

            {/* Questions */}
            <div className="space-y-8 pl-1 md:pl-4">
              {section.questions.map((q, qIndex) => (
                <div key={qIndex} className="page-break-inside-avoid relative">
                  
                  {/* Question Text */}
                  <div className="flex gap-3">
                    <span className="font-bold shrink-0">{qIndex + 1}.</span>
                    <div className="w-full">
                      <p className="text-base leading-relaxed mb-4">{q.question}</p>
                      
                      {/* MCQ Options */}
                      {section.type === "mcq" && q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 font-sans ml-2">
                          {q.options.map((opt, optIndex) => (
                            <label key={optIndex} className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isColor ? 'border-primary/40 group-hover:border-primary' : 'border-gray-400 group-hover:border-black'}`}>
                                <span className="text-[10px] font-bold opacity-0 group-hover:opacity-100">
                                  {String.fromCharCode(97 + optIndex)}
                                </span>
                              </div>
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Answer Space (Lines) */}
                      {q.answerSpaceLines > 0 && (
                        <div className="space-y-2 mt-4 opacity-40">
                          {Array.from({ length: q.answerSpaceLines }).map((_, i) => (
                            <div key={i} className={`border-b border-dashed h-8 w-full ${isColor ? 'border-primary/50' : 'border-black'}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-16 pt-8 border-t border-gray-200 text-center text-sm text-gray-400 font-sans print-only">
        Generated by Smart AI Worksheet Generator • {new Date().toLocaleDateString()}
      </div>

    </div>
  );
}
