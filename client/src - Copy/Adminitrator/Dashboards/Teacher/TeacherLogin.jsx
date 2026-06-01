import { useState } from "react";
import axios from "axios";

const TeacherLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/teacher/login",
        { email, password }
      );

      localStorage.setItem("grace_erp_token", res.data.token);
      localStorage.setItem("grace_erp_user", JSON.stringify({
        ...res.data.teacher,
        role: "teacher" // explicitly ensure role is assigned
      }));

      window.location.href = "/dashboard/teacher";

    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">

      <div className="bg-white p-8 rounded shadow w-80">

        <h2 className="text-xl font-bold mb-4">Teacher Login</h2>

        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          className="w-full border p-2 mb-3"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          className="w-full border p-2 mb-3"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white p-2"
        >
          Login
        </button>

      </div>

    </div>
  );
};

export default TeacherLogin;