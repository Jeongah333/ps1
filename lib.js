export const moodLabels = { good: '좋음', normal: '보통', bad: '나쁨' }
export const energyLabels = { high: '고에너지', medium: '중에너지', low: '저에너지' }

export function todayKey(date = new Date()) {
  return date.toLocaleDateString('sv-SE')
}

export function calculateScore({ sleep, mood, fatigue }) {
  const hours = Number(sleep)
  const sleepScore = hours >= 8 ? 30 : hours >= 6 ? 20 : hours >= 4 ? 10 : 0
  const moodScore = { good: 15, normal: 5, bad: -10 }[mood] ?? 0
  const fatigueScore = { 1: 10, 2: 5, 3: 0, 4: -10, 5: -20 }[fatigue] ?? 0
  return Math.max(0, Math.min(100, 50 + sleepScore + moodScore + fatigueScore))
}

export function scoreInfo(score) {
  if (score >= 80) return { emoji: '😊', level: 'high', label: '충전 완료', message: '오늘은 집중력이 높은 날이에요. 중요한 일을 먼저 해볼까요?' }
  if (score >= 50) return { emoji: '🙂', level: 'medium', label: '적당한 하루', message: '무리하지 않는 선에서 차근차근 해내기 좋은 날이에요.' }
  return { emoji: '😴', level: 'low', label: '쉬어가기', message: '에너지가 낮은 날이에요. 가벼운 일과 충분한 휴식을 추천해요.' }
}

export function createAiComment(records, score) {
  const recent = records.slice(-3)
  const lowSleep = recent.filter((item) => Number(item.sleep) < 6).length
  if (lowSleep >= 2) return '최근 3일 동안 수면시간이 부족해요. 오늘은 일찍 쉬는 시간을 꼭 확보해 주세요.'
  if (score < 50) return '오늘은 회복이 우선이에요. 간단한 업무 하나만 끝내도 충분한 하루입니다.'
  if (score >= 80) return '컨디션이 좋아요. 집중이 필요한 일을 오전에 배치하면 성취감을 크게 느낄 수 있어요.'
  return '안정적인 컨디션이에요. 중간 난이도의 업무와 짧은 휴식을 번갈아 진행해 보세요.'
}

export const sampleRecords = [
  { date: '2026-06-06', score: 62, sleep: 6, mood: 'normal', fatigue: 3, diary: '' },
  { date: '2026-06-07', score: 45, sleep: 4, mood: 'bad', fatigue: 4, diary: '' },
  { date: '2026-06-08', score: 70, sleep: 7, mood: 'normal', fatigue: 2, diary: '' },
  { date: '2026-06-09', score: 85, sleep: 8, mood: 'good', fatigue: 2, diary: '' },
  { date: '2026-06-10', score: 75, sleep: 7, mood: 'good', fatigue: 3, diary: '' },
  { date: '2026-06-11', score: 55, sleep: 5, mood: 'normal', fatigue: 3, diary: '' },
]
