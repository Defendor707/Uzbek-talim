import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import TeacherDashboard from "@/pages/dashboard/TeacherDashboard";
import StudentDashboard from "@/pages/dashboard/StudentDashboard";
import ParentDashboard from "@/pages/dashboard/ParentDashboard";
import CenterDashboard from "@/pages/dashboard/CenterDashboard";
import LessonsPage from "@/pages/teacher/Lessons";
import TestsPage from "@/pages/teacher/Tests";
import StudentsPage from "@/pages/teacher/Students";
import StudentTestsPage from "@/pages/student/Tests";
import ProtectedRoute from "@/components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LoginPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      
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
      <Route path="/teacher/students">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <StudentsPage />
        </ProtectedRoute>
      </Route>
      
      {/* Student routes */}
      <Route path="/student/tests">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentTestsPage />
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
