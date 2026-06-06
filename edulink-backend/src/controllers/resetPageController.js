const db = require('../config/database');

function show(req, res) {
  const { token } = req.query;
  console.log('[ResetPage] GET /reset-password token:', token ? token.substring(0, 20) + '...' : 'MISSING');
  console.log('[ResetPage] Full query:', JSON.stringify(req.query));

  if (!token) {
    return res.status(400).send(errorPage('Missing reset token.', 'Please use the link from your email.'));
  }

  const reset = db.prepare(`
    SELECT * FROM password_resets
    WHERE token = ? AND used = 0 AND expires_at > datetime('now')
  `).get(token);

  console.log('[ResetPage] Valid reset found:', !!reset);

  if (!reset) {
    const used = db.prepare('SELECT * FROM password_resets WHERE token = ? AND used = 1').get(token);
    console.log('[ResetPage] Used check:', !!used);
    if (used) {
      return res.status(400).send(errorPage(
        'Link Already Used',
        'This reset link has already been used. Each link works only once. Please request a new one.'
      ));
    }
    return res.status(400).send(errorPage(
      'Link Expired or Invalid',
      'This reset link is invalid or has expired (links are valid for 1 hour). Please request a new one.'
    ));
  }

  res.send(formPage(token));
}

function successPage(req, res) {
  res.send(page('Password Changed', `
    <div style="font-size:64px;margin-bottom:16px">&#x2705;</div>
    <h1>Password Changed Successfully</h1>
    <p>Your password has been reset.</p>
    <div style="background:#f0fff4;border:1px solid #c6f6d5;border-radius:10px;padding:16px;margin:20px 0;text-align:left">
      <ul style="margin:0;padding-left:20px;font-size:14px;color:#276749;line-height:1.8">
        <li>Your <strong>old password no longer works</strong></li>
        <li>Use your <strong>new password</strong> to sign in</li>
        <li>You have been signed out on all devices for security</li>
      </ul>
    </div>
    <p style="font-size:13px;color:#999">You can close this page now.</p>
  `));
}

function errorPage(title, message) {
  return page(title, `
    <div style="font-size:48px;margin-bottom:12px">&#x26A0;&#xFE0F;</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/forgot-password">Request New Link</a>
  `);
}

