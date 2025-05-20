// Firebase SDK 로딩은 HTML 파일에서 하고 (script 태그로)
// 이 파일에서는 설정과 초기화만!

const firebaseConfig = {
    apiKey: "AIzaSyAjosihXyz...",
    authDomain: "cafe-bless.firebaseapp.com",
    databaseURL: "https://cafe-bless-default-rtdb.firebaseio.com",
    projectId: "cafe-bless",
    storageBucket: "cafe-bless.appspot.com",
    messagingSenderId: "338610796982",
    appId: "1:338610796982:web:xxx",
    measurementId: "G-NK8RG23T9"
  };
  
  // 이미 초기화되어 있는 경우 중복 방지
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  
  // 전역으로 사용할 수 있게 export (ES5에서는 window에 등록)
  const database = firebase.database();
  