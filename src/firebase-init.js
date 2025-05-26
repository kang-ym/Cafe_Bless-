// firebase-init.js (v9 모듈 방식)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js"; 

const firebaseConfig = {
  apiKey: "AIzaSyAjosiHexyZJWx8YS9M6D2sMDhAUtoGuT8",
  authDomain: "cafe-bless.firebaseapp.com",
  databaseURL: "https://cafe-bless-default-rtdb.firebaseio.com",
  projectId: "cafe-bless",
  storageBucket: "cafe-bless.firebasestorage.app",
  messagingSenderId: "338610796982",
  appId: "1:338610796982:web:1c7697bf5d25a77ea6a917",
  measurementId: "G-NK8GRG23T9"
};

// ✅ Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// ✅ v9 방식 모듈 객체 (모듈 import 방식용)
const database = getDatabase(app);
const auth = getAuth(app);

// ✅ export (v9 모듈 import 사용하는 스크립트 용)
export { app, database, auth };

// ✅ compat 방식 JS 파일을 위한 전역 설정 (예: orders.js, cafe-ledger.js 등에서 사용됨)
import "https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js";
import "https://www.gstatic.com/firebasejs/9.22.1/firebase-database-compat.js";
import "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js";

// compat용 초기화 (v9과 같은 설정으로)
const compatApp = firebase.initializeApp(firebaseConfig);

// ✅ 전역으로 compat용 객체 설정
window.firebase = firebase;
window.database = firebase.database();
window.auth = firebase.auth();
