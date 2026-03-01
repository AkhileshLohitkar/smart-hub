export const NCERT_BOOKS: Record<string, Record<string, string[]>> = {
  "Grade 1": {
    "Mathematics": ["Math-Magic (Book 1)"],
    "English": ["Marigold (Book 1)", "Raindrops (Supplementary Reader)"],
    "Hindi": ["Rimjhim (Part 1)"],
    "EVS": ["Looking Around (Part 1)"],
  },
  "Grade 2": {
    "Mathematics": ["Math-Magic (Book 2)"],
    "English": ["Marigold (Book 2)", "Raindrops (Supplementary Reader)"],
    "Hindi": ["Rimjhim (Part 2)"],
    "EVS": ["Looking Around (Part 2)"],
  },
  "Grade 3": {
    "Mathematics": ["Math-Magic (Book 3)"],
    "English": ["Marigold (Book 3)"],
    "Hindi": ["Rimjhim (Part 3)"],
    "EVS": ["Looking Around (Part 3)"],
  },
  "Grade 4": {
    "Mathematics": ["Math-Magic (Book 4)"],
    "English": ["Marigold (Book 4)"],
    "Hindi": ["Rimjhim (Part 4)"],
    "EVS": ["Looking Around (Part 4)"],
  },
  "Grade 5": {
    "Mathematics": ["Math-Magic (Book 5)"],
    "English": ["Marigold (Book 5)"],
    "Hindi": ["Rimjhim (Part 5)"],
    "EVS": ["Looking Around (Part 5)"],
  },
  "Grade 6": {
    "Mathematics": ["Mathematics (Textbook for Class VI)"],
    "Science": ["Science (Textbook for Class VI)"],
    "English": ["Honeysuckle", "A Pact with the Sun (Supplementary Reader)"],
    "Hindi": ["Vasant (Part 1)", "Durva (Part 1)", "Bal Ram Katha"],
    "Social Science": ["Our Past – I (History)", "The Earth: Our Habitat (Geography)", "Social and Political Life – I (Civics)"],
    "Sanskrit": ["Ruchira (Part 1)"],
  },
  "Grade 7": {
    "Mathematics": ["Mathematics (Textbook for Class VII)"],
    "Science": ["Science (Textbook for Class VII)"],
    "English": ["Honeycomb", "An Alien Hand (Supplementary Reader)"],
    "Hindi": ["Vasant (Part 2)", "Durva (Part 2)", "Bal Mahabharat Katha"],
    "Social Science": ["Our Past – II (History)", "Our Environment (Geography)", "Social and Political Life – II (Civics)"],
    "Sanskrit": ["Ruchira (Part 2)"],
  },
  "Grade 8": {
    "Mathematics": ["Mathematics (Textbook for Class VIII)"],
    "Science": ["Science (Textbook for Class VIII)"],
    "English": ["Honeydew", "It So Happened (Supplementary Reader)"],
    "Hindi": ["Vasant (Part 3)", "Durva (Part 3)", "Bharat Ki Khoj"],
    "Social Science": ["Our Past – III (History)", "Resources and Development (Geography)", "Social and Political Life – III (Civics)"],
    "Sanskrit": ["Ruchira (Part 3)"],
  },
  "Grade 9": {
    "Mathematics": ["Mathematics (Textbook for Class IX)"],
    "Science": ["Science (Textbook for Class IX)"],
    "English": ["Beehive", "Moments (Supplementary Reader)"],
    "Hindi": ["Kshitij (Part 1)", "Sparsh (Part 1)", "Kritika (Part 1)", "Sanchayan (Part 1)"],
    "Social Science": ["India and the Contemporary World – I (History)", "Contemporary India – I (Geography)", "Democratic Politics – I (Civics)", "Economics (Textbook for Class IX)"],
    "Sanskrit": ["Shemushi (Part 1)"],
  },
  "Grade 10": {
    "Mathematics": ["Mathematics (Textbook for Class X)"],
    "Science": ["Science (Textbook for Class X)"],
    "English": ["First Flight", "Footprints without Feet (Supplementary Reader)"],
    "Hindi": ["Kshitij (Part 2)", "Sparsh (Part 2)", "Kritika (Part 2)", "Sanchayan (Part 2)"],
    "Social Science": ["India and the Contemporary World – II (History)", "Contemporary India – II (Geography)", "Democratic Politics – II (Civics)", "Understanding Economic Development"],
    "Sanskrit": ["Shemushi (Part 2)"],
  },
};

export function findNcertBooks(className: string, subject: string): string[] {
  const gradeBooks = NCERT_BOOKS[className];
  if (!gradeBooks) return [];

  const subjectLower = subject.toLowerCase().trim();
  for (const [key, books] of Object.entries(gradeBooks)) {
    if (key.toLowerCase() === subjectLower) return books;
    if (subjectLower.includes(key.toLowerCase()) || key.toLowerCase().includes(subjectLower)) return books;
  }

  if (subjectLower.includes("math")) return gradeBooks["Mathematics"] || [];
  if (subjectLower.includes("sci") || subjectLower.includes("physics") || subjectLower.includes("chemistry") || subjectLower.includes("biology")) return gradeBooks["Science"] || [];
  if (subjectLower.includes("eng")) return gradeBooks["English"] || [];
  if (subjectLower.includes("hindi")) return gradeBooks["Hindi"] || [];
  if (subjectLower.includes("social") || subjectLower.includes("history") || subjectLower.includes("geography") || subjectLower.includes("civics")) return gradeBooks["Social Science"] || [];
  if (subjectLower.includes("sanskrit")) return gradeBooks["Sanskrit"] || [];
  if (subjectLower.includes("evs") || subjectLower.includes("environmental")) return gradeBooks["EVS"] || [];

  return [];
}
