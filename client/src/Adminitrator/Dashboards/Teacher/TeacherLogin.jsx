import { useState } from "react";
import * as teacherAPI from "../../../services/teacherAPI";

const TeacherLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const data = await teacherAPI.login(email, password);

      localStorage.setItem("slpaems_erp_token", data.token);
      localStorage.setItem("slpaems_erp_user", JSON.stringify({
        ...data.teacher,
        role: "teacher" // explicitly ensure role is assigned
      }));
      if (data?.teacher?.id) {
        sessionStorage.removeItem(`selectedAcademicYearId_${data.teacher.id}`);
        localStorage.removeItem(`selectedAcademicYearId_${data.teacher.id}`);
      }
      sessionStorage.removeItem('selectedAcademicYearId');
      localStorage.removeItem('selectedAcademicYearId'); // Default to active year on login

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