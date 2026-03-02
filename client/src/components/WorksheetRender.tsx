import { useMemo } from "react";
import { Worksheet } from "@shared/schema";
import { CheckSquare, Type, ListOrdered, Edit3, Link as LinkIcon, Sparkles } from "lucide-react";
import logoImage from "@assets/IMG_6540_(1)_1772323458180.png";

const ACCENT = {
  text: "text-[#0066FF]",
  textLight: "text-[#0066FF]/60",
  bg: "bg-[#0066FF]/5",
  bgMedium: "bg-[#0066FF]/10",
  border: "border-[#0066FF]/30",
  borderMedium: "border-[#0066FF]/50",
  borderHover: "border-[#0066FF]",
  dashedBorder: "border-[#0066FF]/50",
};

interface WorksheetRenderProps {
  worksheet: Worksheet;
  showWatermark?: boolean;
}

interface MatchPair {
  left: string;
  right: string;
}

interface ContentQuestion {
  question: string;
  options?: string[];
  answerSpaceLines: number;
  matchPairs?: MatchPair[];
  answer?: string;
}

interface ContentSection {
  type: "mcq" | "fill_blanks" | "short_answer" | "long_answer" | "match";
  title: string;
  questions: ContentQuestion[];
}

interface AnswerKeyEntry {
  sectionIndex: number;
  questionIndex: number;
  answer: string;
}

interface WorksheetContent {
  title: string;
  instructions: string;
  graphics?: {
    description: string;
    position: "top-right" | "bottom-left" | "between-sections";
    altText: string;
  }[];
  graphicEmojis?: string[];
  sections: ContentSection[];
  answerKey?: AnswerKeyEntry[];
}

