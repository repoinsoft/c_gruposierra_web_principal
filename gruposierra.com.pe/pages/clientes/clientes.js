/* =========================================================
   Acceso de Clientes — Grupo Sierra
   Conectado a https://api.insoft.com.pe/sierra/web/api_web.php
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const API = 'https://api.insoft.com.pe/sierra/web/api_web.php';
  const form = document.getElementById('login-form');
  const userEl = document.getElementById('cli-user');
  const passEl = document.getElementById('cli-pass');
  const btn = document.getElementById('btn-login');
  const msg = document.getElementById('login-msg');

  if (!form) return;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    msg.textContent = '';
    msg.style.color = '#C12A2A';
    btn.disabled = true;

    const user = userEl.value.trim();
    const pass = passEl.value.trim();

    if (!user || !pass) {
      msg.textContent = 'Completa tu documento y contraseña.';
      btn.disabled = false;
      return;
    }

    try {
      const fd = new FormData();
      fd.append('action', 'client_login');
      fd.append('user', user);
      fd.append('pass', pass);

      const res = await fetch(API, {
        method: 'POST',
        body: fd
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        msg.textContent = `⚠️ ${data.error || 'Cliente no encontrado o clave incorrecta.'}`;
      } else {
        msg.style.color = '#2E7D32';
        msg.textContent = `✅ ¡Bienvenido(a) ${data.user?.nombre || user}! Validando portal...`;
      }
    } catch (err) {
      console.error(err);
      msg.textContent = '🚫 No se pudo conectar con el servidor central.';
    } finally {
      btn.disabled = false;
    }
  });
});
