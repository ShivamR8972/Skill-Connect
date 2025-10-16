from django.urls import path
from .views import (
    JobCreateView, MyJobsView, JobListView, JobDetailView, JobUpdateView,
    ApplyJobView, MyApplicationsView, ApplicationsForMyJobsView, JobDeleteView, ApplicationStatusUpdateView, JobRecommendationView, ResumeAnalysisView
)

urlpatterns = [
    # Jobs
    path("job/create/", JobCreateView.as_view(), name="job-create"),
    path("job/my/", MyJobsView.as_view(), name="my-jobs"),
    path("job/", JobListView.as_view(), name="job-list"),
    path("job/<int:pk>/", JobDetailView.as_view(), name="job-detail"),
    path("job/<int:pk>/delete/", JobDeleteView.as_view(), name="job-delete"),
    path("job/<int:pk>/edit/", JobUpdateView.as_view(),name="job-edit"),
    path("job/recommendations/", JobRecommendationView.as_view(), name="job-recommendations"),

    # Applications
    path("application/apply/", ApplyJobView.as_view(), name="apply-job"),
    path("application/my/", MyApplicationsView.as_view(), name="my-applications"),
    path("application/recruiter/", ApplicationsForMyJobsView.as_view(), name="applications-for-my-jobs"),
    path("application/<int:pk>/status/", ApplicationStatusUpdateView.as_view(), name="application-status"),
    path("application/<int:pk>/analyze-resume/", ResumeAnalysisView.as_view(), name="analyze-resume"),
]