function page(title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — EduLink</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f7fa;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .card{background:#fff;border-radius:16px;padding:48px 40px;max-width:440px;width:90%;box-shadow:0 4px 24px rgba(0,0,0,.08);text-align:center}
    h1{font-size:20px;color:#1a1a2e;margin-bottom:8px}
    p{color:#666;font-size:15px;line-height:1.6;margin-bottom:24px}
    a{display:inline-block;background:#10A7DA;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px}
    a:hover{background:#0e93c0}
  </style>
</head>
<body>
  <div class="card">${body}</div>
</body>
</html>`;
}

function formPage(token) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password — EduLink</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f7fa;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .card{background:#fff;border-radius:16px;padding:48px 40px;max-width:440px;width:90%;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .logo{font-size:28px;font-weight:700;color:#10A7DA;margin-bottom:8px;text-align:center}
    .sub{text-align:center;color:#666;font-size:14px;margin-bottom:32px}
    h2{font-size:20px;color:#1a1a2e;margin-bottom:24px;text-align:center}
    label{display:block;font-size:13px;font-weight:600;color:#333;margin-bottom:6px}
    input[type=password]{width:100%;padding:12px 16px;border:2px solid #e2e8f0;border-radius:10px;font-size:15px;margin-bottom:8px;outline:none}
    input[type=password]:focus{border-color:#10A7DA}
    .hint{font-size:12px;color:#999;margin-bottom:16px}
    .err{display:none;color:#c53030;font-size:13px;padding:10px;background:#fff5f5;border:1px solid #fed7d7;border-radius:8px;margin-bottom:12px}
    .ok{display:none;text-align:center;padding:10px 0}
    .ok .check{font-size:56px;margin-bottom:12px}
    .ok h2{color:#38a169;margin-bottom:8px}
    .ok .box{background:#f0fff4;border:1px solid #c6f6d5;border-radius:10px;padding:14px;margin:16px 0;text-align:left}
    .ok .box li{font-size:14px;color:#276749;margin:5px 0;margin-left:18px;line-height:1.6}
    .ok .close{color:#999;font-size:13px;margin-top:8px}
    button{width:100%;padding:14px;background:#10A7DA;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;margin-top:4px}
    button:hover{background:#0e93c0}
    button:disabled{background:#a0aec0;cursor:not-allowed}
    .ft{text-align:center;margin-top:20px;font-size:13px;color:#999}
    .ft a{color:#10A7DA;text-decoration:none}
    .bar{height:4px;border-radius:2px;margin-bottom:12px;background:#e2e8f0}
    .bar.w{background:#e53e3e;width:33%}
    .bar.m{background:#ed8936;width:66%}
    .bar.s{background:#38a169;width:100%}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">EduLink</div>
    <p class="sub">Learning Platform</p>
    <h2 id="title">Reset Your Password</h2>

    <form id="frm">
      <label for="pw">New Password</label>
      <input type="password" id="pw" placeholder="Min. 6 characters" minlength="6" required autofocus>
      <div class="bar" id="bar"></div>
      <p class="hint">Choose a strong password you have not used before.</p>

      <label for="cp">Confirm Password</label>
      <input type="password" id="cp" placeholder="Re-enter your password" minlength="6" required>
      <p class="hint" id="mh">Passwords must match.</p>

      <div class="err" id="err"></div>
      <div class="ok" id="ok">
        <div class="check">&#x2705;</div>
        <h2>Password Changed!</h2>
        <p style="font-size:14px;color:#666">Your password has been reset successfully.</p>
        <div class="box">
          <ul style="margin:0;padding:0">
            <li>Your <strong>old password no longer works</strong></li>
            <li>Use your <strong>new password</strong> to sign in on all devices</li>
            <li>You have been signed out everywhere for security</li>
          </ul>
        </div>
        <p class="close">You can close this page now.</p>
      </div>

      <input type="hidden" name="token" value="${token}">
      <button type="submit" id="btn">Reset Password</button>
    </form>

    <div class="ft">
      <a href="/login">&larr; Back to Sign In</a>
    </div>
  </div>

  <script>
    var frm = document.getElementById('frm');
    var pw = document.getElementById('pw');
    var cp = document.getElementById('cp');
    var bar = document.getElementById('bar');
    var err = document.getElementById('err');
    var ok = document.getElementById('ok');
    var btn = document.getElementById('btn');
    var mh = document.getElementById('mh');
    var title = document.getElementById('title');

    pw.oninput = function(){
      bar.className = 'bar';
      var v = pw.value;
      if(v.length >= 10 && /[A-Z]/.test(v) && /[0-9]/.test(v)) bar.classList.add('s');
      else if(v.length >= 6) bar.classList.add(v.length >= 8 ? 'm' : 'w');
      else if(v.length > 0) bar.classList.add('w');
    };

    cp.oninput = function(){
      if(!cp.value) { mh.style.color='#999'; mh.textContent='Passwords must match.'; }
      else if(pw.value !== cp.value) { mh.style.color='#e53e3e'; mh.textContent='Passwords do not match'; }
      else { mh.style.color='#38a169'; mh.textContent='Passwords match'; }
    };

    async function doReset(e){
      e.preventDefault();
      err.style.display = 'none';
      var p = pw.value;
      var c = cp.value;
      var t = document.querySelector('input[name=token]').value;

      if(p.length < 6){ err.textContent='Password must be at least 6 characters.'; err.style.display='block'; return false; }
      if(p !== c){ err.textContent='Passwords do not match.'; err.style.display='block'; return false; }

      btn.disabled = true;
      btn.textContent = 'Resetting...';

      try {
        var r = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({token: t, password: p})
        });
        var d = await r.json();

        if(d.success){
          frm.style.display = 'none';
          title.textContent = '';
          ok.style.display = 'block';
        } else {
          err.textContent = (d.data && d.data.message) || 'Something went wrong. Try again.';
          err.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Reset Password';
        }
      } catch(e){
        err.textContent = 'Network error. Check your connection and try again.';
        err.style.display = 'block';
        btn.disabled = false;
        btn.textContent = 'Reset Password';
      }
      return false;
    }
    frm.addEventListener('submit', doReset);
  </script>
</body>
</html>`;
}

function forgotPage(req, res) {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forgot Password — EduLink</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f7fa;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .card{background:#fff;border-radius:16px;padding:48px 40px;max-width:440px;width:90%;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .logo{font-size:28px;font-weight:700;color:#10A7DA;margin-bottom:8px;text-align:center}
    .sub{text-align:center;color:#666;font-size:14px;margin-bottom:32px}
    h2{font-size:20px;color:#1a1a2e;margin-bottom:8px;text-align:center}
    p.desc{color:#666;font-size:14px;text-align:center;margin-bottom:24px;line-height:1.5}
    label{display:block;font-size:13px;font-weight:600;color:#333;margin-bottom:6px}
    input[type=email]{width:100%;padding:12px 16px;border:2px solid #e2e8f0;border-radius:10px;font-size:15px;margin-bottom:16px;outline:none}
    input[type=email]:focus{border-color:#10A7DA}
    .msg{display:none;padding:14px;border-radius:10px;text-align:center;font-size:14px;margin-bottom:16px}
    .msg.ok{background:#f0fff4;border:1px solid #c6f6d5;color:#276749}
    .msg.err{background:#fff5f5;border:1px solid #fed7d7;color:#9b2c2c}
    button{width:100%;padding:14px;background:#10A7DA;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer}
    button:hover{background:#0e93c0}
    button:disabled{background:#a0aec0;cursor:not-allowed}
    .ft{text-align:center;margin-top:20px;font-size:13px;color:#999}
    .ft a{color:#10A7DA;text-decoration:none}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">EduLink</div>
    <p class="sub">Learning Platform</p>
    <h2>Forgot Password?</h2>
    <p class="desc">Enter your email and we will send you a link to reset your password.</p>
    <div class="msg" id="msg"></div>
    <form id="ff">
      <label for="em">Email Address</label>
      <input type="email" id="em" placeholder="you@example.com" required autofocus>
      <button type="submit" id="sbtn">Send Reset Link</button>
    </form>
    <div class="ft"><a href="/login">&larr; Back to Sign In</a></div>
  </div>
  <script>
    async function doSend(e){
      e.preventDefault();
      var m = document.getElementById('msg');
      var b = document.getElementById('sbtn');
      m.style.display = 'none';
      b.disabled = true;
      b.textContent = 'Sending...';
      try {
        var r = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email: document.getElementById('em').value})
        });
        var d = await r.json();
        m.className = 'msg ok';
        m.textContent = (d.data && d.data.message) || 'If the email exists, a reset link has been sent.';
        m.style.display = 'block';
        document.getElementById('ff').style.display = 'none';
      } catch(e){
        m.className = 'msg err';
        m.textContent = 'Something went wrong. Please try again.';
        m.style.display = 'block';
      } finally {
        b.disabled = false;
        b.textContent = 'Send Reset Link';
      }
      return false;
    }
    ff.addEventListener('submit', doSend);
  </script>
</body>
</html>`);
}

module.exports = { show, forgotPage, successPage };
