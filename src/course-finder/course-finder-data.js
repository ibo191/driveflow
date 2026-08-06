/**
 * @typedef {"essential" | "flexible" | "vip"} CourseId
 * @typedef {"confidence" | "schedule" | "priority" | "goal"} QuestionId
 * @typedef {{
 *   id: CourseId,
 *   name: string,
 *   price: number,
 *   registrationUrl: string,
 *   headline: string,
 *   benefits: string[],
 *   bestSuitedFor: string[]
 * }} Course
 * @typedef {{
 *   id: string,
 *   label: string,
 *   icon: string,
 *   scores: Partial<Record<CourseId, number>>,
 *   reason: string,
 *   vipIntent?: boolean,
 *   essentialSignal?: "confidence" | "schedule" | "price" | "minimum"
 * }} AnswerOption
 * @typedef {{id: QuestionId, prompt: string, answers: AnswerOption[]}} Question
 */

/** @type {Record<CourseId, Course>} */
export const courses = {
  essential: {
    id: "essential",
    name: "Essential",
    price: 1000,
    registrationUrl: "/register?course=essential",
    headline: "Essential fits your budget and flexible schedule.",
    benefits: [
      "Legally required minimum number of driving hours",
      "Less flexible lesson times",
      "Student adapts to available lesson capacity",
      "Lowest-priced option"
    ],
    bestSuitedFor: [
      "Confident learners",
      "Price-sensitive students",
      "Students with flexible weekly availability",
      "Students comfortable with the legally required minimum"
    ]
  },
  flexible: {
    id: "flexible",
    name: "Flexible",
    price: 1200,
    registrationUrl: "/register?course=flexible",
    headline:
      "Flexible gives you the best balance of practice, flexibility and price.",
    benefits: [
      "Flexible scheduling",
      "10 additional driving hours",
      "More practice and preparation",
      "Better balance of flexibility, confidence, and price"
    ],
    bestSuitedFor: [
      "Most first-time drivers",
      "Students who need lessons around school or work",
      "Students who want more practice",
      "Moderately confident or uncertain students"
    ]
  },
  vip: {
    id: "vip",
    name: "VIP",
    price: 2000,
    registrationUrl: "/register?course=vip",
    headline: "VIP gives you the control and personalised experience you need.",
    benefits: [
      "Maximum scheduling flexibility",
      "Greater choice of cars",
      "Greater choice of instructors",
      "Personalised premium experience"
    ],
    bestSuitedFor: [
      "Students with demanding schedules",
      "Students who want instructor or car choice",
      "Students who strongly value convenience and control"
    ]
  }
};

/** @type {Question[]} */
export const courseQuestions = [
  {
    id: "confidence",
    prompt: "How confident do you feel about learning to drive?",
    answers: [
      {
        id: "very-confident",
        label: "Very confident — I expect to learn quickly",
        icon: "route",
        scores: { essential: 2, flexible: 1 },
        reason: "You feel confident about learning quickly.",
        essentialSignal: "confidence"
      },
      {
        id: "fairly-confident",
        label: "Fairly confident, but I want enough practice",
        icon: "check",
        scores: { flexible: 2 },
        reason: "You want enough practice while building confidence."
      },
      {
        id: "not-confident",
        label: "Not very confident — I want extra support",
        icon: "heart",
        scores: { flexible: 3 },
        reason: "You want extra support before test day."
      }
    ]
  },
  {
    id: "schedule",
    prompt: "How flexible is your weekly schedule?",
    answers: [
      {
        id: "very-flexible",
        label: "Very flexible — I can adapt to available lesson times",
        icon: "clock",
        scores: { essential: 2, flexible: 1 },
        reason: "You can adapt to available lesson times.",
        essentialSignal: "schedule"
      },
      {
        id: "around-school-work",
        label: "I need lessons around school, work or activities",
        icon: "calendar",
        scores: { flexible: 3 },
        reason: "You need lessons that work around your schedule."
      },
      {
        id: "maximum-control",
        label: "I need maximum control over lesson times",
        icon: "calendar",
        scores: { vip: 3, flexible: 1 },
        reason: "You need maximum control over lesson times.",
        vipIntent: true
      }
    ]
  },
  {
    id: "priority",
    prompt: "What matters most to you?",
    answers: [
      {
        id: "lowest-price",
        label: "Keeping the price as low as possible",
        icon: "flag",
        scores: { essential: 3 },
        reason: "Keeping the price low is a priority.",
        essentialSignal: "price"
      },
      {
        id: "practice-flexibility",
        label: "Having more practice and flexibility",
        icon: "car",
        scores: { flexible: 3 },
        reason: "You value more practice and flexible scheduling."
      },
      {
        id: "choice-control",
        label: "Choosing my car, instructor and preferred times",
        icon: "car",
        scores: { vip: 4 },
        reason: "You want more choice over the learning experience.",
        vipIntent: true
      }
    ]
  },
  {
    id: "goal",
    prompt: "Which statement sounds most like you?",
    answers: [
      {
        id: "legal-minimum",
        label: "I want the legal minimum and can adapt",
        icon: "flag",
        scores: { essential: 3 },
        reason: "You are comfortable with the legal minimum.",
        essentialSignal: "minimum"
      },
      {
        id: "properly-prepared",
        label: "I want to feel properly prepared for the test",
        icon: "check",
        scores: { flexible: 3 },
        reason: "You want to feel properly prepared for the test."
      },
      {
        id: "premium-experience",
        label: "I want a personalised premium experience",
        icon: "heart",
        scores: { vip: 4 },
        reason: "You want a personalised premium experience.",
        vipIntent: true
      }
    ]
  }
];

export function formatCoursePrice(price) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(price);
}
