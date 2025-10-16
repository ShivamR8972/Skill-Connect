from rest_framework import generics, permissions
from .models import RecruiterProfile, FreelancerProfile, Skill, Notification, Review, Testimonial
from .serializers import RecruiterProfileSerializer, FreelancerProfileSerializer, SkillSerializer, NotificationSerializer, ReviewSerializer, CompanyListSerializer, TopFreelancerSerializer, TestimonialSerializer
from .permissions import IsRecruiter, IsFreelancer, CanSubmitReviewPermission
from rest_framework.parsers import MultiPartParser, FormParser
from jobs.models import Application, Job
from django.db.models import Avg
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
import google.generativeai as genai
import re

class MeRecruiterProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = RecruiterProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsRecruiter]

    def get_object(self):
        return self.request.user.recruiter_profile

class SkillListView(generics.ListAPIView):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [permissions.AllowAny]  # public endpoint

class MeFreelancerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = FreelancerProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsFreelancer]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user.freelancer_profile
    
class MyNotificationsView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.notifications.all().order_by('-created_at')


class MarkNotificationReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
class ReviewCreateView(generics.CreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated, CanSubmitReviewPermission]

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)

class UserReviewsListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_pk = self.kwargs.get('user_pk')
        return Review.objects.filter(reviewee_id=user_pk)

class CompanyListView(generics.ListAPIView):
    queryset = RecruiterProfile.objects.filter(
        company_name__isnull=False
    ).exclude(
        company_name__exact=''
    ).order_by('company_name')
    
    serializer_class = CompanyListSerializer
    permission_classes = [permissions.AllowAny] 

class TopFreelancersListView(generics.ListAPIView):
    serializer_class = TopFreelancerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = FreelancerProfile.objects.annotate(
            avg_rating=Avg('user__reviews_received__rating')
        )
        return queryset.filter(avg_rating__isnull=False).order_by('-avg_rating')[:5]
    
class TestimonialCreateView(generics.CreateAPIView):
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class TestimonialListView(generics.ListAPIView):
    queryset = Testimonial.objects.filter(is_approved=True).order_by('-created_at')
    serializer_class = TestimonialSerializer
    permission_classes = [permissions.AllowAny]


# In profiles/views.py

class ChatbotAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user_message = request.data.get('message', '').lower()
        user = request.user
        data_from_db = None

        # --- Intent Routing based on Keywords ---
        try:
            if user.role == 'freelancer':
                if "status of my application" in user_message:
                    data_from_db = self._handle_get_application_status(user_message, user)
                elif "how many" in user_message and "application" in user_message:
                    data_from_db = self._handle_count_applications(user_message, user)
                elif "show me" in user_message and "job" in user_message:
                    data_from_db = self._handle_find_jobs(user_message, user)

            elif user.role == 'recruiter':
                if "how many new application" in user_message:
                    data_from_db = self._handle_count_recruiter_applications(user_message, user)
                elif "list the freelancer" in user_message or "who applied" in user_message:
                    data_from_db = self._handle_list_applicants(user_message, user)
            
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            model = genai.GenerativeModel('models/gemini-2.5-pro')

            if data_from_db:
                prompt = (
                    f"You are a helpful assistant for the SkillConnect platform. A user asked a question, and I have retrieved the following data from the database: '{data_from_db}'. "
                    f"Based on this data, please formulate a friendly and natural language response to the user's original question: '{user_message}'"
                )
            else:
                prompt = (
                    "You are a friendly and helpful assistant for a web platform called SkillConnect. "
                    "SkillConnect connects freelancers with recruiters. Your role is to answer user questions about the platform. "
                    f"Please answer the following user question: '{user_message}'"
                )

            response = model.generate_content(prompt)
            return Response({'reply': response.text})

        except Exception as e:
            print(f"Chatbot Error: {e}")
            return Response({'error': 'An error occurred with the AI service.'}, status=500)

    
    def _extract_text_in_quotes(self, text):
        matches = re.findall(r"['\"](.*?)['\"]", text)
        return matches[0] if matches else None

    def _handle_get_application_status(self, message, user):
        job_title = self._extract_text_in_quotes(message)
        if not job_title:
            return "Please specify the job title in quotes, like \"Senior Python Developer\"."
        
        try:
            application = Application.objects.get(freelancer=user, job__title__iexact=job_title)
            return f"The status is '{application.get_status_display()}'."
        except Application.DoesNotExist:
            return f"Application for '{job_title}' not found."

    def _handle_count_applications(self, message, user):
        status_map = {'accepted': 'accepted', 'pending': 'applied', 'rejected': 'rejected'}
        status_keyword = next((s for s in status_map if s in message), None)
        
        queryset = Application.objects.filter(freelancer=user)
        if status_keyword:
            count = queryset.filter(status=status_map[status_keyword]).count()
            return f"Found {count} {status_keyword} applications."
        else:
            count = queryset.count()
            return f"Found {count} total applications."

    def _handle_find_jobs(self, message, user):
        parts = message.split("that require")
        if len(parts) < 2:
            return "Please specify the skills you're looking for, e.g., 'Show me remote jobs that require \"Python\"'."
        
        skill_name = self._extract_text_in_quotes(parts[1])
        if not skill_name:
            return "Please put the skill name in quotes."

        jobs = Job.objects.filter(skills__name__iexact=skill_name)[:5]
        if not jobs:
            return f"No jobs found requiring '{skill_name}'."
        
        job_titles = [job.title for job in jobs]
        return f"Found {len(job_titles)} jobs: {', '.join(job_titles)}."

    def _handle_count_recruiter_applications(self, message, user):
        job_title = self._extract_text_in_quotes(message)
        if not job_title:
            return "Please specify the job title in quotes."
            
        count = Application.objects.filter(job__recruiter=user, job__title__iexact=job_title).count()
        return f"Found {count} applications for '{job_title}'."

    def _handle_list_applicants(self, message, user):
        job_title = self._extract_text_in_quotes(message)
        if not job_title:
            return "Please specify the job title in quotes."

        applications = Application.objects.filter(job__recruiter=user, job__title__iexact=job_title)
        if not applications:
            return f"No applicants found for '{job_title}'."
        
        applicant_names = [app.freelancer.username for app in applications]
        return f"Applicants for '{job_title}': {', '.join(applicant_names)}."