function AnswerSheet({ content }: { content: WorksheetContent }) {
  const hasAnswers = content.answerKey && content.answerKey.length > 0;
  const hasInlineAnswers = content.sections?.some(s => s.questions.some(q => q.answer));

  if (!hasAnswers && !hasInlineAnswers) return null;

  return (
    <div className="bg-white text-black font-sans w-full max-w-4xl mx-auto shadow-2xl p-6 md:p-8 rounded-sm print-a4 print:shadow-none print:m-0 print:p-6 mt-4" id="answer-sheet-content" style={{ pageBreakBefore: "always" }}>
      <h2 className="text-base font-bold border-b-2 border-black pb-1.5 mb-3 uppercase tracking-wide" data-testid="text-answer-sheet-title">
        Answer Key
      </h2>
      <div className="space-y-2">
        {content.sections?.map((section, sIndex) => (
          <div key={sIndex}>
            <h3 className="text-[10px] font-bold uppercase tracking-wide mb-0.5 text-gray-700">
              Part {String.fromCharCode(65 + sIndex)}: {section.title}
            </h3>
            <div className="border border-gray-300 rounded-md p-1.5 space-y-0.5">
              {section.questions.map((q, qIndex) => {
                const answerFromKey = content.answerKey?.find(
                  a => a.sectionIndex === sIndex && a.questionIndex === qIndex
                );
                const answer = answerFromKey?.answer || q.answer;
                if (!answer) return null;
                return (
                  <div key={qIndex} className="flex gap-2 text-xs leading-snug" data-testid={`text-answer-${sIndex}-${qIndex}`}>
                    <span className="font-bold shrink-0 text-gray-600">{qIndex + 1}.</span>
                    <span>{answer}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchSection({ q, qIndex, isColor }: { q: ContentQuestion; qIndex: number; isColor: boolean }) {
  let leftItems: string[] = [];
  let rightItems: string[] = [];

  if (q.matchPairs && q.matchPairs.length > 0) {
    leftItems = q.matchPairs.map(p => p.left);
    rightItems = q.matchPairs.map(p => p.right);
  } else if (q.options && q.options.length >= 2) {
    const half = Math.ceil(q.options.length / 2);
    leftItems = q.options.slice(0, half);
    rightItems = q.options.slice(half);
  }

  const shuffledRight = useMemo(() => {
    const arr = [...rightItems];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [rightItems.join("|||")]);

  return (
    <div className="page-break-inside-avoid relative" data-testid={`match-question-${qIndex}`}>
      <div className="flex gap-3">
        <span className="font-bold shrink-0">{qIndex + 1}.</span>
        <div className="w-full">
          <p className="text-sm leading-snug mb-1.5" data-testid={`text-match-question-${qIndex}`}>{q.question}</p>
          <div className="flex flex-wrap gap-3">
            <div className={`flex-1 min-w-[120px] border rounded-md p-2 ${isColor ? `${ACCENT.border} ${ACCENT.bg}` : 'border-gray-400'}`} data-testid={`column-a-${qIndex}`}>
              <h4 className="text-[10px] font-bold uppercase tracking-wide mb-1 text-gray-600">Column A</h4>
              <div className="space-y-1">
                {leftItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold shrink-0 w-4">{i + 1}.</span>
                    <span data-testid={`text-col-a-${qIndex}-${i}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`flex-1 min-w-[120px] border rounded-md p-2 ${isColor ? `${ACCENT.border} ${ACCENT.bg}` : 'border-gray-400'}`} data-testid={`column-b-${qIndex}`}>
              <h4 className="text-[10px] font-bold uppercase tracking-wide mb-1 text-gray-600">Column B</h4>
              <div className="space-y-1">
                {shuffledRight.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold shrink-0 w-4">{String.fromCharCode(97 + i)}.</span>
                    <span data-testid={`text-col-b-${qIndex}-${i}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const YOUNG_CLASSES = ["Nursery", "KG 1", "KG 2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5"];

export function WorksheetRender({ worksheet, showWatermark = true }: WorksheetRenderProps) {
  const content = worksheet.content as unknown as WorksheetContent;
  const isColor = worksheet.colorMode === "color";
  const isYoungClass = YOUNG_CLASSES.includes(worksheet.className);

  const GraphicPlaceholder = ({ graphic }: { graphic: any }) => {
    if (!isColor) return null;
    return (
      <div className="flex flex-col items-center justify-center p-1 opacity-70 print:opacity-100">
        <div className={`w-10 h-10 ${ACCENT.bgMedium} rounded-full flex items-center justify-center border ${ACCENT.border}`}>
          <Sparkles className={`w-5 h-5 ${ACCENT.text}`} />
        </div>
      </div>
    );
  };

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
    <>
      {showWatermark && (
        <img
          src={logoImage}
          alt=""
          className="hidden print-watermark object-contain select-none"
          draggable={false}
        />
      )}
      <div className="bg-white text-black font-serif w-full max-w-4xl mx-auto min-h-[297mm] shadow-2xl p-6 md:p-10 rounded-sm print-a4 print:shadow-none print:m-0 print:p-6 relative" id="worksheet-content">
        
        {showWatermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 print:hidden" data-testid="watermark-overlay">
            <img
              src={logoImage}
              alt="Qik Worksheet"
              className="w-[500px] h-[500px] object-contain opacity-[0.06] select-none"
              draggable={false}
            />
          </div>
        )}

        <div className={`border-b-2 pb-3 mb-4 ${isColor ? ACCENT.borderMedium : 'border-black'}`}>
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <h1 className={`text-lg md:text-xl font-bold font-display leading-tight ${isColor ? ACCENT.text : 'text-black'} break-words`} data-testid="text-worksheet-title">
                {worksheet.className} — {worksheet.subject}
              </h1>
              {(worksheet.chapter || worksheet.topic) && (
                <p className={`text-sm md:text-base font-semibold mt-0.5 ${isColor ? 'text-[#0066FF]/80' : 'text-gray-800'}`} data-testid="text-worksheet-subtitle">
                  {worksheet.chapter && worksheet.chapter !== worksheet.topic ? `${worksheet.chapter} : ` : ''}{worksheet.topic}
                </p>
              )}
              <p className="text-gray-500 font-sans text-[10px] uppercase tracking-widest mt-1" data-testid="text-worksheet-meta">
                {worksheet.board} • {worksheet.difficulty}
                {worksheet.serialNumber && ` • ${worksheet.serialNumber}`}
              </p>
            </div>
            
            <div className="shrink-0 flex items-center gap-1">
              {isYoungClass && content.graphicEmojis && content.graphicEmojis.length > 0 && (
                <div className="flex gap-0.5" data-testid="emoji-header">
                  {content.graphicEmojis.slice(0, 3).map((emoji, i) => (
                    <span key={i} className="text-xl md:text-2xl" style={{ transform: `rotate(${(i - 1) * 15}deg)` }}>{emoji}</span>
                  ))}
                </div>
              )}
              {isColor && content.graphics?.find(g => g.position === "top-right") && (
                <div className="hidden md:block">
                  <GraphicPlaceholder graphic={content.graphics.find(g => g.position === "top-right")} />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 font-sans text-sm">
            <div className="flex items-end gap-2 flex-1 min-w-[140px]">
              <span className="font-semibold whitespace-nowrap text-xs">Name:</span>
              <div className="border-b border-gray-400 w-full"></div>
            </div>
            <div className="flex items-end gap-2 w-32 sm:w-36">
              <span className="font-semibold whitespace-nowrap text-xs">Date:</span>
              <div className="border-b border-gray-400 w-full"></div>
            </div>
          </div>
        </div>

        {content.instructions && (
          <div className={`p-3 mb-5 rounded-lg ${isColor ? `${ACCENT.bg} text-[#0066FF]` : 'bg-gray-100 text-black border border-gray-300'}`}>
            <h3 className="font-sans font-bold text-xs uppercase tracking-wide mb-0.5">Instructions</h3>
            <p className="italic text-xs leading-snug">{content.instructions}</p>
          </div>
        )}

        <div className="space-y-4">
          {content.sections?.map((section, sIndex) => (
            <div key={sIndex} className="page-break-inside-avoid">
              
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {isColor && (
                    <div className={`${ACCENT.text} opacity-80`}>
                      {getSectionIcon(section.type)}
                    </div>
                  )}
                  <h2 className={`text-base font-bold font-display ${isColor ? ACCENT.text : 'text-black border-b border-black pb-0.5 inline-block'}`}>
                    Part {String.fromCharCode(65 + sIndex)}: {section.title}
                  </h2>
                </div>
                
                {isColor && content.graphics?.find(g => g.position === "between-sections") && sIndex % 2 === 0 && (
                  <div className="hidden md:block">
                    <GraphicPlaceholder graphic={content.graphics.find(g => g.position === "between-sections")} />
                  </div>
                )}
                {isYoungClass && content.graphicEmojis && sIndex > 0 && sIndex % 2 === 0 && (
                  <div className="flex gap-1 items-center" data-testid={`emoji-section-${sIndex}`}>
                    {content.graphicEmojis.slice(0, 2).map((emoji, i) => (
                      <span key={i} className="text-xl opacity-60">{emoji}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pl-1 md:pl-3">
                {section.questions.map((q, qIndex) => (
                  section.type === "match" ? (
                    <MatchSection key={qIndex} q={q} qIndex={qIndex} isColor={isColor} />
                  ) : (
                    <div key={qIndex} className="page-break-inside-avoid relative">
                      <div className="flex gap-3">
                        <span className="font-bold shrink-0">{qIndex + 1}.</span>
                        <div className="w-full">
                          <p className="text-sm leading-snug mb-1.5">{q.question}</p>
                          
                          {section.type === "mcq" && q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-2 font-sans ml-2">
                              {q.options.map((opt, optIndex) => (
                                <label key={optIndex} className="flex items-center gap-2 cursor-pointer group">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isColor ? `${ACCENT.border} group-hover:${ACCENT.borderHover}` : 'border-gray-400 group-hover:border-black'}`}>
                                    <span className="text-[9px] font-bold opacity-0 group-hover:opacity-100">
                                      {String.fromCharCode(97 + optIndex)}
                                    </span>
                                  </div>
                                  <span className="text-xs">{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {q.answerSpaceLines > 0 && (
                            <div className="space-y-0.5 mt-1 opacity-40">
                              {Array.from({ length: section.type === "short_answer" ? Math.min(q.answerSpaceLines, 2) : q.answerSpaceLines }).map((_, i) => (
                                <div key={i} className={`border-b border-dashed h-4 w-full ${isColor ? ACCENT.dashedBorder : 'border-black'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
              
            </div>
          ))}
        </div>

        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400 font-sans print-only">
          Generated by Smart AI Worksheet Generator • {new Date().toLocaleDateString()}
        </div>

      </div>

      <AnswerSheet content={content} />
    </>
  );
}
