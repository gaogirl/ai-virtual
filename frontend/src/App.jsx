import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';

import StudentTerms from './pages/student/StudentTerms';
import StudentCases from './pages/student/StudentCases';
import StudentCaseDetail from './pages/student/StudentCaseDetail';
import TeacherTerms from './pages/teacher/TeacherTerms';
import TeacherCases from './pages/teacher/TeacherCases';
import TeacherLayout from './pages/teacher/TeacherLayout';
import TeacherHome from './pages/teacher/TeacherHome';
import TeacherAIChat from './pages/TeacherAIChat';
import TeacherClasses from './pages/TeacherClasses';
import TeacherClassDetail from './pages/TeacherClassDetail';
import TeacherAssignments from './pages/teacher/TeacherAssignments';
import TeacherAnalytics from './pages/teacher/TeacherAnalytics';
import TeacherAssignmentSubmissions from './pages/teacher/TeacherAssignmentSubmissions';
import TeacherSubmissionDetail from './pages/teacher/TeacherSubmissionDetail';
import ProtectedRoute from './components/ProtectedRoute';
import StudentLayout from './pages/student/StudentLayout';
import StudentHome from './pages/student/StudentHome';
import StudentCourses from './pages/student/StudentCourses';
import StudentProfile from './pages/student/StudentProfile';
import StudentAIChat from './pages/student/StudentAIChat';
import StudentClasses from './pages/student/StudentClasses';
import StudentClassDetail from './pages/student/StudentClassDetail';
import StudentAssignmentDetail from './pages/student/StudentAssignmentDetail';
import StudentAIInterpret from './pages/student/StudentAIInterpret';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 公共路由 */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 根路径，根据登录状态重定向 */}
          <Route path="/" element={<Home />} />

          {/* 受保护的学生路由（嵌套路由） */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student" element={<StudentLayout />}>
              <Route index element={<StudentHome />} />
              <Route path="ai" element={<StudentAIChat />} />
              <Route path="ai-interp" element={<StudentAIInterpret />} />
              <Route path="terms" element={<StudentTerms />} />
              <Route path="cases" element={<StudentCases />} />
              <Route path="cases/:id" element={<StudentCaseDetail />} />
              <Route path="classes" element={<StudentClasses />} />
              <Route path="classes/:id" element={<StudentClassDetail />} />
              <Route path="assignments/:id" element={<StudentAssignmentDetail />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>
            {/* 兼容旧路径，重定向到新首页 */}
            <Route path="/student/dashboard" element={<Navigate to="/student" replace />} />
          </Route>

          {/* 受保护的教师路由（嵌套路由） */}
          <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
            <Route path="/teacher" element={<TeacherLayout />}>
              <Route index element={<TeacherHome />} />
              <Route path="ai" element={<TeacherAIChat />} />
              <Route path="classes" element={<TeacherClasses />} />
              <Route path="classes/:id" element={<TeacherClassDetail />} />
              <Route path="assignments" element={<TeacherAssignments />} />
              <Route path="assignments/:aid/submissions" element={<TeacherAssignmentSubmissions />} />
              <Route path="submissions/:sid" element={<TeacherSubmissionDetail />} />
              <Route path="analytics" element={<TeacherAnalytics />} />
              <Route path="terms" element={<TeacherTerms />} />
              <Route path="cases" element={<TeacherCases />} />
            </Route>
            <Route path="/teacher/dashboard" element={<Navigate to="/teacher" replace />} />
          </Route>

          {/* 其他所有路径可以重定向到首页 */}
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;