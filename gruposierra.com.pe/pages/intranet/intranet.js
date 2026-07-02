/* =========================================================
   Acceso Intranet — Validación sin conflicto
   Envía user/pass al API y muestra resultado
========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('intra-form');
  const userEl = document.getElementById('intra-user');
  const passEl = document.getElementById('intra-pass');
  const btn = document.getElementById('btn-intra');
  const msg = document.getElementById('intra-msg');

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
      const res = await fetch('/includes/apiMyUse.php?action=check', {
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
          ? '✅ Usuario válido. (Se implementará la vista intranet.)'
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
