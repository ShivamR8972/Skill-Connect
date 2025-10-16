from rest_framework.permissions import BasePermission
from jobs.models import Application
from rest_framework import permissions

class IsRecruiter(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "recruiter")

class IsFreelancer(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "freelancer")
    
class CanSubmitReviewPermission(permissions.BasePermission):
    message = 'You can only submit a review for a job application that has been accepted.'

    def has_permission(self, request, view):
        user = request.user
        job_id = request.data.get('job')
        reviewee_id = request.data.get('reviewee')

        if not job_id or not reviewee_id:
            return False

        if user.role == 'freelancer':
            return Application.objects.filter(
                job_id=job_id,
                freelancer=user,
                job__recruiter_id=reviewee_id,
                status='accepted'
            ).exists()
        
        elif user.role == 'recruiter':
            return Application.objects.filter(
                job_id=job_id,
                job__recruiter=user,
                freelancer_id=reviewee_id,
                status='accepted'
            ).exists()

        return False
