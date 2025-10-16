document.addEventListener("DOMContentLoaded", () => {

  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const formTitle = document.getElementById("form-title");
  const toggleText = document.getElementById("toggle-text");

  // Switch between login and register
  document.getElementById("switch-to-register").onclick = (e) => {
    e.preventDefault();
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    formTitle.textContent = "Register";
    toggleText.innerHTML = `Already have an account? <a href="#" id="switch-to-login" class="text-blue-600 font-semibold hover:underline">Login</a>`;
    document.getElementById("switch-to-login").onclick = switchToLogin;
  };

  function switchToLogin(e) {
    if (e) e.preventDefault();
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    formTitle.textContent = "Login";
    toggleText.innerHTML = `Don’t have an account? <a href="#" id="switch-to-register" class="text-blue-600 font-semibold hover:underline">Register</a>`;
    document.getElementById("switch-to-register").onclick = (e) => {
      e.preventDefault();
      loginForm.classList.add("hidden");
      registerForm.classList.remove("hidden");
      formTitle.textContent = "Register";
      toggleText.innerHTML = `Already have an account? <a href="#" id="switch-to-login" class="text-blue-600 font-semibold hover:underline">Login</a>`;
      document.getElementById("switch-to-login").onclick = switchToLogin;
    };
  }

  // Login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const role = fd.get("role");
    try {
      const res = await fetch(`${API}/users/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password"),
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.detail || "Invalid credentials or role.");

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("role", data.role);

      showAlert("Login successful!", "success");
      setTimeout(() => (window.location.href = "./profile-setup.html"), 800);
    } catch (err) {
      document.getElementById("login-error").textContent = err.message;
      showAlert(err.message, "error");
    }
  });

  // Register
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const password = fd.get("password");
    const confirmPassword = fd.get("confirm_password");

    const payload = {
      username: fd.get("username"),
      email: fd.get("email"),
      password: fd.get("password"),
      role: fd.get("role"),
    };
    try {
      if(password !== confirmPassword){
        throw new Error("Password Mismatch");
      }else{
        const res = await fetch(`${API}/users/auth/register/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok)
          throw new Error((await res.json()).detail || "Registration failed");

        showAlert("Registration successful! Logging you in...", "success");
        await loginAfterRegister(payload.email, payload.password, payload.role);
      }
    } catch (err) {
      document.getElementById("reg-error").textContent = err.message;
      showAlert(err.message, "error");
    }
  });

  async function loginAfterRegister(email, password, role) {
    try {
      const res = await fetch(`${API}/users/auth/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.detail || "Login failed after register.");

      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);
      localStorage.setItem("role", data.role);

      setTimeout(() => (window.location.href = "./profile-setup.html"), 1000);
    } catch (err) {
      showAlert(err.message, "error");
    }
  }
});