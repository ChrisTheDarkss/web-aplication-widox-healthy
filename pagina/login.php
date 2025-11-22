<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Ingreso - Widox Gym</title>
  <meta name="description" content="Login seguro para el sistema de gestión del gimnasio Widox Gym">
  <style>
    /* ... (mantener tus estilos actuales) ... */
  </style>
</head>
<body>
  <main class="container" role="main">
    <section class="hero" aria-labelledby="welcome">
      <div class="gym-brand">
        <div class="logo" aria-hidden>WG</div>
        <div>
          <h2 id="welcome">Widox Gym</h2>
          <p class="muted">Gestiona tus entrenamientos, alimentación y progreso desde tu cuenta.</p>
        </div>
      </div>

      <h1>Bienvenido de vuelta</h1>
      <p>Inicia sesión para acceder a tu plan personalizado de ejercicios y alimentación.</p>

      <div class="divider" aria-hidden></div>

      <ul class="muted" style="padding-left:1rem;margin:0">
        <li>Plan de ejercicios personalizado</li>
        <li>Seguimiento de alimentación</li>
        <li>Control de IMC y progreso</li>
      </ul>
    </section>

    <aside class="card" aria-labelledby="login-title">
      <h3 id="login-title" style="margin:0 0 .5rem 0">Ingreso a la cuenta</h3>
      
      <!-- Pestañas para Login/Registro -->
      <div style="display: flex; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <button id="tabLogin" style="flex: 1; padding: 10px; background: transparent; border: none; color: var(--accent); border-bottom: 2px solid var(--accent); cursor: pointer;">Iniciar Sesión</button>
        <button id="tabRegister" style="flex: 1; padding: 10px; background: transparent; border: none; color: var(--muted); border-bottom: 1px solid transparent; cursor: pointer;">Registrarse</button>
      </div>
      
      <!-- Formulario de Login -->
      <form id="loginForm">
        <div>
          <label for="loginEmail">Correo electrónico</label>
          <input id="loginEmail" name="email" class="input" type="email" placeholder="ej: juan@email.com" required aria-required="true">
          <div id="loginEmailError" class="error" style="display:none"></div>
        </div>

        <div>
          <label for="loginPassword">Contraseña</label>
          <input id="loginPassword" name="password" class="input" type="password" placeholder="●●●●●●●" required aria-required="true" minlength="6">
          <div id="loginPassError" class="error" style="display:none"></div>
        </div>

        <div class="row" style="align-items:center">
          <label style="display:flex;gap:.5rem;align-items:center;cursor:pointer">
            <input type="checkbox" id="remember"> <span class="small">Recordarme</span>
          </label>
          <a class="small muted" href="#" id="forgotPassword">¿Olvidaste tu contraseña?</a>
        </div>

        <button type="submit" class="btn">Ingresar</button>
      </form>
      
      <!-- Formulario de Registro (oculto inicialmente) -->
      <form id="registerForm" style="display: none;">
        <div>
          <label for="registerName">Nombre completo</label>
          <input id="registerName" name="name" class="input" type="text" placeholder="ej: Juan Pérez" required aria-required="true">
          <div id="registerNameError" class="error" style="display:none"></div>
        </div>
        
        <div>
          <label for="registerEmail">Correo electrónico</label>
          <input id="registerEmail" name="email" class="input" type="email" placeholder="ej: juan@email.com" required aria-required="true">
          <div id="registerEmailError" class="error" style="display:none"></div>
        </div>

        <div>
          <label for="registerPassword">Contraseña</label>
          <input id="registerPassword" name="password" class="input" type="password" placeholder="●●●●●●●" required aria-required="true" minlength="6">
          <div id="registerPassError" class="error" style="display:none"></div>
        </div>
        
        <div>
          <label for="registerPasswordConfirm">Confirmar contraseña</label>
          <input id="registerPasswordConfirm" name="passwordConfirm" class="input" type="password" placeholder="●●●●●●●" required aria-required="true" minlength="6">
          <div id="registerPassConfirmError" class="error" style="display:none"></div>
        </div>

        <button type="submit" class="btn">Registrarse</button>
      </form>

      <div id="formMessage" role="status" aria-live="polite" style="margin-top:.6rem"></div>
    </aside>
  </main>

  <script>
    // Elementos del DOM
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const formMessage = document.getElementById('formMessage');

    // Funciones para mostrar/ocultar formularios
    function showLoginForm() {
      loginForm.style.display = 'flex';
      registerForm.style.display = 'none';
      tabLogin.style.color = 'var(--accent)';
      tabLogin.style.borderBottom = '2px solid var(--accent)';
      tabRegister.style.color = 'var(--muted)';
      tabRegister.style.borderBottom = '1px solid transparent';
      formMessage.textContent = '';
    }

    function showRegisterForm() {
      loginForm.style.display = 'none';
      registerForm.style.display = 'flex';
      tabRegister.style.color = 'var(--accent)';
      tabRegister.style.borderBottom = '2px solid var(--accent)';
      tabLogin.style.color = 'var(--muted)';
      tabLogin.style.borderBottom = '1px solid transparent';
      formMessage.textContent = '';
    }

    // Event listeners para las pestañas
    tabLogin.addEventListener('click', showLoginForm);
    tabRegister.addEventListener('click', showRegisterForm);

    // Función para mostrar errores
    function showError(elementId, message) {
      const errorElement = document.getElementById(elementId);
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }

    // Función para limpiar errores
    function clearErrors() {
      const errorElements = document.querySelectorAll('.error');
      errorElements.forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
      });
    }

    // Formulario de Login
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();
      formMessage.textContent = '';
      formMessage.className = '';

      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      // Validación básica
      if (!email) {
        showError('loginEmailError', 'El correo electrónico es requerido');
        return;
      }
      if (!password) {
        showError('loginPassError', 'La contraseña es requerida');
        return;
      }

      formMessage.textContent = 'Validando credenciales...';

      try {
        const response = await fetch('login.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: password
          })
        });

        const data = await response.json();

        if (response.ok) {
          formMessage.textContent = 'Inicio de sesión exitoso. Redirigiendo...';
          formMessage.className = 'success';
          
          // Guardar datos del usuario en localStorage
          localStorage.setItem('usuarioActivo', data.nombre);
          localStorage.setItem('userId', data.id);
          localStorage.setItem('userEmail', data.email);
          
          setTimeout(() => {
            window.location.href = 'home.html';
          }, 1500);
        } else {
          formMessage.textContent = data.message;
          formMessage.className = 'error';
        }
      } catch (error) {
        formMessage.textContent = 'Error de conexión. Intenta nuevamente.';
        formMessage.className = 'error';
        console.error('Error:', error);
      }
    });

    // Formulario de Registro
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();
      formMessage.textContent = '';
      formMessage.className = '';

      const name = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const password = document.getElementById('registerPassword').value;
      const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

      // Validaciones
      if (!name) {
        showError('registerNameError', 'El nombre es requerido');
        return;
      }
      if (!email) {
        showError('registerEmailError', 'El correo electrónico es requerido');
        return;
      }
      if (!password) {
        showError('registerPassError', 'La contraseña es requerida');
        return;
      }
      if (password.length < 6) {
        showError('registerPassError', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (password !== passwordConfirm) {
        showError('registerPassConfirmError', 'Las contraseñas no coinciden');
        return;
      }

      formMessage.textContent = 'Registrando usuario...';

      try {
        const response = await fetch('register.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: name,
            email: email,
            password: password
          })
        });

        const data = await response.json();

        if (response.ok) {
          formMessage.textContent = 'Registro exitoso. Iniciando sesión...';
          formMessage.className = 'success';
          
          // Guardar datos del usuario en localStorage
          localStorage.setItem('usuarioActivo', data.nombre);
          localStorage.setItem('userId', data.id);
          localStorage.setItem('userEmail', email);
          
          setTimeout(() => {
            window.location.href = 'home.html';
          }, 1500);
        } else {
          formMessage.textContent = data.message;
          formMessage.className = 'error';
        }
      } catch (error) {
        formMessage.textContent = 'Error de conexión. Intenta nuevamente.';
        formMessage.className = 'error';
        console.error('Error:', error);
      }
    });
  </script>
</body>
</html>