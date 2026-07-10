import { randomUUID } from "crypto";
import { EXAMS, type ExamType } from "./exams";
import type { Question } from "./types";

interface Seed {
  prompt: string;
  promptKo?: string;
  passage?: string;
  imageSeed?: string;
}

// 섹션 키별 문항 풀
type SeedBank = Record<ExamType, Record<string, Seed[]>>;

export const SEED: SeedBank = {
  ielts: {
    part1: [
      { prompt: "Let's talk about your hometown. Where are you from, and what is it like?", promptKo: "고향에 대해 이야기해 주세요." },
      { prompt: "Do you prefer to spend your free time indoors or outdoors? Why?", promptKo: "여가 시간을 실내/실외 중 어디서 보내나요?" },
      { prompt: "How often do you use public transportation? Tell me about it.", promptKo: "대중교통을 얼마나 자주 이용하나요?" },
      { prompt: "What kind of music do you enjoy listening to?", promptKo: "어떤 음악을 즐겨 듣나요?" },
      { prompt: "Do you think reading books is still important today? Why?", promptKo: "요즘도 독서가 중요하다고 생각하나요?" },
    ],
    part2: [
      {
        prompt:
          "Describe a skill you would like to learn. You should say: what the skill is, why you want to learn it, how you would learn it, and explain how it would help you.",
        promptKo: "배우고 싶은 기술에 대해 말하세요 (무엇을, 왜, 어떻게 배울지, 어떤 도움이 될지).",
      },
      {
        prompt:
          "Describe a memorable trip you have taken. You should say: where you went, who you went with, what you did, and explain why it was memorable.",
        promptKo: "기억에 남는 여행에 대해 말하세요.",
      },
      {
        prompt:
          "Describe a person who has influenced you. You should say: who the person is, how you know them, what they are like, and explain how they influenced you.",
        promptKo: "당신에게 영향을 준 사람에 대해 말하세요.",
      },
    ],
    part3: [
      { prompt: "How has technology changed the way people learn new skills?", promptKo: "기술이 학습 방식을 어떻게 바꿨나요?" },
      { prompt: "Do you think traveling abroad is better than traveling domestically? Why?", promptKo: "해외여행이 국내여행보다 나은가요?" },
      { prompt: "In what ways can role models shape a younger generation?", promptKo: "롤모델이 젊은 세대에 어떤 영향을 주나요?" },
      { prompt: "Should governments invest more in public education? Explain.", promptKo: "정부가 공교육에 더 투자해야 할까요?" },
    ],
  },
  toefl: {
    task1: [
      { prompt: "Some students prefer to study alone, while others prefer to study in groups. Which do you prefer, and why? Use details and examples.", promptKo: "혼자 vs 그룹 학습, 무엇을 선호하나요?" },
      { prompt: "Do you agree or disagree: Universities should require all students to take physical education courses? Explain.", promptKo: "대학이 체육 수업을 의무화해야 하는가?" },
      { prompt: "Describe a place you like to visit when you want to relax, and explain why.", promptKo: "휴식할 때 가는 장소를 설명하세요." },
    ],
    task2: [
      {
        prompt:
          "The university plans to close the campus library on weekends to reduce costs. The woman disagrees with the plan. Summarize her opinion and the reasons she gives.",
        promptKo: "여성이 도서관 주말 폐관에 반대하는 이유를 요약하세요.",
        passage:
          "Campus Announcement: Starting next semester, the main library will be closed on weekends to reduce operating costs. Students may use the 24-hour study room in the student center instead.",
      },
      {
        prompt:
          "The university will require all first-year students to live on campus. The man supports this policy. Explain his opinion and reasons.",
        promptKo: "남성이 기숙사 의무 거주 정책을 지지하는 이유를 설명하세요.",
        passage:
          "New Housing Policy: Beginning next fall, all first-year students must live in university dormitories to build community and improve academic support.",
      },
    ],
    task3: [
      {
        prompt:
          "Using the example from the lecture, explain the concept of the 'sunk cost fallacy'.",
        promptKo: "강의의 예시를 활용해 '매몰비용 오류' 개념을 설명하세요.",
        passage:
          "Reading — Sunk Cost Fallacy: People often continue an activity because of previously invested resources (time, money, effort) rather than future value. The lecture gives an example of a person finishing a boring movie only because they paid for the ticket.",
      },
    ],
    task4: [
      {
        prompt:
          "Using points and examples from the lecture, explain two ways animals adapt to cold environments.",
        promptKo: "강의를 바탕으로 동물이 추위에 적응하는 두 가지 방법을 설명하세요.",
        passage:
          "Lecture summary: Animals adapt to cold in two main ways — (1) physical adaptations such as thick fur or fat layers, and (2) behavioral adaptations such as migration or hibernation.",
      },
    ],
  },
  toeic: {
    q1_2: [
      {
        prompt: "Read the following announcement aloud.",
        promptKo: "다음 안내문을 소리 내어 읽으세요.",
        passage:
          "Thank you for shopping at Riverside Market. Please note that our store hours have changed. We are now open from eight in the morning until ten at night, seven days a week. For your convenience, a new self-checkout area is available near the main entrance.",
      },
      {
        prompt: "Read the following advertisement aloud.",
        promptKo: "다음 광고문을 소리 내어 읽으세요.",
        passage:
          "Looking for a reliable way to commute? Try GreenLine Bus Services. With comfortable seats, free wireless internet, and departures every fifteen minutes, we make your daily journey faster and more enjoyable. Visit our website today to purchase a monthly pass.",
      },
    ],
    q3_4: [
      { prompt: "Describe the picture in as much detail as you can.", promptKo: "사진을 최대한 자세히 묘사하세요.", imageSeed: "office-meeting" },
      { prompt: "Describe the picture in as much detail as you can.", promptKo: "사진을 최대한 자세히 묘사하세요.", imageSeed: "city-street" },
    ],
    q5_7: [
      { prompt: "Imagine a marketing firm is doing research. You have agreed to a telephone interview about restaurants. How often do you eat at restaurants, and who do you usually go with?", promptKo: "식당 이용 빈도와 동행에 대해 답하세요." },
      { prompt: "If you wanted to try a new restaurant, how would you find information about it?", promptKo: "새 식당 정보를 어떻게 찾나요?" },
      { prompt: "Describe your most recent restaurant experience in detail.", promptKo: "최근 식당 경험을 자세히 설명하세요." },
    ],
    q11: [
      { prompt: "Some people prefer working for a large company, while others prefer a small company. Which do you prefer, and why? Give reasons and examples.", promptKo: "대기업 vs 소기업, 무엇을 선호하나요?" },
      { prompt: "Do you agree or disagree: Companies should allow employees to work from home. Support your opinion.", promptKo: "재택근무 허용에 대한 의견을 말하세요." },
    ],
  },
  opic: {
    self: [
      { prompt: "Let's start the interview now. Tell me about yourself.", promptKo: "자기소개를 해주세요." },
    ],
    description: [
      { prompt: "You indicated that you like watching movies. What kinds of movies do you enjoy, and where do you usually watch them? Describe in detail.", promptKo: "좋아하는 영화 종류와 관람 장소를 묘사하세요." },
      { prompt: "Tell me about your home. What does it look like, and which room do you like the most?", promptKo: "당신의 집과 가장 좋아하는 공간을 묘사하세요." },
      { prompt: "Describe a typical weekday from morning to evening.", promptKo: "평일 하루 일과를 묘사하세요." },
    ],
    experience: [
      { prompt: "Tell me about a memorable experience you had while traveling. What happened, and why was it special?", promptKo: "여행 중 기억에 남는 경험을 이야기하세요." },
      { prompt: "Describe a time when something unexpected happened at work or school. How did you handle it?", promptKo: "예상치 못한 일을 겪은 경험을 이야기하세요." },
    ],
    roleplay: [
      { prompt: "I'm going to give you a situation to act out. You want to join a new gym. Ask the staff three or four questions to get the information you need.", promptKo: "헬스장 등록을 위해 직원에게 3~4개 질문을 하세요." },
      { prompt: "There is a problem: you bought a product online but it arrived damaged. Call the store and explain the situation to resolve it.", promptKo: "손상된 상품 문제를 해결하기 위해 상점에 전화하세요." },
    ],
  },
};

function pick<T>(arr: T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  // 풀이 부족하면 반복 허용
  while (out.length < n && arr.length) out.push(arr[out.length % arr.length]);
  return out;
}

// 한 회차 응시 세션 구성 (실제 시험 파트 구조대로 문항 생성)
export function buildSession(examType: ExamType): Question[] {
  const exam = EXAMS[examType];
  const questions: Question[] = [];
  let index = 0;
  for (const section of exam.sections) {
    const seeds = pick(SEED[examType][section.key] || [], section.count);
    for (const s of seeds) {
      questions.push({
        id: randomUUID(),
        examType,
        sectionKey: section.key,
        sectionLabel: section.label,
        kind: section.kind,
        index: index++,
        prompt: s.prompt,
        promptKo: s.promptKo,
        passage: s.passage,
        imageUrl: s.imageSeed
          ? `https://picsum.photos/seed/${s.imageSeed}/900/560`
          : undefined,
        prepSec: section.prepSec,
        answerSec: section.answerSec,
      });
    }
  }
  return questions;
}
