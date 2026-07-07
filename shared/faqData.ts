export type FaqAnswer =
  | { type: "text"; text: string }
  | { type: "list"; intro: string; items: string[] };

export type FaqItem = {
  id: number;
  question: string;
  answer: FaqAnswer;
};

/** All 11 FAQs — exact wording from FAQ's Qik Worksheet.pdf */
export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 1,
    question: "What is Qik Worksheet?",
    answer: {
      type: "text",
      text: "Qik Worksheet is an online platform that enables parents, teachers, tutors, and schools to create personalized practice worksheets in minutes. Our worksheets are designed to reinforce learning through regular practice.",
    },
  },
  {
    id: 2,
    question: "Who can use Qik Worksheet?",
    answer: {
      type: "list",
      intro: "Qik Worksheet is designed for:",
      items: [
        "Parents",
        "School teachers",
        "Tuition teachers",
        "Homeschool educators",
        "Coaching institutes",
        "Students from primary to secondary grades",
      ],
    },
  },
  {
    id: 3,
    question: "How does Qik Worksheet work?",
    answer: {
      type: "text",
      text: "Simply choose a subject, topic, grade level. Qik Worksheet generates ready-to-use practice worksheets that can be printed or shared digitally.",
    },
  },
  {
    id: 4,
    question: "Are the worksheets aligned with the school curriculum?",
    answer: {
      type: "text",
      text: "Yes. Our worksheets are designed to support curriculum-based learning and help students strengthen classroom concepts through additional practice.",
    },
  },
  {
    id: 5,
    question: "Can I download and print worksheets?",
    answer: {
      type: "text",
      text: "Absolutely. Worksheets can be downloaded as printable PDFs, making them ideal for classroom activities and home practice.",
    },
  },
  {
    id: 6,
    question: "Is Qik Worksheet suitable for schools?",
    answer: {
      type: "text",
      text: "Yes. Schools, coaching institutes, and teachers can use Qik Worksheet to quickly create engaging practice material for entire classrooms or individual students.",
    },
  },
  {
    id: 7,
    question: "Do parents need teaching experience to use the platform?",
    answer: {
      type: "text",
      text: "No. Qik Worksheet is designed to be simple and intuitive, allowing parents to create effective practice worksheets without any prior teaching experience.",
    },
  },
  {
    id: 8,
    question: "Why is regular worksheet practice important?",
    answer: {
      type: "list",
      intro: "Consistent practice helps students:",
      items: [
        "Strengthen concepts",
        "Improve problem-solving skills",
        "Build confidence",
        "Prepare for exams",
        "Develop better learning habits",
      ],
    },
  },
  {
    id: 9,
    question: "Can students use Qik Worksheet independently?",
    answer: {
      type: "text",
      text: "Yes. Students can complete worksheets independently or with guidance from parents or teachers, depending on their age and learning level.",
    },
  },
  {
    id: 10,
    question: "Is my data secure?",
    answer: {
      type: "text",
      text: "Yes. We prioritize user privacy and protect personal information using industry-standard security practices.",
    },
  },
  {
    id: 11,
    question: "How often are new worksheets added?",
    answer: {
      type: "text",
      text: "Our worksheet library is continuously updated with new topics, question formats, and curriculum enhancements to keep learning fresh and relevant.",
    },
  },
];
