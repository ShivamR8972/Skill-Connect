from rest_framework import generics, permissions
from .models import Job, Application
from .serializers import JobSerializer, ApplicationSerializer
from profiles.permissions import IsRecruiter, IsFreelancer
from django.db.models import Q
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import generics
from django.db.models import Count
from profiles.models import FreelancerProfile, Notification
from django.contrib.auth import get_user_model
import PyPDF2
from django.http import Http404
from rest_framework.response import Response
from django.conf import settings
import json
from rest_framework.views import APIView
import google.generativeai as genai

User = get_user_model()

# Recruiter can create jobs
class JobCreateView(generics.CreateAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        job = serializer.save(recruiter=self.request.user)

        job_skills = job.skills.all()

        if not job_skills.exists():
            return

        target_users = User.objects.filter(
            role='freelancer',
            freelancer_profile__skills__in=job_skills
        ).distinct()

        notifications_to_create = [
            Notification(
                user=user,
                message=f"New job posted that matches your skills: '{job.title}'",
                link=f"/job-detail.html?id={job.id}" 
            )
            for user in target_users
        ]

        if notifications_to_create:
            Notification.objects.bulk_create(notifications_to_create)

# Recruiter can see their own jobs
class MyJobsView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_queryset(self):
        return Job.objects.filter(recruiter=self.request.user)

# Freelancers can browse all jobs
class JobListView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated, IsFreelancer]

    def get_queryset(self):
        # print("--- New Request ---")
        # print("Query Params Received:", self.request.query_params)
        qs = Job.objects.all().order_by("-created_at")
        # print("Initial queryset count:", qs.count())

        skills = self.request.query_params.getlist("skills")  # multiple IDs
        min_pay = self.request.query_params.get("min_pay")
        max_pay = self.request.query_params.get("max_pay")
        location = self.request.query_params.get("location")
        experience = self.request.query_params.get("experience")

        if skills:
            qs = qs.filter(skills__id__in=skills).distinct()
        if min_pay:
            qs = qs.filter(pay_per_hour__gte=min_pay)
        if max_pay:
            qs = qs.filter(pay_per_hour__lte=max_pay)
        if location:
            qs = qs.filter(location=location)
        if experience:
            qs = qs.filter(requirements__icontains=experience)

        return qs

# Both can retrieve details
class JobDetailView(generics.RetrieveAPIView):
    queryset = Job.objects.all()
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

# Freelancer applies to a job
class ApplyJobView(generics.CreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsFreelancer]

    def perform_create(self, serializer):
        job_id = self.request.data.get("job")
        freelancer_profile = self.request.user.freelancer_profile

        application = serializer.save(
            freelancer=self.request.user,
            job_id = job_id,
        )
        if freelancer_profile.resume:
            application.resume = freelancer_profile.resume
            application.save()
        job = application.job
        recruiter = job.recruiter
        freelancer_name = freelancer_profile.name or self.request.user.username
        
        Notification.objects.create(
            user=recruiter,
            message=f"You have a new application from {freelancer_name} for '{job.title}'.",
        )


class MyApplicationsView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsFreelancer]

    def get_queryset(self):
        # Start with the base queryset for the logged-in user
        queryset = Application.objects.filter(freelancer=self.request.user)

        # Get 'status' from URL parameters (e.g., ?status=accepted)
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)

        # Get 'ordering' from URL parameters (e.g., ?ordering=-created_at)
        ordering = self.request.query_params.get('ordering')
        if ordering in ['created_at', '-created_at']: # Check for valid options
            queryset = queryset.order_by(ordering)
        else:
            # Default to newest first if no valid ordering is provided
            queryset = queryset.order_by('-created_at')

        return queryset
    
# Recruiter views applications for their jobs
class ApplicationsForMyJobsView(generics.ListAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_queryset(self):
        return Application.objects.filter(job__recruiter=self.request.user).select_related("job", "freelancer")


# Recruiter can delete their own job
class JobDeleteView(generics.DestroyAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_queryset(self):
        # Only allow recruiters to delete jobs they own
        return Job.objects.filter(recruiter=self.request.user)
    
# Recruiter can edit their own job
class JobUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_queryset(self):
        return Job.objects.filter(recruiter=self.request.user)

#recruiter can manage the applications for their own job

class ApplicationStatusUpdateView(generics.UpdateAPIView):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_queryset(self):
        # Only recruiters can update applications for *their own jobs*
        return Application.objects.filter(job__recruiter=self.request.user)
    
class JobRecommendationView(generics.ListAPIView):
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated, IsFreelancer]

    def get_queryset(self):
        user = self.request.user
        
        try:
            user_skills = user.freelancer_profile.skills.all()
        except FreelancerProfile.DoesNotExist:
            return Job.objects.none() 

        if not user_skills.exists():
            return Job.objects.none() 

        applied_job_ids = Application.objects.filter(freelancer=user).values_list('job_id', flat=True)

        recommended_jobs = Job.objects.filter(
            skills__in=user_skills
        ).exclude(
            id__in=applied_job_ids
        ).distinct().order_by('-created_at')[:5] 
        
        return recommended_jobs

class ResumeAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def post(self, request, *args, **kwargs):
        try:
            application = Application.objects.get(pk=self.kwargs.get('pk'), job__recruiter=request.user)
        except Application.DoesNotExist:
            raise Http404

        if not application.resume or not application.resume.path:
            return Response({'error': 'No resume file found for this application.'}, status=400)

        try:
            resume_text = ""
            with application.resume.open('rb') as f:
                reader = PyPDF2.PdfReader(f)
                if reader.is_encrypted:
                    return Response({'error': 'The resume PDF is encrypted and cannot be read.'}, status=400)
                for page in reader.pages:
                    resume_text += page.extract_text()
            
            if not resume_text.strip():
                return Response({'error': 'Could not extract any text from the resume PDF.'}, status=400)

            job = application.job
            job_requirements = f"Title: {job.title}\nRequirements: {job.requirements}\nSkills: {', '.join([skill.name for skill in job.skills.all()])}"

            genai.configure(api_key=settings.GOOGLE_API_KEY)
            model = genai.GenerativeModel('models/gemini-2.5-pro')

            prompt = (
                "You are an expert HR assistant. Your task is to analyze a candidate's resume against a job description. "
                "Based on the provided job requirements and resume text, provide ONLY a raw JSON object with the following structure: "
                "{'match_score': <a number between 0 and 100>, "
                "'summary': '<a one-paragraph summary of the candidate's strengths and weaknesses for this role>', "
                "'matched_skills': [<a list of skills from the job requirements that are present in the resume>], "
                "'missing_skills': [<a list of skills from the job requirements that are NOT found in the resume>]}."
                "\n\n--- JOB REQUIREMENTS ---\n"
                f"{job_requirements}"
                "\n\n--- RESUME TEXT ---\n"
                f"{resume_text}"
            )

            response = model.generate_content(prompt)
            
            try:
                cleaned_text = response.text.strip().replace('```json', '').replace('```', '').strip()
                json_response = json.loads(cleaned_text)
                return Response(json_response)
            except json.JSONDecodeError:
                print("--- AI RESPONSE WAS NOT VALID JSON ---")
                print(response.text)
                print("------------------------------------")
                raise Exception("The AI response was not in a valid JSON format.")


        except Exception as e:
            print(f"Resume Analysis Error: {e}")
            return Response({'error': 'An error occurred during AI analysis. See server logs for details.'}, status=500)