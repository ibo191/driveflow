import {
  courseQuestions,
  courses,
  formatCoursePrice
} from "./course-finder/course-finder-data.js";
import { trackCourseFinderEvent } from "./course-finder/course-finder-analytics.js";
import { recommendCourse } from "./course-finder/course-finder-scoring.js";

const state = {
  hasStarted: false,
  currentIndex: 0,
  answers: {},
  isComplete: false,
  comparisonOpen: false,
  previousCourseId: undefined,
  resultChangedAfterBackNavigation: false
};

const icons = {
  calendar: "calendar",
  car: "car",
  check: "check",
  clock: "clock",
  flag: "flag",
  heart: "heart",
  route: "route"
};

const root = document.querySelector("#course-finder");

trackCourseFinderEvent("course_finder_viewed");
render();

function render() {
  if (!root) {
    return;
  }

  if (!state.hasStarted) {
    root.innerHTML = renderIntro();
  } else if (state.isComplete) {
    root.innerHTML = renderResult();
  } else {
    root.innerHTML = renderQuestion();
  }

  bindEvents();
}

function bindEvents() {
  root.querySelector("[data-start]")?.addEventListener("click", startFinder);
  root.querySelector("[data-next]")?.addEventListener("click", continueFinder);
  root.querySelector("[data-back]")?.addEventListener("click", goBack);
  root.querySelector("[data-restart]")?.addEventListener("click", restart);
  root.querySelector("[data-compare]")?.addEventListener("click", openComparison);
  root
    .querySelector("[data-select-course]")
    ?.addEventListener("click", selectRecommendedCourse);
  root
    .querySelector("[data-mobile-select-course]")
    ?.addEventListener("click", selectRecommendedCourse);

  root.querySelectorAll("input[type='radio']").forEach((input) => {
    input.addEventListener("change", () => {
      const question = courseQuestions[state.currentIndex];
      const answer = question.answers.find((item) => item.id === input.value);

      if (answer) {
        state.answers[question.id] = answer.id;
        trackCourseFinderEvent("course_finder_question_answered", {
          question_id: question.id,
          question_number: state.currentIndex + 1,
          answer_id: answer.id
        });
        render();
      }
    });
  });

  focusCurrentHeading();
}

function startFinder() {
  state.hasStarted = true;
  trackCourseFinderEvent("course_finder_started");
  render();
}

function continueFinder() {
  const question = courseQuestions[state.currentIndex];

  if (!state.answers[question.id]) {
    return;
  }

  if (state.currentIndex === courseQuestions.length - 1) {
    const recommendation = recommendCourse(state.answers, state.previousCourseId);
    state.previousCourseId = recommendation.courseId;
    state.resultChangedAfterBackNavigation =
      state.resultChangedAfterBackNavigation ||
      recommendation.resultChangedAfterBackNavigation;
    state.isComplete = true;
    trackCourseFinderEvent("course_finder_completed");
    trackCourseFinderEvent("course_recommended", {
      recommended_course: recommendation.courseId,
      recommendation_score: recommendation.scores,
      result_changed_after_back_navigation:
        recommendation.resultChangedAfterBackNavigation
    });
    render();
    return;
  }

  state.currentIndex += 1;
  render();
}

function goBack() {
  if (state.isComplete) {
    state.isComplete = false;
    state.currentIndex = courseQuestions.length - 1;
  } else {
    state.currentIndex = Math.max(0, state.currentIndex - 1);
  }

  render();
}

function restart() {
  state.hasStarted = false;
  state.currentIndex = 0;
  state.answers = {};
  state.isComplete = false;
  state.comparisonOpen = false;
  state.previousCourseId = undefined;
  state.resultChangedAfterBackNavigation = false;
  trackCourseFinderEvent("course_finder_restarted");
  render();
}

