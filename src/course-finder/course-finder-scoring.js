import { courseQuestions, courses } from "./course-finder-data.js";

const initialScores = {
  essential: 0,
  flexible: 0,
  vip: 0
};

export function getAnswer(questionId, answerId) {
  const question = courseQuestions.find((item) => item.id === questionId);
  return question?.answers.find((answer) => answer.id === answerId);
}

export function getCompletedAnswers(answers) {
  return courseQuestions.flatMap((question) => {
    const answerId = answers[question.id];
    const answer = answerId ? getAnswer(question.id, answerId) : undefined;
    return answer ? [answer] : [];
  });
}

export function scoreAnswers(answers) {
  return getCompletedAnswers(answers).reduce(
    (scores, answer) => ({
      essential: scores.essential + (answer.scores.essential ?? 0),
      flexible: scores.flexible + (answer.scores.flexible ?? 0),
      vip: scores.vip + (answer.scores.vip ?? 0)
    }),
    { ...initialScores }
  );
}

export function recommendCourse(answers, previousCourseId) {
  const selectedAnswers = getCompletedAnswers(answers);
  const scores = scoreAnswers(answers);
  const vipSignals = selectedAnswers.filter((answer) => answer.vipIntent).length;
  const essentialSignals = new Set(
    selectedAnswers.flatMap((answer) =>
      answer.essentialSignal ? [answer.essentialSignal] : []
    )
  );
  const highestScore = Math.max(scores.essential, scores.flexible, scores.vip);
  const leaders = Object.keys(scores).filter(
    (courseId) => scores[courseId] === highestScore
  );

  let courseId = "flexible";

  if (leaders.length === 1) {
    courseId = leaders[0];
  }

  if (courseId === "vip" && vipSignals < 2) {
    courseId = "flexible";
  }

  if (
    courseId === "essential" &&
    !(
      essentialSignals.has("confidence") &&
      essentialSignals.has("schedule") &&
      essentialSignals.has("price") &&
      essentialSignals.has("minimum")
    )
  ) {
    courseId = "flexible";
  }

  const closestAlternativeId = getClosestAlternative(courseId, scores);

  return {
    courseId,
    scores,
    reasons: selectedAnswers.map((answer) => answer.reason).slice(0, 3),
    closestAlternativeId,
    tradeoff: getTradeoff(courseId, closestAlternativeId),
    resultChangedAfterBackNavigation:
      Boolean(previousCourseId) && previousCourseId !== courseId
  };
}

function getClosestAlternative(courseId, scores) {
  const alternatives = Object.keys(scores)
    .filter((id) => id !== courseId)
    .sort((a, b) => scores[b] - scores[a]);

  if (courseId === "flexible") {
    return scores.vip > scores.essential ? "vip" : "essential";
  }

  return alternatives[0];
}

function getTradeoff(courseId, alternativeId) {
  const priceDifference = Math.abs(
    courses[courseId].price - courses[alternativeId].price
  );
  const formattedDifference = new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(priceDifference);

  if (courseId === "flexible" && alternativeId === "essential") {
    return `Essential costs ${formattedDifference} less, but does not include flexible scheduling or 10 additional driving hours.`;
  }

  if (courseId === "flexible" && alternativeId === "vip") {
    return `VIP adds maximum scheduling control and instructor and vehicle choice, but costs ${formattedDifference} more.`;
  }

  if (courseId === "essential") {
    return `Flexible costs ${formattedDifference} more and includes flexible scheduling and 10 additional driving hours.`;
  }

  return `Flexible costs ${formattedDifference} less, but offers less control over lesson times, vehicles and instructors.`;
}
