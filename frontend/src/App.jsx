import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home           from "./pages/Home";
import TeacherEval    from "./pages/TeacherEval";
import StudentEval    from "./pages/StudentEval";
import ThankYou       from "./pages/ThankYou";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<Home />} />
        <Route path="/teacher" element={<TeacherEval />} />
        <Route path="/student" element={<StudentEval />} />
        <Route path="/thankyou" element={<ThankYou />} />
        <Route path="/admin"   element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
