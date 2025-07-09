
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
    loading,
    selectedCourse,
    showAddCourse,
    showAddVideo,
    editingCourse,
    editingVideo,
    hasAdminAccess,
    user,
    authLoading,
    
    // State setters
    setSelectedCourse,
    setShowAddCourse,
    setShowAddVideo,
    setEditingCourse,
    setEditingVideo,
    
    // Handlers
    handleAddCourse,
    handleUpdateCourse,
    handleAddVideo,
    handleUpdateVideo,
    handleDeleteCourse,
    handleDeleteVideo
  } = useCourseManagement();

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Check for temporary admin access
  const isTempAdmin = localStorage.getItem('tempAdmin') === 'true';

  // Redirect if no admin access
  if (!hasAdminAccess && !isTempAdmin) {
    if (!user && !isTempAdmin) {
      return <Navigate to="/login" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading courses...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <CourseManagementHeader onAddCourse={() => setShowAddCourse(true)} />

        <CourseManagementForms
          showAddCourse={showAddCourse}
          showAddVideo={showAddVideo}
          selectedCourse={selectedCourse}
          onAddCourse={handleAddCourse}
          onCancelAddCourse={() => setShowAddCourse(false)}
          onAddVideo={handleAddVideo}
          onCancelAddVideo={() => {
            setShowAddVideo(false);
            setSelectedCourse(null);
          }}
        />
        
        <CourseManagementContent
          courses={courses}
          videos={videos}
          editingCourse={editingCourse}
          editingVideo={editingVideo}
          onEditCourse={setEditingCourse}
          onSaveCourse={handleUpdateCourse}
          onCancelEditCourse={() => setEditingCourse(null)}
          onEditVideo={setEditingVideo}
          onSaveVideo={handleUpdateVideo}
          onCancelEditVideo={() => setEditingVideo(null)}
          onDeleteCourse={handleDeleteCourse}
          onDeleteVideo={handleDeleteVideo}
          onAddVideo={(course) => {
            setSelectedCourse(course);
            setShowAddVideo(true);
          }}
          onShowAddCourse={() => setShowAddCourse(true)}
        />
      </div>
    </DashboardLayout>
  );
};

export default CourseManagementPage;
