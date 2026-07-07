import type {
  GeneratedPaper,
  AnswerKeyEntry,
  GeneratedQuestion,
  GeneratedSection,
  PaperLayoutProfile,
} from "@/lib/questionPaperApi";

interface QuestionPaperRenderProps {
  paper: GeneratedPaper;
  answerKey: AnswerKeyEntry[];
}

const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

function formatSectionHeader(section: GeneratedSection): string {
  if (section.headerLine) {
    const marks = section.sectionMarks;
    if (marks != null && !section.headerLine.includes(":")) {
      return `${section.headerLine} : ${marks}`;
    }
    if (marks != null && !/\d+\s*$/.test(section.headerLine)) {
      return `${section.headerLine} : ${marks}`;
    }
    return section.headerLine;
  }
  const parts: string[] = [];
  if (section.parentQuestionNumber) {
    parts.push(section.parentQuestionNumber);
    if (section.subSectionLetter) parts.push(`(${section.subSectionLetter})`);
  }
  const label = parts.length ? parts.join(" ") : section.name;
  const marks = section.sectionMarks != null ? ` : ${section.sectionMarks}` : "";
  return `${label}${section.description ? ` ${section.description}` : ""}${marks}`;
}

function McqOptions({
  options,
  style,
}: {
  options: string[];
  style: PaperLayoutProfile["mcqOptionStyle"];
}) {
  const upper = style !== "lower_alpha_paren";
  return (
    <div className="mt-1.5 ml-4 space-y-0.5">
      {options.map((opt, i) => {
        const letter = String.fromCharCode(upper ? 65 + i : 97 + i);
        const clean = opt.replace(/^\([A-Da-d]\)\s*/, "");
        return (
          <div key={i} className="flex gap-2 text-[13px] leading-snug">
            <span className="font-semibold shrink-0">({letter})</span>
            <span>{clean}</span>
          </div>
        );
      })}
    </div>
  );
}

