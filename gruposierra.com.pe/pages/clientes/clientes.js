/* =========================================================
   Acceso de Clientes — Validación simple
   Envía user/pass al API y muestra si existe o no.
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const userEl = document.getElementById('cli-user');
  const passEl = document.getElementById('cli-pass');
  const btn = document.getElementById('btn-login');
  const msg = document.getElementById('login-msg');

  if (!form) return;

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    msg.textContent = '';
    btn.disabled = true;

    const user = userEl.value.trim();
    const pass = passEl.value.trim();

    if (!user || !pass) {
      msg.textContent = 'Completa usuario y contraseña.';
      btn.disabled = false;
      return;
    }

    try {
      const res = await fetch('/includes/apiMyCli.php?action=check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        msg.textContent = '⚠️ Error al validar acceso. Intenta nuevamente.';
        console.error('API error', data);
      } else {
        msg.textContent = data.exists
          ? '✅ Usuario válido. (Se implementará luego la siguiente vista.)'
          : '❌ Usuario no existe o está inactivo.';
      }
    } catch (err) {
      console.error(err);
      msg.textContent = '🚫 No se pudo conectar con el servidor.';
    } finally {
      btn.disabled = false;
    }
  });
});
