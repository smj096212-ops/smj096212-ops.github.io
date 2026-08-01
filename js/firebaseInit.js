// Firebase 초기화 + 익명 인증. stats.js가 이 파일이 만들어둔 db/authReady를 사용한다.
// 쓰기(write)는 Firestore 보안 규칙상 익명 인증이 끝나야 통과되므로, authReady를 기다린 뒤에 db.add()를 호출해야 한다.
// 읽기(read)는 공개 규칙이라 authReady를 기다릴 필요가 없다.

const firebaseConfig = {
  apiKey: "AIzaSyCT6oErSN1dcyJzBazslYx9RT1nY3CLCyI",
  authDomain: "wg-2048.firebaseapp.com",
  projectId: "wg-2048",
  storageBucket: "wg-2048.firebasestorage.app",
  messagingSenderId: "24603611008",
  appId: "1:24603611008:web:bb81e97a68429124b73b65",
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

const authReady = firebase
  .auth()
  .signInAnonymously()
  .then(() => firebase.auth().currentUser);