function MatchColumnsBlock({ q }: { q: GeneratedQuestion }) {
  if (!q.matchPairs?.length) return null;
  return (
    <div className="mt-1.5 ml-4">
      <div className="flex gap-8 text-[13px]">
        <div>
          <p className="font-semibold mb-1">Column &apos;A&apos;</p>
          {q.matchPairs.map((p, i) => (
            <div key={i} className="flex gap-2 mb-0.5">
              <span className="shrink-0">{ROMAN[i] ? `(${ROMAN[i]})` : `${i + 1}.`}</span>
              <span>{p.left}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="font-semibold mb-1">Column &apos;B&apos;</p>
          {q.matchPairs.map((p, i) => (
            <div key={i} className="flex gap-2 mb-0.5">
              <span className="shrink-0">({String.fromCharCode(97 + i)})</span>
              <span>{p.right}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NestedQuestionBlock({
  q,
  layout,
  showMarks,
}: {
  q: GeneratedQuestion;
  layout: PaperLayoutProfile;
  showMarks: boolean;
}) {
  const num = q.number.startsWith("(") ? q.number : `(${q.number})`;

  return (
    <div className="page-break-inside-avoid mb-2.5">
      <div className="flex gap-2">
        <span className="font-semibold shrink-0 text-[13px]">{num}</span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-3">
            <p className="text-[13px] leading-snug">{q.text}</p>
            {showMarks && q.marks > 0 && (
              <span className="text-xs font-semibold shrink-0">[{q.marks}]</span>
            )}
          </div>

          {q.options && q.options.length > 0 && (
            <McqOptions options={q.options} style={layout.mcqOptionStyle ?? "upper_alpha_paren"} />
          )}

          <MatchColumnsBlock q={q} />

          {q.subParts && q.subParts.length > 0 && (
            <div className="mt-1.5 ml-2 space-y-1">
              {q.subParts.map((sp, i) => (
                <div key={i} className="flex gap-2 text-[13px] leading-snug">
                  <span className="font-semibold shrink-0">{sp.label}</span>
                  <span>{sp.text}</span>
                </div>
              ))}
            </div>
          )}

          {!!q.answerLines && q.answerLines > 0 && (
            <div className="space-y-1 mt-2 opacity-40">
              {Array.from({ length: Math.min(q.answerLines, 10) }).map((_, i) => (
                <div key={i} className="border-b border-dashed border-black h-4 w-full" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GenericQuestionBlock({ q }: { q: GeneratedQuestion }) {
  return (
    <div className="page-break-inside-avoid">
      <div className="flex gap-2">
        <span className="font-bold shrink-0">{q.number}.</span>
        <div className="w-full">
          <div className="flex justify-between gap-3">
            <p className="text-sm leading-snug">{q.text}</p>
            {q.marks ? (
              <span className="text-xs font-semibold text-gray-600 shrink-0 whitespace-nowrap">[{q.marks}]</span>
            ) : null}
          </div>

          {q.options && q.options.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-1.5 ml-2">
              {q.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-semibold">({String.fromCharCode(97 + i)})</span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          )}

          {q.matchPairs && q.matchPairs.length > 0 && (
            <div className="flex gap-6 mt-1.5 ml-2 text-xs">
              <div className="space-y-1">
                <p className="font-bold uppercase text-[10px] text-gray-600">Column A</p>
                {q.matchPairs.map((p, i) => (
                  <div key={i} className="flex gap-1.5">
                    <span className="font-semibold w-4">{i + 1}.</span>
                    <span>{p.left}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <p className="font-bold uppercase text-[10px] text-gray-600">Column B</p>
                {q.matchPairs.map((p, i) => (
                  <div key={i} className="flex gap-1.5">
                    <span className="font-semibold w-4">{String.fromCharCode(97 + i)}.</span>
                    <span>{p.right}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {q.internalChoice && (
            <div className="mt-1.5 ml-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-0.5">OR</p>
              <p className="text-sm leading-snug">{q.internalChoice}</p>
            </div>
          )}

          {!!q.answerLines && q.answerLines > 0 && (
            <div className="space-y-1 mt-1.5 opacity-40">
              {Array.from({ length: Math.min(q.answerLines, 10) }).map((_, i) => (
                <div key={i} className="border-b border-dashed border-black h-4 w-full" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NestedBoardPaper({ paper, answerKey }: QuestionPaperRenderProps) {
  const layout = paper.layoutProfile ?? { style: "nested_board" as const };
  const marksOnHeader = layout.marksOnSectionHeader !== false;
  const timeMarks =
    paper.timeMarksLine ||
    `Time : ${paper.durationMinutes ? `${Math.round(paper.durationMinutes / 60)} Hours` : "___"} Max. Marks : ${paper.totalMarks || "___"}`;

  return (
    <div className="space-y-6">
      <div
        id="qp-paper-content"
        className="bg-white text-black font-serif w-full max-w-4xl mx-auto shadow-2xl p-8 md:p-12 rounded-sm print-a4 text-[13px]"
      >
        {/* Board-style header */}
        <div className="mb-4">
          {layout.showSeatNo && (
            <div className="flex justify-end mb-3">
              <div className="text-right text-xs">
                <span>P.T.O.</span>
                <div className="mt-4 border-b border-black w-28 ml-auto text-left pl-1">Seat No.</div>
              </div>
            </div>
          )}

          {paper.paperCodeLine && (
            <p className="text-center text-[13px] font-semibold uppercase leading-snug mb-1">
              {paper.paperCodeLine}
            </p>
          )}

          {!paper.paperCodeLine && (
            <p className="text-center text-[13px] font-semibold uppercase leading-snug mb-1">
              {paper.board} &mdash; {paper.className} &mdash; {paper.subject.toUpperCase()}
            </p>
          )}

          <p className="text-center text-[13px] font-semibold mb-3">{timeMarks}</p>

          {paper.generalInstructions.length > 0 && (
            <div className="text-[12px] leading-relaxed">
              <span className="font-semibold">{layout.instructionsPrefix ?? "Note :—"} </span>
              {paper.generalInstructions.map((ins, i) => (
                <span key={i}>
                  {ins.startsWith("(") ? ins : `(${ROMAN[i] ?? i + 1}) ${ins}`}
                  {i < paper.generalInstructions.length - 1 ? " " : ""}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-4 mt-6">
          {paper.sections.map((section, si) => (
            <div key={si} className="page-break-inside-avoid">
              <p className="font-bold text-[13px] mb-2 leading-snug">{formatSectionHeader(section)}</p>
              <div className="ml-1">
                {section.questions.map((q, qi) => (
                  <div key={qi}>
                    <NestedQuestionBlock q={q} layout={layout} showMarks={!marksOnHeader} />
                    {section.answerRule === "any one" && qi < section.questions.length - 1 && (
                      <p className="text-center font-bold text-xs my-2 tracking-widest">OR</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {answerKey.length > 0 && (
        <div
          id="qp-answer-content"
          className="bg-white text-black font-serif w-full max-w-4xl mx-auto shadow-2xl p-8 md:p-12 rounded-sm print-a4"
        >
          <div className="text-center border-b-2 border-black pb-2 mb-4">
            <h1 className="text-lg font-bold uppercase">Answer Key</h1>
            <p className="text-xs font-semibold mt-1">
              {paper.board} &middot; {paper.className} &middot; {paper.subject}
            </p>
          </div>
          <div className="space-y-3 text-[12px]">
            {paper.sections.map((section, si) => {
              const entries = answerKey.filter(
                (a) => a.section === section.name || a.section === section.headerLine,
              );
              if (entries.length === 0) return null;
              return (
                <div key={si}>
                  <p className="font-bold mb-1">{formatSectionHeader(section)}</p>
                  {entries.map((a, ai) => (
                    <div key={ai} className="flex gap-2 ml-2 mb-0.5">
                      <span className="font-semibold shrink-0">{a.number}</span>
                      <span>{a.answer}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function GenericPaper({ paper, answerKey }: QuestionPaperRenderProps) {
  return (
    <div className="space-y-6">
      <div
        id="qp-paper-content"
        className="bg-white text-black font-serif w-full max-w-4xl mx-auto shadow-2xl p-6 md:p-10 rounded-sm print-a4"
      >
        <div className="text-center border-b-2 border-black pb-3 mb-3">
          <h1 className="text-lg md:text-xl font-bold uppercase tracking-wide">{paper.board}</h1>
          <p className="text-sm font-semibold mt-0.5">
            {paper.className} &middot; {paper.subject}
          </p>
          {paper.title && <p className="text-xs italic mt-0.5">{paper.title}</p>}
          <div className="flex justify-between text-xs font-semibold mt-2">
            <span>Time: {paper.durationMinutes ? `${paper.durationMinutes} min` : "___"}</span>
            <span>Maximum Marks: {paper.totalMarks || "___"}</span>
          </div>
        </div>

        {paper.generalInstructions.length > 0 && (
          <div className="mb-4 border border-gray-300 rounded-md p-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide mb-1">General Instructions</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {paper.generalInstructions.map((ins, i) => (
                <li key={i} className="text-xs leading-snug">{ins}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-5">
          {paper.sections.map((section, si) => (
            <div key={si} className="page-break-inside-avoid">
              <div className="flex items-baseline justify-between border-b border-black/70 pb-1 mb-2">
                <h2 className="text-sm font-bold uppercase tracking-wide">{section.name}</h2>
                {section.description && (
                  <span className="text-[11px] italic text-gray-600 ml-3 text-right">{section.description}</span>
                )}
              </div>
              <div className="space-y-3 pl-1">
                {section.questions.map((q, qi) => (
                  <GenericQuestionBlock key={qi} q={q} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {answerKey.length > 0 && (
        <div
          id="qp-answer-content"
          className="bg-white text-black font-serif w-full max-w-4xl mx-auto shadow-2xl p-6 md:p-10 rounded-sm print-a4"
        >
          <div className="text-center border-b-2 border-black pb-2 mb-3">
            <h1 className="text-lg font-bold uppercase tracking-wide">Answer Key</h1>
            <p className="text-xs font-semibold mt-0.5">
              {paper.board} &middot; {paper.className} &middot; {paper.subject}
            </p>
          </div>
          <div className="space-y-2">
            {paper.sections.map((section, si) => {
              const entries = answerKey.filter((a) => a.section === section.name);
              if (entries.length === 0) return null;
              return (
                <div key={si}>
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-700 mb-0.5">{section.name}</h3>
                  <div className="border border-gray-300 rounded-md p-2 space-y-0.5">
                    {entries.map((a, ai) => (
                      <div key={ai} className="flex gap-2 text-xs leading-snug">
                        <span className="font-bold shrink-0 text-gray-600">{a.number}.</span>
                        <span>{a.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function QuestionPaperRender({ paper, answerKey }: QuestionPaperRenderProps) {
  const isNested =
    paper.layoutProfile?.style === "nested_board" ||
    paper.sections.some((s) => s.headerLine || s.sectionMarks != null);

  if (isNested) {
    return <NestedBoardPaper paper={paper} answerKey={answerKey} />;
  }
  return <GenericPaper paper={paper} answerKey={answerKey} />;
}
