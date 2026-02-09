async function signup() {
  const name = get("name");
  const email = get("email");
  const password = get("password");

  const res = await fetch("/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json();
  show(data.success ? "Signup successful! Login now." : data.message);
}

async function login() {
  const email = get("email");
  const password = get("password");

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (data.success) {
    window.location.href = "/home.html";
  } else {
    show(data.message);
  }
}

function get(id) {
  return document.getElementById(id).value;
}

function show(msg) {
  document.getElementById("msg").innerText = msg;
}