
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../page/LoginPage';
import HomePage from '../page/home';
import BoardPage from '../page/board';
import UserManagementPage from '../page/userManagement';
import TaskDetailPage from '../page/taskDetail';
import UserDashboardPage from '../page/userDashboard';
import DepartmentManagementPage from '../page/departmentManagement';
import TeamManagementPage from '../page/teamManagement';
import ProjectManagementPage from '../page/projectManagement';
import ProjectEvaluationPage from '../page/projectEvaluation';
import ProjectEvaluationsListPage from '../page/projectEvaluationsList';
import ProjectEvaluationDetailPage from '../page/projectEvaluationDetail';
import SystemSettingsPage from '../page/systemSettings';
import MyDayPage from '../page/myDay';
import { isLoggedIn } from '../helper/auth';
import { RoleProtectedRoute } from '../components/RoleProtectedRoute';
const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  if (!isLoggedIn()) {
    const currentPath = window.location.pathname + window.location.search;
    sessionStorage.setItem('redirectPath', currentPath);
    return <Navigate to="/login" replace />;
  }
  return children;
};
export const router = createBrowserRouter(
  [
    { 
      path: '/login', 
      element: <LoginPage /> 
    },
    { 
      path: '/board', 
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    )
    },
    { 
      path: '/board/:boardId', 
    element: (
      <ProtectedRoute>
        <BoardPage />
      </ProtectedRoute>
    )
    },
    { 
      path: '/board/:projectId/task/:taskId', 
    element: (
      <ProtectedRoute>
        <TaskDetailPage />
      </ProtectedRoute>
    )
    },
    { 
      path: '/dashboard/users', 
    element: (
      <ProtectedRoute>
        <UserDashboardPage />
      </ProtectedRoute>
    )
    },
    { 
      path: '/users', 
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute roles={['system_admin']}>
          <UserManagementPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
    },
    { 
      path: '/departments', 
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute roles={['system_admin', 'department_manager']}>
          <DepartmentManagementPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
    },
    { 
      path: '/teams', 
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute roles={['system_admin', 'department_manager', 'team_lead']}>
          <TeamManagementPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
    },
    { 
      path: '/projects', 
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute roles={['system_admin', 'team_lead', 'project_manager']}>
          <ProjectManagementPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
    },
    { 
      path: '/projects/:projectId/evaluation', 
    element: (
      <ProtectedRoute>
        <ProjectEvaluationPage />
      </ProtectedRoute>
    )
    },
    { 
      path: '/project-evaluations', 
    element: (
      <ProtectedRoute>
        <ProjectEvaluationsListPage />
      </ProtectedRoute>
    )
    },
    { 
      path: '/projects/:projectId/evaluation/detail', 
    element: (
      <ProtectedRoute>
        <ProjectEvaluationDetailPage />
      </ProtectedRoute>
    )
    },
    { 
      path: '/system-settings', 
    element: (
      <ProtectedRoute>
        <RoleProtectedRoute roles={['system_admin']}>
          <SystemSettingsPage />
        </RoleProtectedRoute>
      </ProtectedRoute>
    )
    },
    { 
      path: '/my-day', 
    element: (
      <ProtectedRoute>
        <MyDayPage />
      </ProtectedRoute>
    )
  },
    { 
      path: '/', 
      element: isLoggedIn() ? <Navigate to="/board" replace /> : <Navigate to="/login" replace />
    },
  ],
  {
    basename: import.meta.env.BASE_URL || '/',
  }
);