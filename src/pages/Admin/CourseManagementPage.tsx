import React from 'react';
import { Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import { Loader2 } from 'lucide-react';
import { useCourseManagement } from '@/hooks/useCourseManagement';
import CourseManagementHeader from '@/components/Admin/CourseManagementHeader';
import CourseManagementForms from '@/components/Admin/CourseManagementForms';
import CourseManagementContent from '@/components/Admin/CourseManagementContent';

const CourseManagementPage: React.FC = () => {
  const {
    // State
    courses,
    videos,
    questions,
    loading,
    selectedCourse,
    showAddCourse,
    showAddVideo,
    showAddQuestion,
    editingCourse,
    editingVideo,
    editingQuestion,
    hasAdminAccess,
    user,
    authLoading,
    
    // State setters
    setSelectedCourse,
    setShowAddCourse,
    setShowAddVideo,
    setShowAddQuestion,
    setEditingCourse,
    setEditingVideo,
    setEditingQuestion,
    
    // Handlers
    handleAddCourse,
    handleUpdateCourse,
    handleAddVideo,
    handleUpdateVideo,
    handleDeleteCourse,
    handleDeleteVideo,
    handleAddQuestion,
    handleUpdateQuestion,
    handleDeleteQuestion
  } = useCourseManagement();

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Check admin access - allow temporary admin or admin role
  const tempAdminAccess = localStorage.getItem('tempAdminAccess') === 'true';
  if (!hasAdminAccess && !tempAdminAccess) {
    return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth/login" replace />;
  }

  // Show loading while data is being fetched
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <CourseManagementHeader
          onAddCourse={() => setShowAddCourse(true)}
        />

        <CourseManagementForms
          showAddCourse={showAddCourse}
          showAddVideo={showAddVideo}
          showAddQuestion={showAddQuestion}
          selectedCourse={selectedCourse}
          questions={questions}
          onAddCourse={handleAddCourse}
          onCancelAddCourse={() => setShowAddCourse(false)}
          onAddVideo={handleAddVideo}
          onCancelAddVideo={() => setShowAddVideo(false)}
          onAddQuestion={handleAddQuestion}
          onCancelAddQuestion={() => setShowAddQuestion(false)}
        />

        <CourseManagementContent
          courses={courses}
          videos={videos}
          questions={questions}
          editingCourse={editingCourse}
          editingVideo={editingVideo}
          editingQuestion={editingQuestion}
          onEditCourse={(course) => setEditingCourse(course)}
          onSaveCourse={(course) => {
            handleUpdateCourse(course);
            setEditingCourse(null);
          }}
          onCancelEditCourse={() => setEditingCourse(null)}
          onDeleteCourse={handleDeleteCourse}
          onEditVideo={(video) => setEditingVideo(video)}
          onSaveVideo={(video) => {
            handleUpdateVideo(video);
            setEditingVideo(null);
          }}
          onCancelEditVideo={() => setEditingVideo(null)}
          onDeleteVideo={handleDeleteVideo}
          onEditQuestion={(question) => setEditingQuestion(question)}
          onSaveQuestion={(question) => {
            handleUpdateQuestion(question);
            setEditingQuestion(null);
          }}
          onCancelEditQuestion={() => setEditingQuestion(null)}
          onDeleteQuestion={handleDeleteQuestion}
          onAddVideo={(course) => {
            setSelectedCourse(course);
            setShowAddVideo(true);
          }}
          onAddQuestion={(course) => {
            setSelectedCourse(course);
            setShowAddQuestion(true);
          }}
          onShowAddCourse={() => setShowAddCourse(true)}
        />
      </div>
    </DashboardLayout>
  );
};

export default CourseManagementPage;