import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import TeacherDashboard from "@/pages/dashboard/TeacherDashboard";
import StudentDashboard from "@/pages/dashboard/StudentDashboard";
import ParentDashboard from "@/pages/dashboard/ParentDashboard";
import CenterDashboard from "@/pages/dashboard/CenterDashboard";
import TeacherProfile from "@/pages/teacher/TeacherProfile";
import StudentProfile from "@/pages/student/StudentProfile";
import ParentProfile from "@/pages/parent/ParentProfile";
import ChildrenPage from "@/pages/parent/ChildrenPage";
import NotificationsPage from "@/pages/NotificationsPage";
import LessonsPage from "@/pages/teacher/Lessons";
import TestsPage from "@/pages/teacher/Tests";
import CreateTestPage from "@/pages/teacher/CreateTestSimple";
import EditTestPage from "@/pages/teacher/EditTest";
import TestTypeSelection from "@/pages/teacher/TestTypeSelection";
import StudentsPage from "@/pages/teacher/Students";
import StudentTestsPage from "@/pages/student/Tests";
import TakeTestPage from "@/pages/student/TakeTest";
import ProtectedRoute from "@/components/ProtectedRoute";
import useAuth from "@/hooks/useAuth";
import { useEffect } from "react";

function Router() {
  const { user, token, isLoadingUser } = useAuth();
  const [location, setLocation] = useLocation();

  // Auto-redirect authenticated users from login/register pages
  useEffect(() => {
    if (token && user && (location === '/' || location === '/login' || location === '/register')) {
      setLocation(`/dashboard/${user.role}`);
    }
  }, [token, user, location, setLocation]);

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      
      {/* Protected routes - Dashboard */}
      <Route path="/dashboard/teacher">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/student">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/parent">
        <ProtectedRoute allowedRoles={["parent"]}>
          <ParentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/center">
        <ProtectedRoute allowedRoles={["center"]}>
          <CenterDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Teacher routes */}
      <Route path="/teacher/profile">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/notifications">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <NotificationsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/lessons">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <LessonsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/tests">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TestsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/test-types">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TestTypeSelection />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/create-test">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <CreateTestPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/tests/edit/:id">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <EditTestPage />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/students">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <StudentsPage />
        </ProtectedRoute>
      </Route>
      
      {/* Student routes */}
      <Route path="/student/profile">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/student/notifications">
        <ProtectedRoute allowedRoles={["student"]}>
          <NotificationsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/student/tests">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentTestsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/student/test/:testId">
        <ProtectedRoute allowedRoles={["student"]}>
          <TakeTestPage />
        </ProtectedRoute>
      </Route>
      
      {/* Parent routes */}
      <Route path="/parent/profile">
        <ProtectedRoute allowedRoles={["parent"]}>
          <ParentProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/parent/notifications">
        <ProtectedRoute allowedRoles={["parent"]}>
          <NotificationsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/parent/children">
        <ProtectedRoute allowedRoles={["parent"]}>
          <ChildrenPage />
        </ProtectedRoute>
      </Route>
      
      {/* Center routes */}
      <Route path="/center/notifications">
        <ProtectedRoute allowedRoles={["center"]}>
          <NotificationsPage />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
