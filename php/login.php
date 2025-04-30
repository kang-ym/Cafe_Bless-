<?php
// 서버에 설정된 패스워드 (예: cafe123)
$correctPassword = 'cafe123';

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $inputPassword = $_POST['password'];

    if ($inputPassword === $correctPassword) {
        // 로그인 성공 -> 매니저 페이지로 이동
        header("Location: manager.html");
        exit();
    } else {
    // 로그인 실패
    echo "<script>
            alert('패스워드가 틀렸습니다.');
            window.location.href = 'login.html';
                </script>";
    }
}
?>
