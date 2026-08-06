import assert from "node:assert/strict";
import test from "node:test";
import { courses } from "../src/course-finder/course-finder-data.js";
import { recommendCourse } from "../src/course-finder/course-finder-scoring.js";

const allEssential = {
  confidence: "very-confident",
  schedule: "very-flexible",
  priority: "lowest-price",
  goal: "legal-minimum"
};

const allFlexible = {
  confidence: "fairly-confident",
  schedule: "around-school-work",
  priority: "practice-flexibility",
  goal: "properly-prepared"
};

const allVip = {
  confidence: "not-confident",
  schedule: "maximum-control",
  priority: "choice-control",
  goal: "premium-experience"
};

test("recommends Essential for all Essential answers", () => {
  assert.equal(recommendCourse(allEssential).courseId, "essential");
});

test("recommends Flexible for all Flexible answers", () => {
  assert.equal(recommendCourse(allFlexible).courseId, "flexible");
});

test("recommends VIP for clear premium intent", () => {
  assert.equal(recommendCourse(allVip).courseId, "vip");
});

test("does not recommend VIP from one premium answer alone", () => {
  const result = recommendCourse({
    confidence: "fairly-confident",
    schedule: "maximum-control",
    priority: "practice-flexibility",
    goal: "properly-prepared"
  });

  assert.equal(result.courseId, "flexible");
});

test("defaults mixed answers to Flexible", () => {
  const result = recommendCourse({
    confidence: "very-confident",
    schedule: "around-school-work",
    priority: "lowest-price",
    goal: "properly-prepared"
  });

  assert.equal(result.courseId, "flexible");
});

test("breaks tied scores toward Flexible", () => {
  const result = recommendCourse({
    confidence: "very-confident",
    schedule: "maximum-control",
    priority: "lowest-price",
    goal: "properly-prepared"
  });

  assert.equal(result.scores.essential, result.scores.flexible);
  assert.equal(result.courseId, "flexible");
});

test("recommends Flexible for a confident user with an inflexible schedule", () => {
  const result = recommendCourse({
    confidence: "very-confident",
    schedule: "around-school-work",
    priority: "practice-flexibility",
    goal: "properly-prepared"
  });

  assert.equal(result.courseId, "flexible");
});

test("recommends Flexible for a price-sensitive but low-confidence user", () => {
  const result = recommendCourse({
    confidence: "not-confident",
    schedule: "around-school-work",
    priority: "lowest-price",
    goal: "properly-prepared"
  });

  assert.equal(result.courseId, "flexible");
});

test("returns answer-derived reasons", () => {
  const result = recommendCourse(allFlexible);

  assert.ok(
    result.reasons.includes(
      "You need lessons that work around your schedule."
    )
  );
  assert.equal(result.reasons.length, 3);
});

test("keeps course price and ID mappings available", () => {
  assert.equal(courses.essential.price, 1000);
  assert.equal(courses.flexible.registrationUrl, "/register?course=flexible");
  assert.equal(courses.vip.id, "vip");
});
