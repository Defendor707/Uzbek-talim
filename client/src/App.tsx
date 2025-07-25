import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PWAInstall from "@/components/PWAInstall";
import OfflineIndicator from "@/components/OfflineIndicator";
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
import CenterProfile from "@/pages/center/CenterProfile";
import Teachers from "@/pages/center/Teachers";
import Students from "@/pages/center/Students";
import ChildrenPage from "@/pages/parent/ChildrenPage";
import NotificationsPage from "@/pages/NotificationsPage";
import NotificationSettings from "@/pages/parent/NotificationSettings";
import ParentResults from "@/pages/parent/ParentResults";
import LessonsPage from "@/pages/teacher/Lessons";
import CreateLesson from "@/pages/teacher/CreateLesson";
import ViewLesson from "@/pages/teacher/ViewLesson";
import TestsPage from "@/pages/teacher/Tests";
import CreateTestPage from "@/pages/teacher/CreateTestSimple";
import EditTestPage from "@/pages/teacher/EditTest";
import TestTypeSelection from "@/pages/teacher/TestTypeSelection";
import StudentsPage from "@/pages/teacher/Students";
import StudentTestsPage from "@/pages/student/Tests";
import StudentLessonsPage from "@/pages/student/Lessons";
import StudentViewLesson from "@/pages/student/ViewLesson";
import TakeTestNew from "@/pages/student/TakeTestNew";
import TestResult from "@/pages/student/TestResult";
import TeacherSearchCenters from "@/pages/teacher/SearchCenters";
import StudentSearchCenters from "@/pages/student/SearchCenters";
import ParentSearchCenters from "@/pages/parent/SearchCenters";

import ProtectedRoute from "@/components/ProtectedRoute";
import useAuth from "@/hooks/useAuth";
import { useEffect } from "react";

function Router() {
  const { user, token, isLoadingUser } = useAuth();
  const [location, setLocation] = useLocation();

  // Block token removal on app level
  useEffect(() => {
    console.log('🚀 App router initialized, protecting localStorage');
    
    // Force token persistence on every app load
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      console.log('💾 Reinforcing token in localStorage');
      localStorage.setItem('token', storedToken);
    }
    
    // Ultra-protective localStorage blocking
    const originalRemoveItem = localStorage.removeItem;
    const originalClear = localStorage.clear;
    
    localStorage.removeItem = function(key) {
      if (key === 'token') {
        console.log('🛡️ BLOCKING localStorage.removeItem("token") - manual logout only');
        return;
      }
      return originalRemoveItem.call(this, key);
    };
    
    localStorage.clear = function() {
      console.log('🛡️ BLOCKING localStorage.clear() - preserving token');
      const token = localStorage.getItem('token');
      originalClear.call(this);
      if (token) {
        localStorage.setItem('token', token);
      }
    };
    
    return () => {
      localStorage.removeItem = originalRemoveItem;
      localStorage.clear = originalClear;
    };
  }, []);

  // Auto-redirect authenticated users from login/register pages
  useEffect(() => {
    if (token && user && !isLoadingUser && (location === '/' || location === '/login' || location === '/register')) {
      setLocation(`/dashboard/${(user as any).role}`);
    }
  }, [token, user, isLoadingUser, location, setLocation]);

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
      <Route path="/teacher/lessons/create">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <CreateLesson />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/lessons/:id">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <ViewLesson />
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
      <Route path="/teacher/search-centers">
        <ProtectedRoute allowedRoles={["teacher"]}>
          <TeacherSearchCenters />
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
      <Route path="/student/lessons">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentLessonsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/student/lessons/:id">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentViewLesson />
        </ProtectedRoute>
      </Route>
      <Route path="/student/test/:testId">
        <ProtectedRoute allowedRoles={["student"]}>
          <TakeTestNew />
        </ProtectedRoute>
      </Route>
      <Route path="/student/test-result/:attemptId">
        <ProtectedRoute allowedRoles={["student"]}>
          <TestResult />
        </ProtectedRoute>
      </Route>
      <Route path="/student/search-centers">
        <ProtectedRoute allowedRoles={["student"]}>
          <StudentSearchCenters />
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
      <Route path="/parent/notification-settings">
        <ProtectedRoute allowedRoles={["parent"]}>
          <NotificationSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/parent/results">
        <ProtectedRoute allowedRoles={["parent"]}>
          <ParentResults />
        </ProtectedRoute>
      </Route>
      <Route path="/parent/search-centers">
        <ProtectedRoute allowedRoles={["parent"]}>
          <ParentSearchCenters />
        </ProtectedRoute>
      </Route>
      
      {/* Center routes */}
      <Route path="/center/profile">
        <ProtectedRoute allowedRoles={["center"]}>
          <CenterProfile />
        </ProtectedRoute>
      </Route>
      <Route path="/center/notifications">
        <ProtectedRoute allowedRoles={["center"]}>
          <NotificationsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/center/teachers">
        <ProtectedRoute allowedRoles={["center"]}>
          <Teachers />
        </ProtectedRoute>
      </Route>
      <Route path="/center/students">
        <ProtectedRoute allowedRoles={["center"]}>
          <Students />
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
        <OfflineIndicator />
        <Toaster />
        <Router />
        <PWAInstall />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