function openComparison() {
  state.comparisonOpen = true;
  const recommendation = recommendCourse(state.answers, state.previousCourseId);
  trackCourseFinderEvent("course_comparison_opened", {
    recommended_course: recommendation.courseId
  });
  render();
  window.setTimeout(() => {
    document
      .getElementById("course-comparison")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}

function selectRecommendedCourse() {
  const recommendation = recommendCourse(state.answers, state.previousCourseId);
  trackCourseFinderEvent("recommended_course_selected", {
    selected_course: recommendation.courseId,
    recommended_course: recommendation.courseId,
    recommendation_score: recommendation.scores,
    result_changed_after_back_navigation:
      state.resultChangedAfterBackNavigation
  });
}

function focusCurrentHeading() {
  if (!state.hasStarted) {
    return;
  }

  window.setTimeout(() => {
    root.querySelector("[data-focus-target]")?.focus();
  }, 0);
}

function renderIntro() {
  return `
    <div class="finder-intro">
      <div>
        <p class="eyebrow">Find Your Driveflow Course</p>
        <h2 id="course-finder-title">Not sure which course is right for you?</h2>
        <p>Answer 4 quick questions and get a recommendation based on your schedule, confidence and driving goals.</p>
        <button class="button" data-start type="button">Find my course <span aria-hidden="true">-></span></button>
        <p class="trust-note">Takes less than one minute. No contact details required.</p>
      </div>
      <div aria-label="Available courses" class="course-price-strip">
        ${Object.values(courses)
          .map(
            (course) => `
              <article>
                <h3>${course.name}</h3>
                <p>${formatCoursePrice(course.price)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderQuestion() {
  const question = courseQuestions[state.currentIndex];
  const selectedAnswer = state.answers[question.id];
  const currentStep = state.currentIndex + 1;
  const progress = (currentStep / courseQuestions.length) * 100;
  const answeredCount = courseQuestions.filter((item) => state.answers[item.id])
    .length;

  return `
    <div class="finder-card" data-testid="question-card">
      <div class="finder-progress">
        <p aria-current="step">Question ${currentStep} of ${courseQuestions.length}</p>
        <div aria-label="Question ${currentStep} of ${courseQuestions.length}" aria-valuemax="${courseQuestions.length}" aria-valuemin="1" aria-valuenow="${currentStep}" class="progress-track" role="progressbar">
          <span style="width: ${progress}%"></span>
        </div>
      </div>
      <h2 class="question-title" data-focus-target tabindex="-1">${question.prompt}</h2>
      <fieldset class="answer-group">
        <legend class="sr-only">${question.prompt}</legend>
        ${question.answers
          .map((answer) => renderAnswer(question, answer, selectedAnswer))
          .join("")}
      </fieldset>
      <div class="finder-controls">
        <button class="button button-secondary" ${state.currentIndex === 0 ? "disabled" : ""} data-back type="button"><span aria-hidden="true"><-</span> Back</button>
        <span aria-live="polite" class="answer-count">${answeredCount} of ${courseQuestions.length} answered</span>
        <button class="button" ${selectedAnswer ? "" : "disabled"} data-next type="button">${state.currentIndex === courseQuestions.length - 1 ? "See result" : "Next"} <span aria-hidden="true">-></span></button>
      </div>
    </div>
  `;
}

function renderAnswer(question, answer, selectedAnswer) {
  const isSelected = selectedAnswer === answer.id;
  const inputId = `${question.id}-${answer.id}`;

  return `
    <label class="answer-card${isSelected ? " is-selected" : ""}" for="${inputId}">
      <input ${isSelected ? "checked" : ""} id="${inputId}" name="question-${state.currentIndex}" type="radio" value="${answer.id}">
      <span aria-hidden="true" class="answer-icon answer-icon-${icons[answer.icon]}"></span>
      <span class="answer-label">${answer.label}</span>
      <span aria-hidden="true" class="radio-indicator">${isSelected ? "✓" : ""}</span>
    </label>
  `;
}

function renderResult() {
  const recommendation = recommendCourse(state.answers, state.previousCourseId);
  const course = courses[recommendation.courseId];

  return `
    <div class="result-shell">
      <div class="result-grid">
        <div aria-live="polite" class="result-content">
          <p class="eyebrow">Your recommended course</p>
          <h2 data-focus-target tabindex="-1">${course.name} — ${formatCoursePrice(course.price)}</h2>
          <p class="result-headline">${course.headline}</p>
          <div aria-label="Recommendation reasons" class="reason-grid">
            ${recommendation.reasons
              .map(
                (reason) => `
                  <article class="reason-card">
                    <span aria-hidden="true" class="reason-check"></span>
                    <p>${reason}</p>
                  </article>
                `
              )
              .join("")}
          </div>
          <section aria-labelledby="included-title" class="included-panel">
            <h3 id="included-title">What's included</h3>
            <ul>
              ${course.benefits
                .map((benefit) => `<li><span aria-hidden="true" class="list-check"></span>${benefit}</li>`)
                .join("")}
            </ul>
          </section>
          <p class="tradeoff"><span aria-hidden="true" class="info-icon">i</span>${recommendation.tradeoff}</p>
          <div class="result-actions">
            <a class="button" data-select-course href="${course.registrationUrl}">Choose ${course.name} — ${formatCoursePrice(course.price)} <span aria-hidden="true">-></span></a>
            <a class="button button-outline" href="#courses">View full course details</a>
            <button class="text-button" data-compare type="button">Compare all courses</button>
            <button class="text-button" data-restart type="button">Change my answers</button>
          </div>
          <div class="mobile-recommendation-bar">
            <a class="button" data-mobile-select-course href="${course.registrationUrl}">Choose ${course.name} — ${formatCoursePrice(course.price)}</a>
          </div>
        </div>
        <aside aria-label="Recommendation highlight" class="result-visual">
          <img alt="A driving instructor and student beside a training car" height="560" src="/course-finder-route.png" width="1280">
          <div>
            <h3>Get behind the wheel</h3>
            <p>Start with the course that fits how you learn.</p>
          </div>
        </aside>
      </div>
      <div class="result-secondary-nav">
        <button class="button button-secondary" data-back type="button"><span aria-hidden="true"><-</span> Back</button>
      </div>
      ${state.comparisonOpen ? renderComparison() : ""}
    </div>
  `;
}

function renderComparison() {
  const rows = [
    { label: "Price", values: ["€1,000", "€1,200", "€2,000"] },
    { label: "Driving hours", values: ["Legal minimum", "+10 hours", "Premium plan"] },
    {
      label: "Scheduling flexibility",
      values: ["Available capacity", "Flexible", "Maximum control"]
    },
    { label: "Choice of instructor", values: ["Assigned", "Assigned", "Greater choice"] },
    { label: "Choice of vehicle", values: ["Standard", "Standard", "Greater choice"] },
    {
      label: "Best suited for",
      values: [
        "Confident, flexible learners",
        "Most first-time drivers",
        "Students wanting convenience and control"
      ]
    }
  ];

  return `
    <section aria-labelledby="course-comparison-title" class="comparison-section" id="course-comparison">
      <h3 id="course-comparison-title">Compare all courses</h3>
      <div class="comparison-grid">
        ${Object.values(courses)
          .map(
            (course, courseIndex) => `
              <article class="comparison-card">
                <h4>${course.name}</h4>
                ${rows
                  .map(
                    (row) => `
                      <p><span>${row.label}</span>${row.values[courseIndex]}</p>
                    `
                  )
                  .join("")}
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}
