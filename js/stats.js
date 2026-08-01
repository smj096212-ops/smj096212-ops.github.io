// 2048을 달성한 게임 결과만 Firestore에 저장하고, 저장 직후 이번 판의 순위(랭킹)를 계산한다.
// 2048에 도달하지 못한 판은 애초에 이 함수가 호출되지 않는다(js/main.js 참고) — 랭킹은
// 2048 달성자만을 대상으로 한다.
// firebaseInit.js가 만들어둔 db/authReady를 사용한다.

const RESULTS_COLLECTION = "results";

// 결과를 저장하고, 저장 직후 집계(count) 쿼리로 전체 2048 달성자 중 순위/총 인원을 계산해 반환한다.
async function submitResult({ elapsedMs, nickname, country }) {
  await authReady;

  const rankScore = elapsedMs;
  const doc = {
    maxTile: 2048,
    elapsedMs,
    reachedGoal: true,
    rankScore,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  if (nickname) {
    doc.nickname = nickname.slice(0, 20);
  }
  if (country) {
    doc.country = country;
  }

  await db.collection(RESULTS_COLLECTION).add(doc);

  // 참고: query().count() 집계 API는 compat(네임스페이스) SDK의 공개 API로 노출되어 있지 않아
  // (Firestore 콘솔 내부용으로만 추가된 훅) "count is not a function" 에러가 발생한다.
  // 그래서 문서를 직접 받아 snapshot.size로 세는 방식으로 대체했다. 트래픽이 커지면(문서 수가
  // 많아지면) 매 제출마다 전체 문서를 읽어오는 비용이 커지므로, 그때는 모듈러 SDK의
  // getCountFromServer()로 전환하는 것을 고려할 것.
  const [betterOrEqualSnap, totalSnap] = await Promise.all([
    db.collection(RESULTS_COLLECTION).where("rankScore", "<=", rankScore).get(),
    db.collection(RESULTS_COLLECTION).get(),
  ]);

  return { rank: betterOrEqualSnap.size, total: totalSnap.size };
}

// 2048을 가장 빨리 달성한 상위 기록(글로벌 랭킹)을 가져온다.
async function fetchTopScores(limitCount = 20) {
  const snap = await db
    .collection(RESULTS_COLLECTION)
    .where("reachedGoal", "==", true)
    .orderBy("elapsedMs", "asc")
    .limit(limitCount)
    .get();

  return snap.docs.map((doc) => {
    const data = doc.data();
    return { nickname: data.nickname || "Anonymous", elapsedMs: data.elapsedMs, country: data.country || null };
  });
}
