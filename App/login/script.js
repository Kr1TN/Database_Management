
  // Demo credentials (replace with real API auth)
  const DEMO_USERS = {
    'admin':   { password: '1234',  role: 'admin',    name: 'Admin HR' },
    'hr':      { password: 'hotel', role: 'admin',    name: 'คุณสมศักดิ์' },
    'manager': { password: '1234',  role: 'manager',  name: 'คุณวิภา' },
    'payroll': { password: '1234',  role: 'payroll',  name: 'คุณนภา' },
  };

  function doLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const role     = document.querySelector('input[name="role"]:checked').value;
    const btn      = document.getElementById('loginBtn');
    const errMsg   = document.getElementById('errorMsg');

    // Hide old error
    errMsg.classList.remove('show');

    if (!username || !password) {
      showError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    // Loading state
    btn.classList.add('loading');

    // Simulate API call delay
    setTimeout(() => {
      const user = DEMO_USERS[username];

      if (user && user.password === password) {
        // Store session (replace with real token)
        sessionStorage.setItem('hr_user', JSON.stringify({
          username, name: user.name, role
        }));
        showSuccess(user.name);
      } else {
        btn.classList.remove('loading');
        showError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        // Shake animation
        const card = document.querySelector('.login-card');
        card.style.animation = 'shake 0.4s ease';
        setTimeout(() => card.style.animation = '', 400);
      }
    }, 1200);
  }

  function showError(msg) {
    document.getElementById('errorText').textContent = msg;
    document.getElementById('errorMsg').classList.add('show');
  }

  function showSuccess(name) {
    const overlay = document.getElementById('successOverlay');
    document.getElementById('successSub').textContent = `ยินดีต้อนรับ, ${name} — กำลังโหลดระบบ...`;
    overlay.classList.add('show');
    // Redirect after 1.8s
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1800);
  }

  // Add shake keyframe dynamically
  const style = document.createElement('style');
  style.textContent = `@keyframes shake {
    0%,100%{transform:translateX(0)}
    20%{transform:translateX(-8px)}
    40%{transform:translateX(8px)}
    60%{transform:translateX(-5px)}
    80%{transform:translateX(5px)}
  }`;
  document.head.appendChild(style);