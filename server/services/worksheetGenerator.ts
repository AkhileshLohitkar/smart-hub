import { openai } from "../openaiClient";

export type WorksheetGeneratorInput = {
  className: string;
  board: string;
  subject: string;
  chapter?: string;
  topic: string;
  difficulty: string;
  length?: number;
  questionTypes?: string[];
  ncertBook?: string;
  myNotesContext?: string;
  textbookInstruction?: string;
};

export async function generateWorksheetContent(
  input: WorksheetGeneratorInput,
) {
  const questionTypes = input.questionTypes ?? [];

  const isYoungClass = [
    "Nursery",
    "KG 1",
    "KG 2",
    "Grade 1",
    "Grade 2",
    "Grade 3",
    "Grade 4",
    "Grade 5",
  ].includes(input.className);

  const questionTypeMap: Record<string, string> = {
    mcq: "mcq (Multiple Choice Questions with 4 options)",
    fill_blanks: "fill_blanks (Fill in the Blanks)",
    true_false:
      "true_false (True or False statements - use mcq type with options ['True', 'False'])",
    one_word:
      "one_word (One Word Answer questions - use short_answer type with answerSpaceLines: 1)",
    application_based:
      "application_based (Application-Based Questions - real-world scenarios, case studies, and problem-solving situations)",
    short_answer: "short_answer (Short Answer Questions)",
    long_answer: "long_answer (Long Answer Questions)",
    match: "match (Match the Following with matchPairs)",
    identify_sketch:
      "identify_sketch (Identify from Sketch - use short_answer type)",
  };

  const requestedTypes =
    questionTypes.length > 0
      ? `\nREQUIRED QUESTION TYPES: The worksheet MUST include sections for ONLY these question types: ${questionTypes
          .map((t) => questionTypeMap[t] || t)
          .join(", ")}.`
      : "";

  const textbookInstruction = input.textbookInstruction ?? "";

  const textbookLabel = input.ncertBook
    ? `\nNCERT/Prescribed Textbook: ${input.ncertBook}`
    : "";

  const myNotesContext = input.myNotesContext ?? "";

  const prompt = `Generate a printable educational worksheet with the following requirements:

Class/Standard: ${input.className}
Education Board: ${input.board}
Subject: ${input.subject}${textbookLabel}
Chapter: ${input.chapter || "Not specified"}
Topic: ${input.topic}
Difficulty: ${input.difficulty}
Approximate Number of questions: ${Math.min(input.length ?? 10, 30)}
${requestedTypes}
${textbookInstruction}
${myNotesContext}

The output must be strictly in JSON format matching this structure:

{
  "title": "Worksheet Title",
  "instructions": "General instructions for the student",
  "graphics": [
    {
      "description": "A simple, child-friendly, colorful line-art or minimalist illustration related to the topic",
      "position": "top-right",
      "altText": "Short description of the graphic"
    }
  ],
  ${
    isYoungClass
      ? '"graphicEmojis": ["🌻", "✏️"],'
      : ""
  }
  "sections": [
    {
      "type": "mcq" | "fill_blanks" | "short_answer" | "long_answer" | "match",
      "title": "Section Title",
      "questions": [
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "answerSpaceLines": 2,
          "matchPairs": [
            {
              "left": "Item from Column A",
              "right": "Matching item from Column B"
            }
          ]
        }
      ]
    }
  ],
  "answerKey": [
    {
      "sectionIndex": 0,
      "questionIndex": 0,
      "answer": "The correct answer"
    }
  ]
}

IMPORTANT RULES:

1. Include 2-3 colorful, minimalist, education-themed graphic descriptions relevant to the topic.

2. For match questions, use matchPairs with 4-6 pairs.

3. For fill_blanks, set answerSpaceLines to 0.

4. For short_answer, use answerSpaceLines 1-2.

5. For long_answer, use answerSpaceLines 3-4.

6. For mcq, set answerSpaceLines to 0.

7. For true_false, use mcq with options ["True", "False"].

8. For one_word, use short_answer with answerSpaceLines 1.

9. For application_based, use long_answer with answerSpaceLines 4.

10. For identify_sketch, use short_answer with answerSpaceLines 2.

11. Use only ASCII math operators:
+ - * /
Do not use Unicode multiplication or division symbols.

12. Generate a COMPLETE answerKey for ALL questions.

13. Keep the worksheet compact and suitable for A4 paper.

14. Maximum number of questions is 30.

${
  isYoungClass
    ? `
15. This is for a YOUNG LEARNER (${input.className}).
Use simple, child-friendly language and include suitable graphicEmojis.
`
    : ""
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    messages: [
      {
        role: "system",
        content:
          "You are an expert Indian educator who designs high-quality, syllabus-aligned worksheets based on NCERT, Balbharati (Maharashtra), SCERT AP, TN SCERT and other board-prescribed textbooks. When a textbook and chapter are specified, generate questions strictly from that material. Always include a complete answer key.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = JSON.parse(
    response.choices[0]?.message?.content || "{}",
  );

  return content;
}